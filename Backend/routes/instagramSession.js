// backend/services/instagramSession.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SESSION_DIR = path.join(__dirname, '..', 'sessions');

class InstagramSession {
    constructor(instagram_username) {
        this.instagram_username = instagram_username;
        this.browser = null;
        this.context = null;
        this.page = null;
        this.sessionPath = path.join(SESSION_DIR, `${instagram_username}.json`);
    }

    async initBrowser() {
        this.browser = await chromium.launch({
            headless: false,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        });

        if (fs.existsSync(this.sessionPath)) {
            const sessionData = JSON.parse(fs.readFileSync(this.sessionPath, 'utf-8'));
            this.context = await this.browser.newContext({ storageState: sessionData });
        } else {
            this.context = await this.browser.newContext({
                userAgent:
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            });
        }

        this.page = await this.context.newPage();
        await this.page.setViewportSize({ width: 1280, height: 800 });

        // Disable webdriver flag
        await this.page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });
    }

    async saveSession() {
        if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
        const state = await this.context.storageState();
        fs.writeFileSync(this.sessionPath, JSON.stringify(state, null, 2));
    }

    async randomDelay(min = 800, max = 2000) {
        const ms = Math.floor(Math.random() * (max - min + 1)) + min;
        await this.page.waitForTimeout(ms);
    }

    // ─── FAST SCROLL — no human delays ───────────────────────────────────────

    async scrollDown(pixels = 800) {
        await this.page.evaluate((px) => {
            window.scrollBy({ top: px, behavior: 'auto' });
        }, pixels);
        await this.page.waitForTimeout(300);
    }

    async scrollToBottom() {
        await this.page.evaluate(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' });
        });
        await this.page.waitForTimeout(500);
    }

    // ─── LOGIN ────────────────────────────────────────────────────────────────

    async login(username, password) {
        await this.page.goto('https://www.instagram.com/accounts/login/', {
            waitUntil: 'networkidle',
            timeout: 30000,
        });
        await this.randomDelay(2000, 3000);

        await this.page.fill('input[name="username"]', username);
        await this.randomDelay(400, 800);
        await this.page.fill('input[name="password"]', password);
        await this.randomDelay(400, 800);

        const loginBtn = this.page.locator('button[type="submit"]');
        await loginBtn.click();

        await this.randomDelay(4000, 6000);

        // Check for challenge / suspicious login
        const currentUrl = this.page.url();
        if (currentUrl.includes('challenge')) {
            console.log('⚠️ Challenge required — waiting for manual resolution...');
            await this.page.waitForURL('https://www.instagram.com/', { timeout: 120000 });
        } else if (currentUrl.includes('login')) {
            throw new Error('Login failed — still on login page');
        }

        await this.saveSession();
        return true;
    }

    async isLoggedIn() {
        try {
            await this.page.goto('https://www.instagram.com/', {
                waitUntil: 'networkidle',
                timeout: 15000,
            });
            await this.randomDelay(2000, 3000);
            const url = this.page.url();
            return !url.includes('login') && !url.includes('accounts');
        } catch {
            return false;
        }
    }

    // ─── VISIT PROFILE ──────────────────────────────────────────────────────

    async visitProfile(username) {
        await this.page.goto(`https://www.instagram.com/${username}/`, {
            waitUntil: 'networkidle',
            timeout: 30000,
        });
        await this.randomDelay(2000, 3000);

        // Dismiss "Not Now" notification popup
        try {
            const notNowBtn = this.page.getByText('Not Now', { exact: true }).first();
            if (await notNowBtn.isVisible({ timeout: 2000 })) {
                await notNowBtn.click();
                await this.randomDelay(800, 1500);
            }
        } catch { }

        // Dismiss "Save Your Login Info"
        try {
            const saveInfoBtn = this.page.getByText('Save Info', { exact: false });
            if (await saveInfoBtn.isVisible({ timeout: 2000 })) {
                const notNow = this.page.getByText('Not Now').first();
                if (await notNow.isVisible()) await notNow.click();
                await this.randomDelay(800, 1500);
            }
        } catch { }
    }

    // ─── CLICK A POST FROM THE GRID ─────────────────────────────────────────

    async clickAnyPost() {
        // Select all post links — these are <a> with href containing /p/ or /reel/
        const postLinks = await this.page.locator('a[href*="/p/"], a[href*="/reel/"]').all();

        if (postLinks.length === 0) {
            throw new Error('No posts found in profile grid');
        }

        // Pick from the first 12 visible posts
        const maxIndex = Math.min(postLinks.length, 12);
        const pickIndex = Math.floor(Math.random() * maxIndex);

        console.log(`  📌 Clicking post ${pickIndex + 1}/${postLinks.length} in grid`);

        await postLinks[pickIndex].click();
        await this.randomDelay(2000, 3500);

        // Wait for the post lightbox/modal to fully render
        await this.page.waitForSelector('article[role="presentation"]', { timeout: 10000 }).catch(() => { });
        await this.randomDelay(1000, 2000);
    }

    // ─── CHECK IF CURRENT POST IS A VIDEO ───────────────────────────────────

    async isVideo() {
        try {
            const video = await this.page.locator('article[role="presentation"] video').first();
            return await video.isVisible({ timeout: 2000 });
        } catch {
            return false;
        }
    }

    // ─── LIKE THE OPENED POST ───────────────────────────────────────────────

    async likeCurrentPost() {
        try {
            // Based on your DOM: div[role="button"] with svg[aria-label="Like"]
            const likeBtn = this.page.locator('div[role="button"] svg[aria-label="Like"]').first();

            if (await likeBtn.isVisible({ timeout: 3000 })) {
                await likeBtn.click();
                await this.randomDelay(800, 1500);
                console.log('  ❤️ Post liked');
                return true;
            }

            // Fallback: try button containing Like svg
            const likeBtnAlt = this.page.locator('button:has(svg[aria-label="Like"])').first();
            if (await likeBtnAlt.isVisible({ timeout: 2000 })) {
                await likeBtnAlt.click();
                await this.randomDelay(800, 1500);
                console.log('  ❤️ Post liked (alt selector)');
                return true;
            }

            console.log('  ℹ️ Like button not found — may already be liked');
            return false;
        } catch (err) {
            console.log(`  ⚠️ Like failed: ${err.message}`);
            return false;
        }
    }

    // ─── SAVE THE OPENED POST ───────────────────────────────────────────────

    async saveCurrentPost() {
        try {
            // Based on your DOM: div[role="button"] with svg[aria-label="Save"]
            const saveBtn = this.page.locator('div[role="button"] svg[aria-label="Save"]').first();

            if (await saveBtn.isVisible({ timeout: 3000 })) {
                await saveBtn.click();
                await this.randomDelay(800, 1500);
                console.log('  🔖 Post saved');
                return true;
            }

            // Fallback
            const saveBtnAlt = this.page.locator('button:has(svg[aria-label="Save"])').first();
            if (await saveBtnAlt.isVisible({ timeout: 2000 })) {
                await saveBtnAlt.click();
                await this.randomDelay(800, 1500);
                console.log('  🔖 Post saved (alt selector)');
                return true;
            }

            console.log('  ℹ️ Save button not found');
            return false;
        } catch (err) {
            console.log(`  ⚠️ Save failed: ${err.message}`);
            return false;
        }
    }

    // ─── CLOSE THE POST MODAL ───────────────────────────────────────────────

    async closePostModal() {
        try {
            // Click the close button (X) in the modal
            const closeBtn = this.page.locator('svg[aria-label="Close"]').first();
            if (await closeBtn.isVisible({ timeout: 2000 })) {
                await closeBtn.click();
                await this.randomDelay(500, 1000);
            } else {
                // Press Escape as fallback
                await this.page.keyboard.press('Escape');
                await this.randomDelay(500, 1000);
            }
        } catch {
            await this.page.keyboard.press('Escape');
            await this.randomDelay(500, 1000);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  ACTION: view_profile
    // ═══════════════════════════════════════════════════════════════════════════

    async executeViewProfile(username) {
        console.log(`  👤 Visiting @${username}'s profile...`);
        await this.visitProfile(username);

        // Fast scroll down a bit to simulate browsing
        await this.scrollDown(600);
        await this.randomDelay(500, 1000);
        await this.scrollDown(600);
        await this.randomDelay(500, 1000);

        // Stay on profile for 2-4 seconds
        const stayMs = Math.floor(Math.random() * 3000) + 2000;
        await this.page.waitForTimeout(stayMs);

        return { success: true };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  ACTION: watch_reel
    // ═══════════════════════════════════════════════════════════════════════════

    async executeWatchReel(username) {
        console.log(`  🎬 Watching reel from @${username}...`);
        await this.visitProfile(username);

        // First, try clicking a /reel/ link directly from the grid
        const reelLinks = await this.page.locator('a[href*="/reel/"]').all();

        if (reelLinks.length > 0) {
            // Click a reel link directly (goes to the reel page, not lightbox)
            const maxIndex = Math.min(reelLinks.length, 6);
            const pickIndex = Math.floor(Math.random() * maxIndex);
            console.log(`  📌 Clicking reel ${pickIndex + 1}/${reelLinks.length}`);

            await reelLinks[pickIndex].click();
            await this.randomDelay(3000, 5000);

            // Wait for video to load
            await this.page.waitForSelector('video', { timeout: 15000 }).catch(() => { });
            await this.randomDelay(2000, 3000);

            // "Watch" — wait 10-20 seconds
            const watchTime = Math.floor(Math.random() * 10000) + 10000;
            console.log(`  ⏳ Watching reel for ${(watchTime / 1000).toFixed(0)}s...`);
            await this.page.waitForTimeout(watchTime);

            // 60% chance to like the reel
            if (Math.random() < 0.6) {
                await this.likeCurrentPost();
            }

            // Press Escape to go back to profile
            await this.page.keyboard.press('Escape');
            await this.randomDelay(1000, 2000);

        } else {
            // Fallback: no reel links found — click any post from grid
            console.log('  ℹ️ No reel links found, using regular post as fallback');
            await this.clickAnyPost();

            const isVideo = await this.isVideo();
            if (isVideo) {
                const watchTime = Math.floor(Math.random() * 8000) + 5000;
                console.log(`  ⏳ Watching video post for ${(watchTime / 1000).toFixed(0)}s...`);
                await this.page.waitForTimeout(watchTime);
            } else {
                console.log('  ℹ️ Post is an image — liking instead');
            }

            // Like the post
            await this.likeCurrentPost();
            await this.closePostModal();
        }

        return { success: true };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  ACTION: like_post
    // ═══════════════════════════════════════════════════════════════════════════

    async executeLikePost(username) {
        console.log(`  ❤️ Liking a post from @${username}...`);
        await this.visitProfile(username);
        await this.clickAnyPost();
        await this.likeCurrentPost();
        await this.closePostModal();
        return { success: true };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  ACTION: save_post
    // ═══════════════════════════════════════════════════════════════════════════

    async executeSavePost(username) {
        console.log(`  🔖 Saving a post from @${username}...`);
        await this.visitProfile(username);
        await this.clickAnyPost();
        await this.saveCurrentPost();
        await this.closePostModal();
        return { success: true };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  ACTION: follow
    // ═══════════════════════════════════════════════════════════════════════════

    async executeFollow(username) {
        console.log(`  ➕ Following @${username}...`);
        await this.visitProfile(username);

        // Click the Follow button on the profile
        try {
            const followBtn = this.page.locator('button:has-text("Follow")').first();
            if (await followBtn.isVisible({ timeout: 5000 })) {
                await followBtn.click();
                await this.randomDelay(2000, 3000);
                console.log('  ✅ Followed successfully');
            } else {
                // Try "Follow Back" button
                const followBackBtn = this.page.locator('button:has-text("Follow Back")').first();
                if (await followBackBtn.isVisible({ timeout: 3000 })) {
                    await followBackBtn.click();
                    await this.randomDelay(2000, 3000);
                    console.log('  ✅ Followed back successfully');
                } else {
                    console.log('  ℹ️ Follow button not found — already following?');
                }
            }
        } catch (err) {
            console.log(`  ⚠️ Follow failed: ${err.message}`);
        }

        return { success: true };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  MAIN DISPATCH — called by automation.js
    // ═══════════════════════════════════════════════════════════════════════════

    async executeAction(actionType, targetUsername, interest = '') {
        console.log(`\n🎯 [${this.instagram_username}] → ${actionType} on @${targetUsername} ${interest ? '(' + interest + ')' : ''}`);

        try {
            switch (actionType) {
                case 'view_profile':
                    return await this.executeViewProfile(targetUsername);

                case 'watch_reel':
                    return await this.executeWatchReel(targetUsername);

                case 'like_post':
                    return await this.executeLikePost(targetUsername);

                case 'save_post':
                    return await this.executeSavePost(targetUsername);

                case 'follow':
                    return await this.executeFollow(targetUsername);

                default:
                    return { success: false, error: `Unknown action type: ${actionType}` };
            }
        } catch (err) {
            console.error(`  ❌ Action failed: ${err.message}`);
            return { success: false, error: err.message };
        }
    }

    // ─── CLOSE BROWSER ────────────────────────────────────────────────────────

    async close() {
        console.log(`[${this.instagram_username}] Closing browser...`);
        try {
            if (this.page) {
                await this.page.close().catch(() => { });
                this.page = null;
            }
            if (this.context) {
                await this.context.close().catch(() => { });
                this.context = null;
            }
            if (this.browser) {
                await this.browser.close().catch(() => { });
                this.browser = null;
            }
            console.log(`[${this.instagram_username}] Browser closed.`);
        } catch (err) {
            console.error(`[${this.instagram_username}] Error closing browser: ${err.message}`);
        }
    }
}

module.exports = InstagramSession;