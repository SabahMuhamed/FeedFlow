const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const supabase = require("./supabase");

class InstagramSession {
    constructor(sessionDir) {
        this.sessionDir = sessionDir;
        this.browser = null;
        this.context = null;
        this.page = null;
        this.username = null;
        this.statusCallbacks = [];
    }

    onStatus(callback) {
        this.statusCallbacks.push(callback);
    }

    _emitStatus(status, data = {}) {
        const payload = {
            username: this.username,
            status,
            ...data,
            timestamp: new Date().toISOString(),
        };
        this.statusCallbacks.forEach(cb => cb(payload));
    }

    _sessionPath(username) {
        return path.join(this.sessionDir, `${username}.json`);
    }

    _humanDelay(min = 1000, max = 3000) {
        return new Promise(r =>
            setTimeout(r, Math.floor(Math.random() * (max - min) + min))
        );
    }

    async _humanType(page, text) {
        for (const char of text) {
            await page.keyboard.type(char, {
                delay: Math.floor(Math.random() * 80 + 40),
            });
        }
    }

    async launch() {
        this.browser = await chromium.launch({
            headless: process.env.BROWSER_HEADLESS === "true",
            args: [
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-infobars",
                "--window-size=390,844",
            ],
        });
    }

    async login(username, password) {
        this.username = username;
        const sessionPath = this._sessionPath(username);

        this._emitStatus("launching_browser");

        // Try saved session first
        if (fs.existsSync(sessionPath)) {
            try {
                const storageState = JSON.parse(
                    fs.readFileSync(sessionPath, "utf8")
                );
                this.context = await this.browser.newContext({
                    viewport: { width: 390, height: 844 },
                    userAgent:
                        "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36",
                    storageState,
                    locale: "en-US",
                });
                this.page = await this.context.newPage();
                await this.page.addInitScript(() => {
                    Object.defineProperty(navigator, "webdriver", {
                        get: () => undefined,
                    });
                    window.chrome = { runtime: {} };
                });

                this._emitStatus("checking_session");
                await this.page.goto("https://www.instagram.com/", {
                    timeout: 30000,
                });
                await this._humanDelay(3000, 5000);

                const isLoggedIn = await this.page.evaluate(() => {
                    return (
                        document.querySelector('[aria-label="Home"]') !== null ||
                        document.querySelector('a[href="/direct/inbox/"]') !== null ||
                        document.querySelector('svg[aria-label="Home"]') !== null
                    );
                });

                if (isLoggedIn) {
                    this._emitStatus("connected", { method: "session_restore" });
                    return { success: true, method: "session_restore" };
                }

                await this.context.close();
                this._emitStatus("session_expired");
            } catch (e) {
                console.error("Session restore failed:", e.message);
                if (this.context)
                    await this.context.close().catch(() => { });
            }
        }

        // Fresh login
        this.context = await this.browser.newContext({
            viewport: { width: 390, height: 844 },
            userAgent:
                "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36",
            locale: "en-US",
        });
        this.page = await this.context.newPage();
        await this.page.addInitScript(() => {
            Object.defineProperty(navigator, "webdriver", {
                get: () => undefined,
            });
            window.chrome = { runtime: {} };
        });

        this._emitStatus("navigating_to_login");
        await this.page.goto(
            "https://www.instagram.com/accounts/login/",
            { timeout: 30000, waitUntil: "networkidle" }
        );
        await this._humanDelay(3000, 5000);

        // Handle cookie consent
        try {
            const cookieBtn = await this.page.$(
                "button:has-text('Allow')"
            );
            if (cookieBtn) await cookieBtn.click();
            await this._humanDelay(1000, 1500);
        } catch { }

        // ── FIXED: Wait for login form to fully render ──
        await this.page.waitForSelector('input[name="username"]', {
            timeout: 15000,
        });
        await this._humanDelay(1000, 2000);

        // Fill username with human-like typing
        const usernameInput = await this.page.$('input[name="username"]');
        await usernameInput.click();
        await this._humanDelay(400, 800);
        await usernameInput.fill("");
        await this._humanDelay(200, 400);
        await this._humanType(this.page, username);
        await this._humanDelay(500, 1000);

        // Fill password
        const passwordInput = await this.page.$('input[name="password"]');
        await passwordInput.click();
        await this._humanDelay(400, 800);
        await passwordInput.fill("");
        await this._humanDelay(200, 400);
        await this._humanType(this.page, password);
        await this._humanDelay(800, 1500);

        // ── FIXED: Better login button click ──
        // Instagram's login button can be a button[type="submit"] or a div[role="button"]
        let loginClicked = false;

        // Strategy 1: Try button[type="submit"]
        let loginBtn = await this.page.$('button[type="submit"]');
        if (loginBtn) {
            const isDisabled = await loginBtn.getAttribute("disabled");
            if (!isDisabled) {
                await loginBtn.click();
                loginClicked = true;
            }
        }

        // Strategy 2: Try the login div with role="button"
        if (!loginClicked) {
            loginBtn = await this.page.$('div[role="button"]:has-text("Log in")');
            if (!loginBtn) {
                loginBtn = await this.page.$('button:has-text("Log in")');
            }
            if (!loginBtn) {
                // Last resort: find any visible button inside the form
                loginBtn = await this.page.$('form input[type="submit"], form button');
            }
            if (loginBtn) {
                await loginBtn.click();
                loginClicked = true;
            }
        }

        if (!loginClicked) {
            // Fallback: press Enter on the password field
            await this.page.keyboard.press("Enter");
        }

        this._emitStatus("logging_in");
        await this._humanDelay(5000, 8000);

        // Handle "Save Info" popup
        try {
            const notNow = await this.page.$(
                "button:has-text('Not now')"
            );
            if (notNow) await notNow.click();
            await this._humanDelay(1500, 2500);
        } catch { }

        // Handle notifications
        try {
            const notNow2 = await this.page.$(
                "button:has-text('Not Now')"
            );
            if (notNow2) await notNow2.click();
            await this._humanDelay(1500, 2500);
        } catch { }

        // Handle "Turn on" popups
        try {
            const cancelBtn = await this.page.$('button:has-text("Cancel")');
            if (cancelBtn) await cancelBtn.click();
            await this._humanDelay(1000, 2000);
        } catch { }

        // Check login success — use multiple signals
        const loggedIn = await this.page.evaluate(() => {
            return (
                document.querySelector('[aria-label="Home"]') !== null ||
                document.querySelector('a[href="/direct/inbox/"]') !== null ||
                document.querySelector('svg[aria-label="Home"]') !== null ||
                document.querySelector('nav') !== null
            );
        });

        if (loggedIn) {
            const storageState = await this.context.storageState();
            fs.writeFileSync(sessionPath, JSON.stringify(storageState));
            this._emitStatus("connected", { method: "fresh_login" });

            await supabase
                .from("instagram_accounts")
                .upsert([
                    {
                        instagram_username: username,
                        status: "connected",
                        automation_status: "stopped",

                        session_connected: true,
                        connected_at: new Date().toISOString(),
                        last_sync: new Date().toISOString(),
                    },
                ])
                .select();

            return { success: true, method: "fresh_login" };
        }

        // Check for 2FA
        try {
            const challengeInput = await this.page.$("input#security_code");
            if (challengeInput) {
                this._emitStatus("challenge_required", {
                    message: "Verification code sent to your email or SMS",
                });
                return {
                    success: false,
                    error: "CHALLENGE_REQUIRED",
                    needsChallenge: true,
                };
            }
        } catch { }

        // Check for suspicious login attempt
        const pageText = await this.page.textContent("body");
        if (pageText.includes("suspicious") || pageText.includes("unusual")) {
            this._emitStatus("suspicious_login");
            return {
                success: false,
                error: "Login flagged as suspicious — may need email verification",
            };
        }

        this._emitStatus("login_failed");
        // Take screenshot for debugging
        try {
            await this.page.screenshot({
                path: `login_failed_${username}.png`,
            });
        } catch { }

        return {
            success: false,
            error: "Login failed — check credentials or solve challenge manually",
        };
    }

    async submitChallengeCode(code) {
        try {
            const challengeInput = await this.page.$(
                "input#security_code"
            );
            if (!challengeInput)
                return { success: false, error: "No challenge input" };

            await challengeInput.click();
            await this._humanDelay(300, 500);
            await this._humanType(this.page, code);
            await this._humanDelay(1000, 2000);

            // Try clicking submit button
            let submitClicked = false;
            const submitBtn = await this.page.$('button[type="button"]');
            if (submitBtn) {
                await submitBtn.click();
                submitClicked = true;
            }
            if (!submitClicked) {
                await this.page.keyboard.press("Enter");
            }

            await this._humanDelay(5000, 8000);

            // Handle post-challenge popups
            try {
                const notNow = await this.page.$(
                    "button:has-text('Not now')"
                );
                if (notNow) await notNow.click();
                await this._humanDelay(1000, 2000);
            } catch { }

            const loggedIn = await this.page.evaluate(() => {
                return (
                    document.querySelector('[aria-label="Home"]') !== null ||
                    document.querySelector('a[href="/direct/inbox/"]') !== null ||
                    document.querySelector('svg[aria-label="Home"]') !== null
                );
            });

            if (loggedIn) {
                const storageState = await this.context.storageState();
                fs.writeFileSync(
                    this._sessionPath(this.username),
                    JSON.stringify(storageState)
                );
                this._emitStatus("connected", {
                    method: "challenge_resolved",
                });

                await supabase
                    .from("instagram_accounts")
                    .upsert({
                        session_connected: true,
                        connected_at: new Date().toISOString(),
                    })
                    .eq("instagram_username", this.username);

                return { success: true };
            }
            return {
                success: false,
                error: "Challenge code may be incorrect",
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // ──────────────────────────────────────────────
    //  ACTIONS
    // ──────────────────────────────────────────────

    // ─── Action: view_profile ───
    async visitProfile(targetUsername) {
        console.log(`  👤 [view_profile] @${targetUsername}`);
        try {
            await this.page.goto(
                `https://www.instagram.com/${targetUsername}/`,
                {
                    timeout: 25000,
                    waitUntil: "networkidle",
                }
            );
            await this._humanDelay(3000, 5000);

            // Scroll to simulate browsing
            for (let i = 0; i < 3; i++) {
                await this.page.evaluate(() => window.scrollBy(0, 400));
                await this._humanDelay(800, 1500);
            }

            // Hover over a couple posts
            const postLinks = await this.page.$$('article a');
            if (postLinks.length > 0) {
                const hoverTarget = postLinks[Math.floor(Math.random() * Math.min(postLinks.length, 6))];
                await hoverTarget.hover();
                await this._humanDelay(1000, 2000);
            }

            const browseTime = Math.floor(Math.random() * 5000) + 3000;
            await new Promise(r => setTimeout(r, browseTime));

            return {
                success: true,
                action: "view_profile",
                target: targetUsername,
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // ─── Action: watch_reel ───
    async watchReels(targetUsername, count = 1) {
        let watched = 0;
        try {
            console.log(`  🎬 [watch_reel] @${targetUsername}`);
            await this.page.goto(
                `https://www.instagram.com/${targetUsername}/reels/`,
                {
                    timeout: 25000,
                    waitUntil: "networkidle",
                }
            );
            await this._humanDelay(3000, 5000);

            // Wait for video elements to load
            try {
                await this.page.waitForSelector('video', {
                    timeout: 12000,
                });
                console.log(`  📹 Video element found`);
            } catch {
                console.log(`  ⚠️  No video found for @${targetUsername}`);
            }

            for (let i = 0; i < count; i++) {
                // Wait for video to actually start playing
                try {
                    await this.page.waitForFunction(() => {
                        const video = document.querySelector('video');
                        return video && !video.paused && video.currentTime > 0;
                    }, { timeout: 8000 });
                } catch {
                    // Try clicking play if autoplay failed
                    try {
                        const playBtn = await this.page.$('button[aria-label="Play"]');
                        if (playBtn) await playBtn.click();
                    } catch { }
                }

                // Watch the reel for a realistic duration (10-25 seconds)
                const watchTime = Math.floor(Math.random() * 15000) + 10000;
                console.log(`  ⏯️  Watching reel ${i + 1}/${count} for ${(watchTime / 1000).toFixed(1)}s`);
                await new Promise(r => setTimeout(r, watchTime));

                // Like ~40% of reels
                if (Math.random() < 0.4) {
                    const liked = await this._likeCurrentPost();
                    if (liked) console.log(`  ❤️  Liked reel`);
                }

                // Save ~15% of reels
                if (Math.random() < 0.15) {
                    const saved = await this._saveCurrentPost();
                    if (saved) console.log(`  💾 Saved reel`);
                }

                watched++;

                // Navigate to next reel
                if (i < count - 1) {
                    // Simulate swipe up or press down arrow
                    await this.page.keyboard.press("ArrowDown");
                    await this._humanDelay(2000, 4000);

                    // Wait for new video to load
                    try {
                        await this.page.waitForFunction(() => {
                            const video = document.querySelector('video');
                            return video && video.currentTime > 0;
                        }, { timeout: 8000 });
                    } catch { }
                }
            }

            return {
                success: true,
                action: "watch_reel",
                target: targetUsername,
                count: watched,
            };
        } catch (e) {
            return { success: true, count: watched, error: e.message };
        }
    }

    // ─── Action: like_post ───
    async likeRecentPost(targetUsername) {
        try {
            console.log(`  ❤️  [like_post] @${targetUsername}`);
            await this.page.goto(
                `https://www.instagram.com/${targetUsername}/`,
                {
                    timeout: 20000,
                    waitUntil: "networkidle",
                }
            );
            await this._humanDelay(2000, 4000);

            // Click on the first post
            const posts = await this.page.$$("article a");
            if (posts.length === 0) {
                return { success: false, error: "No posts found" };
            }

            await posts[0].click();
            await this._humanDelay(2000, 4000);

            // Wait for post dialog
            try {
                await this.page.waitForSelector('[role="dialog"]', {
                    timeout: 8000,
                });
            } catch { }

            await this._humanDelay(1000, 2000);

            const liked = await this._likeCurrentPost();

            // Close dialog
            const closeBtn = await this.page.$('svg[aria-label="Close"]');
            if (closeBtn) await closeBtn.click();
            await this._humanDelay(1000, 2000);

            return {
                success: true,
                action: "like_post",
                target: targetUsername,
                liked,
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // ─── FIXED & IMPROVED: save_post ───
    async saveRecentPost(targetUsername) {
        try {
            console.log(`  💾 [save_post] @${targetUsername}`);
            await this.page.goto(
                `https://www.instagram.com/${targetUsername}/`,
                {
                    timeout: 20000,
                    waitUntil: "networkidle",
                }
            );
            await this._humanDelay(2000, 4000);

            // Click on the first post
            const posts = await this.page.$$("article a");
            if (posts.length === 0) {
                return { success: false, error: "No posts found" };
            }

            await posts[0].click();
            await this._humanDelay(2000, 4000);

            // Wait for post dialog
            try {
                await this.page.waitForSelector('[role="dialog"]', {
                    timeout: 8000,
                });
            } catch { }

            await this._humanDelay(1000, 2000);

            const saved = await this._saveCurrentPost();

            // Close dialog
            const closeBtn = await this.page.$('svg[aria-label="Close"]');
            if (closeBtn) await closeBtn.click();
            await this._humanDelay(1000, 2000);

            return {
                success: true,
                action: "save_post",
                target: targetUsername,
                saved,
            };
        } catch (e) {
            return {
                success: true,
                action: "save_post",
                target: targetUsername,
                saved: false,
                warning: e.message,
            };
        }
    }

    // ─── Action: follow ───
    async followUser(targetUsername) {
        try {
            console.log(`  ➕ [follow] @${targetUsername}`);
            await this.page.goto(
                `https://www.instagram.com/${targetUsername}/`,
                {
                    timeout: 20000,
                    waitUntil: "networkidle",
                }
            );
            await this._humanDelay(3000, 5000);

            // Find the Follow button
            const followBtn = await this.page.$(
                'button:has-text("Follow")'
            );
            if (!followBtn) {
                // Check if already following
                const followingBtn = await this.page.$(
                    'button:has-text("Following")'
                );
                if (followingBtn) {
                    console.log(`  ℹ️  Already following @${targetUsername}`);
                    return {
                        success: true,
                        action: "follow",
                        target: targetUsername,
                        alreadyFollowing: true,
                    };
                }
                return { success: false, error: "Follow button not found" };
            }

            const btnText = await followBtn.textContent();
            if (btnText.includes("Following")) {
                return {
                    success: true,
                    action: "follow",
                    target: targetUsername,
                    alreadyFollowing: true,
                };
            }

            await followBtn.click();
            await this._humanDelay(2000, 4000);

            return {
                success: true,
                action: "follow",
                target: targetUsername,
                followed: true,
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // ─── Action: unfollow ───
    async unfollowUser(targetUsername) {
        try {
            console.log(`  ➖ [unfollow] @${targetUsername}`);
            await this.page.goto(
                `https://www.instagram.com/${targetUsername}/`,
                {
                    timeout: 20000,
                    waitUntil: "networkidle",
                }
            );
            await this._humanDelay(3000, 5000);

            // Find the Following button
            const followingBtn = await this.page.$(
                'button:has-text("Following")'
            );
            if (!followingBtn) {
                return { success: false, error: "Not following this user" };
            }

            await followingBtn.click();
            await this._humanDelay(1000, 2000);

            // Confirm unfollow in the popup
            const confirmBtn = await this.page.$(
                'button:has-text("Unfollow")'
            );
            if (confirmBtn) {
                await confirmBtn.click();
                await this._humanDelay(2000, 4000);
            }

            return {
                success: true,
                action: "unfollow",
                target: targetUsername,
                unfollowed: true,
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // ─── Action: comment_on_post ───
    async commentOnPost(targetUsername, commentText = null) {
        try {
            console.log(`  💬 [comment] @${targetUsername}`);

            const comments = [
                "Great content! 🔥",
                "Love this!",
                "Keep it up!",
                "Amazing work",
                "This is awesome",
                "So good!",
                "Nice one!",
            ];

            const text = commentText || comments[Math.floor(Math.random() * comments.length)];

            await this.page.goto(
                `https://www.instagram.com/${targetUsername}/`,
                {
                    timeout: 20000,
                    waitUntil: "networkidle",
                }
            );
            await this._humanDelay(2000, 4000);

            // Click on the first post
            const posts = await this.page.$$("article a");
            if (posts.length === 0) {
                return { success: false, error: "No posts found" };
            }

            await posts[0].click();
            await this._humanDelay(2000, 4000);

            try {
                await this.page.waitForSelector('[role="dialog"]', {
                    timeout: 8000,
                });
            } catch { }

            await this._humanDelay(1000, 2000);

            // Find the comment input
            const commentInput = await this.page.$(
                'textarea[aria-label="Add a comment…"], input[aria-label="Add a comment…"]'
            );
            if (!commentInput) {
                await this._closeDialog();
                return { success: false, error: "Comment input not found" };
            }

            await commentInput.click();
            await this._humanDelay(500, 1000);
            await this._humanType(this.page, text);
            await this._humanDelay(1000, 2000);

            // Press Enter to post
            await this.page.keyboard.press("Enter");
            await this._humanDelay(2000, 4000);

            await this._closeDialog();

            return {
                success: true,
                action: "comment",
                target: targetUsername,
                comment: text,
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // ─── Helper: Like current post ───
    async _likeCurrentPost() {
        try {
            // Check if already liked
            const unlikeBtn = await this.page.$(
                'svg[aria-label="Unlike"]'
            );
            if (unlikeBtn) return false;

            // Try to find and click the Like button
            const likeBtn = await this.page.$(
                'svg[aria-label="Like"]'
            );
            if (likeBtn) {
                // Instagram sometimes wraps the SVG in a button
                await likeBtn.click();
                await this._humanDelay(500, 1500);
                return true;
            }

            // Fallback: click the heart button by role
            const heartBtn = await this.page.$(
                'button:has(svg[aria-label="Like"])'
            );
            if (heartBtn) {
                await heartBtn.click();
                await this._humanDelay(500, 1500);
                return true;
            }

            return false;
        } catch {
            return false;
        }
    }

    // ─── Helper: Save current post ───
    async _saveCurrentPost() {
        try {
            // Check if already saved
            const savedIndicator = await this.page.$(
                'svg[aria-label="Saved"]'
            );
            if (savedIndicator) return false;

            // Click the Save button (bookmark icon)
            const saveBtn = await this.page.$(
                'svg[aria-label="Save"]'
            );
            if (saveBtn) {
                await saveBtn.click();
                await this._humanDelay(1000, 2000);
                return true;
            }

            // Fallback: find save button wrapping the SVG
            const bookmarkBtn = await this.page.$(
                'button:has(svg[aria-label="Save"])'
            );
            if (bookmarkBtn) {
                await bookmarkBtn.click();
                await this._humanDelay(1000, 2000);
                return true;
            }

            // Ultra fallback: try clicking the bookmark icon at the bottom of post
            const allBookmarks = await this.page.$$(
                'svg[aria-label="Save"], svg[aria-label="Saved"]'
            );
            for (const bm of allBookmarks) {
                const ariaLabel = await bm.getAttribute("aria-label");
                if (ariaLabel === "Save") {
                    await bm.click();
                    await this._humanDelay(1000, 2000);
                    return true;
                }
            }

            return false;
        } catch {
            return false;
        }
    }

    // ─── Helper: Close dialog ───
    async _closeDialog() {
        try {
            const closeBtn = await this.page.$(
                'svg[aria-label="Close"]'
            );
            if (closeBtn) {
                await closeBtn.click();
                await this._humanDelay(500, 1000);
                return;
            }

            // Fallback: press Escape
            await this.page.keyboard.press("Escape");
            await this._humanDelay(500, 1000);
        } catch {
            await this.page.keyboard.press("Escape");
        }
    }

    // ─── Execute any action by name ───
    async executeAction(action, creatorUsername, interest) {
        console.log(
            `\n  🎯 Executing: ${action} → @${creatorUsername} [${interest}]`
        );
        switch (action) {
            case "view_profile":
                return await this.visitProfile(creatorUsername);
            case "watch_reel":
                return await this.watchReels(creatorUsername, 2);
            case "save_post":
                return await this.saveRecentPost(creatorUsername);
            case "like_post":
                return await this.likeRecentPost(creatorUsername);
            case "follow":
                return await this.followUser(creatorUsername);
            case "unfollow":
                return await this.unfollowUser(creatorUsername);
            case "comment":
                return await this.commentOnPost(creatorUsername);
            default:
                return {
                    success: false,
                    error: `Unknown action: ${action}`,
                };
        }
    }

    async close() {
        if (this.context)
            await this.context.close().catch(() => { });
        if (this.browser)
            await this.browser.close().catch(() => { });
    }
}

module.exports = InstagramSession;