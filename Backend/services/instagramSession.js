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
        let loginClicked = false;

        let loginBtn = await this.page.$('button[type="submit"]');
        if (loginBtn) {
            const isDisabled = await loginBtn.getAttribute("disabled");
            if (!isDisabled) {
                await loginBtn.click();
                loginClicked = true;
            }
        }

        if (!loginClicked) {
            loginBtn = await this.page.$('div[role="button"]:has-text("Log in")');
            if (!loginBtn) {
                loginBtn = await this.page.$('button:has-text("Log in")');
            }
            if (!loginBtn) {
                loginBtn = await this.page.$('form input[type="submit"], form button');
            }
            if (loginBtn) {
                await loginBtn.click();
                loginClicked = true;
            }
        }

        if (!loginClicked) {
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

        const pageText = await this.page.textContent("body");
        if (pageText.includes("suspicious") || pageText.includes("unusual")) {
            this._emitStatus("suspicious_login");
            return {
                success: false,
                error: "Login flagged as suspicious — may need email verification",
            };
        }

        this._emitStatus("login_failed");
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
    //  ACTIONS — UPDATED with random post selection + 1-3 range
    // ──────────────────────────────────────────────

    // ─── Helper: Pick random post/reel from grid ───
    async _pickRandomGridPost() {
        const postLinks = await this.page.$$('article a[href*="/p/"], article a[href*="/reel/"]');
        if (postLinks.length > 0) {
            const idx = Math.floor(Math.random() * postLinks.length);
            return postLinks[idx];
        }

        const allLinks = await this.page.$$('a[href*="/p/"], a[href*="/reel/"]');
        if (allLinks.length > 0) {
            const idx = Math.floor(Math.random() * allLinks.length);
            return allLinks[idx];
        }

        return null;
    }

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

            for (let i = 0; i < 3; i++) {
                await this.page.evaluate(() => window.scrollBy(0, 400));
                await this._humanDelay(800, 1500);
            }

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

    // ─── Action: watch_reel — UPDATED: random reel each time ───
    async watchReels(targetUsername, count = 2) {
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

            for (let i = 0; i < count; i++) {
                console.log(`  🔄 Reel ${i + 1}/${count}...`);

                // Pick a random reel from the grid each time
                const randomReel = await this._pickRandomGridPost();
                if (!randomReel) {
                    console.log(`  ⚠️  No reels found`);
                    break;
                }

                await randomReel.click();
                await this._humanDelay(3000, 5000);

                try {
                    await this.page.waitForSelector('[role="dialog"]', { timeout: 8000 });
                } catch { }
                await this._humanDelay(1000, 2000);

                try {
                    await this.page.waitForFunction(() => {
                        const video = document.querySelector('video');
                        return video && !video.paused && video.currentTime > 0;
                    }, { timeout: 8000 });
                } catch {
                    try {
                        const playBtn = await this.page.$('button[aria-label="Play"]');
                        if (playBtn) await playBtn.click();
                    } catch { }
                }

                const watchTime = Math.floor(Math.random() * 15000) + 10000;
                console.log(`  ⏯️  Watching reel ${i + 1}/${count} for ${(watchTime / 1000).toFixed(1)}s`);
                await new Promise(r => setTimeout(r, watchTime));

                if (Math.random() < 0.4) {
                    const liked = await this._likeCurrentPost();
                    if (liked) console.log(`  ❤️  Liked reel`);
                }

                if (Math.random() < 0.15) {
                    const saved = await this._saveCurrentPost();
                    if (saved) console.log(`  💾 Saved reel`);
                }

                watched++;

                if (i < count - 1) {
                    await this._closeDialog();
                    await this._humanDelay(2000, 3000);

                    // Re-navigate to reels tab for fresh grid
                    await this.page.goto(
                        `https://www.instagram.com/${targetUsername}/reels/`,
                        { timeout: 20000, waitUntil: "networkidle" }
                    );
                    await this._humanDelay(2000, 4000);
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

    // ─── Action: like_post — UPDATED: 1-3 random posts ───
    async likeRecentPost(targetUsername) {
        const likeCount = Math.floor(Math.random() * 3) + 1; // 1-3
        let liked = 0;
        try {
            console.log(`  ❤️  [like_post] @${targetUsername} (${likeCount} posts)`);

            for (let i = 0; i < likeCount; i++) {
                console.log(`  🔄 Post ${i + 1}/${likeCount}...`);

                await this.page.goto(
                    `https://www.instagram.com/${targetUsername}/`,
                    { timeout: 20000, waitUntil: "networkidle" }
                );
                await this._humanDelay(2000, 4000);

                const randomPost = await this._pickRandomGridPost();
                if (!randomPost) {
                    console.log(`  ⚠️  No posts found`);
                    break;
                }

                await randomPost.click();
                await this._humanDelay(3000, 5000);

                try {
                    await this.page.waitForSelector('[role="dialog"]', { timeout: 8000 });
                } catch { }
                await this._humanDelay(1000, 2000);

                const likedThis = await this._likeCurrentPost();
                if (likedThis) {
                    liked++;
                    console.log(`  ❤️  Liked post ${i + 1}`);
                }

                await this._closeDialog();
                await this._humanDelay(1500, 3000);
            }

            return {
                success: true,
                action: "like_post",
                target: targetUsername,
                liked,
            };
        } catch (e) {
            return { success: true, action: "like_post", target: targetUsername, liked, error: e.message };
        }
    }

    // ─── Action: save_post — UPDATED: 1-3 random posts ───
    async saveRecentPost(targetUsername) {
        const saveCount = Math.floor(Math.random() * 3) + 1; // 1-3
        let saved = 0;
        try {
            console.log(`  💾 [save_post] @${targetUsername} (${saveCount} posts)`);

            for (let i = 0; i < saveCount; i++) {
                console.log(`  🔄 Post ${i + 1}/${saveCount}...`);

                await this.page.goto(
                    `https://www.instagram.com/${targetUsername}/`,
                    { timeout: 20000, waitUntil: "networkidle" }
                );
                await this._humanDelay(2000, 4000);

                const randomPost = await this._pickRandomGridPost();
                if (!randomPost) {
                    console.log(`  ⚠️  No posts found`);
                    break;
                }

                await randomPost.click();
                await this._humanDelay(3000, 5000);

                try {
                    await this.page.waitForSelector('[role="dialog"]', { timeout: 8000 });
                } catch { }
                await this._humanDelay(1000, 2000);

                const savedThis = await this._saveCurrentPost();
                if (savedThis) {
                    saved++;
                    console.log(`  💾 Saved post ${i + 1}`);
                }

                await this._closeDialog();
                await this._humanDelay(1500, 3000);
            }

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
                saved,
                warning: e.message,
            };
        }
    }

    // ─── Action: follow — UPDATED: random post first, then follow ───
    async followUser(targetUsername) {
        try {
            console.log(`  ➕ [follow] @${targetUsername}`);

            // First browse profile and like a random post before following
            await this.page.goto(
                `https://www.instagram.com/${targetUsername}/`,
                { timeout: 20000, waitUntil: "networkidle" }
            );
            await this._humanDelay(3000, 5000);

            // Like a random post first (more natural behavior)
            const randomPost = await this._pickRandomGridPost();
            if (randomPost) {
                await randomPost.click();
                await this._humanDelay(2000, 4000);
                try {
                    await this.page.waitForSelector('[role="dialog"]', { timeout: 8000 });
                } catch { }
                await this._humanDelay(1000, 2000);
                await this._likeCurrentPost();
                await this._closeDialog();
                await this._humanDelay(2000, 3000);
            }

            // Now find the Follow button
            const followBtn = await this.page.$('button:has-text("Follow")');
            if (!followBtn) {
                const followingBtn = await this.page.$('button:has-text("Following")');
                if (followingBtn) {
                    console.log(`  ℹ️  Already following @${targetUsername}`);
                    return {
                        success: true,
                        action: "follow",
                        target: targetUsername,
                        alreadyFollowing: true,
                    };
                }
                const requestedBtn = await this.page.$('button:has-text("Requested")');
                if (requestedBtn) {
                    console.log(`  ℹ️  Already requested @${targetUsername}`);
                    return {
                        success: true,
                        action: "follow",
                        target: targetUsername,
                        alreadyRequested: true,
                    };
                }
                return { success: false, error: "Follow button not found" };
            }

            const btnText = await followBtn.textContent();
            if (btnText.includes("Following") || btnText.includes("Requested")) {
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

            const followingBtn = await this.page.$(
                'button:has-text("Following")'
            );
            if (!followingBtn) {
                return { success: false, error: "Not following this user" };
            }

            await followingBtn.click();
            await this._humanDelay(1000, 2000);

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

            const randomPost = await this._pickRandomGridPost();
            if (!randomPost) {
                return { success: false, error: "No posts found" };
            }

            await randomPost.click();
            await this._humanDelay(2000, 4000);

            try {
                await this.page.waitForSelector('[role="dialog"]', {
                    timeout: 8000,
                });
            } catch { }

            await this._humanDelay(1000, 2000);

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
            const unlikeBtn = await this.page.$(
                'svg[aria-label="Unlike"]'
            );
            if (unlikeBtn) return false;

            const unlikeRoleBtn = await this.page.$('div[role="button"] svg[aria-label="Unlike"]');
            if (unlikeRoleBtn) return false;

            const likeBtn = await this.page.$(
                'svg[aria-label="Like"]'
            );
            if (likeBtn) {
                await likeBtn.click();
                await this._humanDelay(500, 1500);
                return true;
            }

            const heartBtn = await this.page.$(
                'button:has(svg[aria-label="Like"])'
            );
            if (heartBtn) {
                await heartBtn.click();
                await this._humanDelay(500, 1500);
                return true;
            }

            const roleBtn = await this.page.$('div[role="button"] svg[aria-label="Like"]');
            if (roleBtn) {
                await roleBtn.click();
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
            const savedIndicator = await this.page.$(
                'svg[aria-label="Saved"]'
            );
            if (savedIndicator) return false;

            const savedRoleBtn = await this.page.$('div[role="button"] svg[aria-label="Saved"]');
            if (savedRoleBtn) return false;

            const saveBtn = await this.page.$(
                'svg[aria-label="Save"]'
            );
            if (saveBtn) {
                await saveBtn.click();
                await this._humanDelay(1000, 2000);
                return true;
            }

            const bookmarkBtn = await this.page.$(
                'button:has(svg[aria-label="Save"])'
            );
            if (bookmarkBtn) {
                await bookmarkBtn.click();
                await this._humanDelay(1000, 2000);
                return true;
            }

            const roleBtn = await this.page.$('div[role="button"] svg[aria-label="Save"]');
            if (roleBtn) {
                await roleBtn.click();
                await this._humanDelay(1000, 2000);
                return true;
            }

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