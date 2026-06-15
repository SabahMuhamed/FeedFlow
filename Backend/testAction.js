// backend/testActions.js
// Run: node testActions.js
// Tests all 5 automation actions — every function is self-contained
// Only uses InstagramSession for: launch, login, close

// ─── Set dummy Supabase env vars before anything loads ───
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8000';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'dummy-key-for-testing';

const path = require('path');
const InstagramSession = require('./services/instagramSession');

// ═══════════════════════════════════════════════════════════════
//  CONFIGURATION — EDIT THESE VALUES
// ═══════════════════════════════════════════════════════════════

const YOUR_INSTA_USERNAME = 'feedflow_testing';
const YOUR_INSTA_PASSWORD = 'feedflow';

const TEST_TARGETS = {
    view_profile: 'instagram',
    watch_reel: 'natgeo',
    like_post: 'nasa',
    save_post: 'sahal_abdul_samad',
    follow: 'bbcnews',
};

// ═══════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function humanDelay(min = 1000, max = 3000) {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(r => setTimeout(r, ms));
}

/**
 * Pick a random post or reel link from the profile grid.
 * Targets both regular posts (/p/) and reels (/reel/).
 */
async function pickRandomGridPost(page) {
    const postLinks = await page.$$('article a[href*="/p/"], article a[href*="/reel/"]');
    if (postLinks.length > 0) {
        const idx = Math.floor(Math.random() * postLinks.length);
        console.log(`  🎲 Picked post ${idx + 1}/${postLinks.length}`);
        return postLinks[idx];
    }

    // Fallback: try finding any links with /p/ or /reel/ anywhere on page
    const allLinks = await page.$$('a[href*="/p/"], a[href*="/reel/"]');
    if (allLinks.length > 0) {
        const idx = Math.floor(Math.random() * allLinks.length);
        console.log(`  🎲 Picked link ${idx + 1}/${allLinks.length} (fallback)`);
        return allLinks[idx];
    }

    return null;
}

/**
 * Pick a random reel link specifically from the reels tab (/reel/ only).
 * Used after navigating to /reels/ page where the DOM is different.
 */
async function pickRandomReelFromReelsTab(page) {
    // On the reels tab, reels are often in a different layout
    // Try multiple selectors
    const selectors = [
        'a[href*="/reel/"]',
        'article a[href*="/reel/"]',
        'div[role="dialog"] a[href*="/reel/"]',
    ];

    for (const selector of selectors) {
        const links = await page.$$(selector);
        if (links.length > 0) {
            const idx = Math.floor(Math.random() * links.length);
            console.log(`  🎲 Picked reel ${idx + 1}/${links.length}`);
            return links[idx];
        }
    }

    return null;
}

/**
 * Get a random number between min and max inclusive.
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ═══════════════════════════════════════════════════════════════
//  ACTION 1: view_profile
// ═══════════════════════════════════════════════════════════════

async function actionViewProfile(page, targetUsername) {
    console.log(`  👤 Visiting @${targetUsername}'s profile...`);

    await page.goto(`https://www.instagram.com/${targetUsername}/`, {
        timeout: 25000,
        waitUntil: 'networkidle',
    });
    await humanDelay(3000, 5000);

    // Scroll down to simulate browsing
    for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, 400));
        await humanDelay(800, 1500);
    }

    // Hover over a random post
    const postLinks = await page.$$('article a');
    if (postLinks.length > 0) {
        const idx = Math.floor(Math.random() * Math.min(postLinks.length, 6));
        await postLinks[idx].hover();
        await humanDelay(1000, 2000);
    }

    // Stay on profile
    const stayTime = Math.floor(Math.random() * 5000) + 3000;
    await new Promise(r => setTimeout(r, stayTime));

    return { success: true, action: 'view_profile', target: targetUsername };
}

// ═══════════════════════════════════════════════════════════════
//  ACTION 2: watch_reel
//  FIXED: Instead of scrolling down, it re-picks a random reel from
//  the grid each time for a more natural browsing pattern
// ═══════════════════════════════════════════════════════════════

async function actionWatchReel(page, targetUsername, count = 2) {
    console.log(`  🎬 Watching reels from @${targetUsername}...`);

    // Go to the reels tab
    await page.goto(`https://www.instagram.com/${targetUsername}/reels/`, {
        timeout: 25000,
        waitUntil: 'networkidle',
    });
    await humanDelay(3000, 5000);

    let watched = 0;

    for (let i = 0; i < count; i++) {
        console.log(`  🔄 Select reel ${i + 1}/${count}...`);

        // Pick a random reel from the grid each time
        const randomReel = await pickRandomReelFromReelsTab(page);
        if (!randomReel) {
            console.log(`  ⚠️  No reels found on reels tab`);
            break;
        }

        // Click the random reel
        await randomReel.click();
        await humanDelay(3000, 5000);

        // Wait for the post dialog to appear
        try {
            await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
        } catch { }
        await humanDelay(1000, 2000);

        // Wait for video to play
        try {
            await page.waitForFunction(() => {
                const video = document.querySelector('video');
                return video && !video.paused && video.currentTime > 0;
            }, { timeout: 8000 });
        } catch {
            try {
                const playBtn = await page.$('button[aria-label="Play"]');
                if (playBtn) await playBtn.click();
            } catch { }
        }

        // Watch for 10-25 seconds
        const watchTime = Math.floor(Math.random() * 15000) + 10000;
        console.log(`  ⏯️  Watching reel ${i + 1}/${count} for ${(watchTime / 1000).toFixed(1)}s`);
        await new Promise(r => setTimeout(r, watchTime));

        // Like ~40% of reels (but only if not already liked)
        if (Math.random() < 0.4) {
            const liked = await likeCurrentPost(page);
            if (liked) console.log(`  ❤️  Liked reel`);
        }

        // Save ~15% of reels (but only if not already saved)
        if (Math.random() < 0.15) {
            const saved = await saveCurrentPost(page);
            if (saved) console.log(`  💾 Saved reel`);
        }

        watched++;

        // Close the dialog to go back to the grid for the next selection
        if (i < count - 1) {
            await closeDialog(page);
            await humanDelay(2000, 3000);

            // Re-navigate to reels tab to ensure fresh grid
            await page.goto(`https://www.instagram.com/${targetUsername}/reels/`, {
                timeout: 20000,
                waitUntil: 'networkidle',
            });
            await humanDelay(2000, 4000);
        }
    }

    return { success: true, action: 'watch_reel', target: targetUsername, count: watched };
}

// ═══════════════════════════════════════════════════════════════
//  ACTION 3: like_post
//  FIXED: Likes between 1-3 random posts
// ═══════════════════════════════════════════════════════════════

async function actionLikePost(page, targetUsername) {
    const likeCount = randomInt(1, 3);
    console.log(`  ❤️  Liking ${likeCount} random post(s) from @${targetUsername}...`);

    let liked = 0;

    for (let i = 0; i < likeCount; i++) {
        console.log(`  🔄 Post ${i + 1}/${likeCount}...`);

        // Go to profile (fresh each time for random selection)
        await page.goto(`https://www.instagram.com/${targetUsername}/`, {
            timeout: 20000,
            waitUntil: 'networkidle',
        });
        await humanDelay(2000, 4000);

        // Pick a random post from the grid
        const randomPost = await pickRandomGridPost(page);
        if (!randomPost) {
            console.log(`  ⚠️  No posts found`);
            break;
        }

        // Click the random post
        await randomPost.click();
        await humanDelay(3000, 5000);

        // Wait for the post dialog
        try {
            await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
        } catch { }
        await humanDelay(1000, 2000);

        // Like the post — likeCurrentPost checks if already liked internally
        const likedThis = await likeCurrentPost(page);
        if (likedThis) {
            liked++;
            console.log(`  ❤️  Liked post ${i + 1}`);
        }

        // Close dialog
        await closeDialog(page);
        await humanDelay(1500, 3000);
    }

    return { success: true, action: 'like_post', target: targetUsername, liked };
}

// ═══════════════════════════════════════════════════════════════
//  ACTION 4: save_post
//  FIXED: Saves between 1-3 random posts
// ═══════════════════════════════════════════════════════════════

async function actionSavePost(page, targetUsername) {
    const saveCount = randomInt(1, 3);
    console.log(`  💾 Saving ${saveCount} random post(s) from @${targetUsername}...`);

    let saved = 0;

    for (let i = 0; i < saveCount; i++) {
        console.log(`  🔄 Post ${i + 1}/${saveCount}...`);

        // Go to profile (fresh each time for random selection)
        await page.goto(`https://www.instagram.com/${targetUsername}/`, {
            timeout: 20000,
            waitUntil: 'networkidle',
        });
        await humanDelay(2000, 4000);

        // Pick a random post from the grid (can be /p/ or /reel/)
        const randomPost = await pickRandomGridPost(page);
        if (!randomPost) {
            console.log(`  ⚠️  No posts found`);
            break;
        }

        // Click the random post
        await randomPost.click();
        await humanDelay(3000, 5000);

        // Wait for the post dialog
        try {
            await page.waitForSelector('[role="dialog"]', { timeout: 8000 });
        } catch { }
        await humanDelay(1000, 2000);

        // Save the post — saveCurrentPost checks if already saved internally
        const savedThis = await saveCurrentPost(page);
        if (savedThis) {
            saved++;
            console.log(`  💾 Saved post ${i + 1}`);
        }

        // Close dialog
        await closeDialog(page);
        await humanDelay(1500, 3000);
    }

    return { success: true, action: 'save_post', target: targetUsername, saved };
}

// ═══════════════════════════════════════════════════════════════
//  ACTION 5: follow
// ═══════════════════════════════════════════════════════════════

async function actionFollow(page, targetUsername) {
    console.log(`  ➕ Following @${targetUsername}...`);

    await page.goto(`https://www.instagram.com/${targetUsername}/`, {
        timeout: 20000,
        waitUntil: 'networkidle',
    });
    await humanDelay(3000, 5000);

    // Check if already following first
    const followingBtn = await page.$('button:has-text("Following")');
    if (followingBtn) {
        console.log(`  ℹ️  Already following @${targetUsername}`);
        return { success: true, action: 'follow', target: targetUsername, alreadyFollowing: true };
    }

    // Check for "Requested" (private accounts)
    const requestedBtn = await page.$('button:has-text("Requested")');
    if (requestedBtn) {
        console.log(`  ℹ️  Already requested @${targetUsername}`);
        return { success: true, action: 'follow', target: targetUsername, alreadyRequested: true };
    }

    // Find Follow button
    const followBtn = await page.$('button:has-text("Follow")');
    if (!followBtn) {
        return { success: false, error: 'Follow button not found' };
    }

    await followBtn.click();
    await humanDelay(2000, 4000);

    // Verify it worked — check if it changed to "Following" or "Requested"
    const nowFollowing = await page.$('button:has-text("Following")');
    const nowRequested = await page.$('button:has-text("Requested")');
    const followed = !!(nowFollowing || nowRequested);

    return {
        success: true,
        action: 'follow',
        target: targetUsername,
        followed,
        status: nowFollowing ? 'following' : nowRequested ? 'requested' : 'unknown',
    };
}

// ═══════════════════════════════════════════════════════════════
//  SHARED HELPERS (like, save, close dialog)
// ═══════════════════════════════════════════════════════════════

async function likeCurrentPost(page) {
    try {
        // ── Check if already liked ──
        const unlikeBtn = await page.$('svg[aria-label="Unlike"]');
        if (unlikeBtn) {
            console.log('  ℹ️  Already liked — skipping');
            return false;
        }

        const unlikeRoleBtn = await page.$('div[role="button"] svg[aria-label="Unlike"]');
        if (unlikeRoleBtn) {
            console.log('  ℹ️  Already liked (role) — skipping');
            return false;
        }

        // ── Try clicking Like via multiple selectors ──
        // 1. Direct SVG
        let btn = await page.$('svg[aria-label="Like"]');
        if (btn) {
            await btn.click();
            await humanDelay(500, 1500);
            console.log('  ✅ Clicked Like (direct SVG)');
            return true;
        }

        // 2. Button wrapping SVG
        btn = await page.$('button:has(svg[aria-label="Like"])');
        if (btn) {
            await btn.click();
            await humanDelay(500, 1500);
            console.log('  ✅ Clicked Like (button wrapper)');
            return true;
        }

        // 3. div[role="button"] containing SVG
        btn = await page.$('div[role="button"] svg[aria-label="Like"]');
        if (btn) {
            await btn.click();
            await humanDelay(500, 1500);
            console.log('  ✅ Clicked Like (role button)');
            return true;
        }

        console.log('  ⚠️  Like button not found');
        return false;
    } catch (err) {
        console.log(`  ⚠️  Like failed: ${err.message}`);
        return false;
    }
}

async function saveCurrentPost(page) {
    try {
        // ── Check if already saved ──
        const savedIndicator = await page.$('svg[aria-label="Saved"]');
        if (savedIndicator) {
            console.log('  ℹ️  Already saved — skipping');
            return false;
        }

        const savedRoleBtn = await page.$('div[role="button"] svg[aria-label="Saved"]');
        if (savedRoleBtn) {
            console.log('  ℹ️  Already saved (role) — skipping');
            return false;
        }

        // ── Try clicking Save via multiple selectors ──
        // 1. Direct SVG
        let btn = await page.$('svg[aria-label="Save"]');
        if (btn) {
            await btn.click();
            await humanDelay(1000, 2000);
            console.log('  ✅ Clicked Save (direct SVG)');
            return true;
        }

        // 2. Button wrapping SVG
        btn = await page.$('button:has(svg[aria-label="Save"])');
        if (btn) {
            await btn.click();
            await humanDelay(1000, 2000);
            console.log('  ✅ Clicked Save (button wrapper)');
            return true;
        }

        // 3. div[role="button"] containing SVG
        btn = await page.$('div[role="button"] svg[aria-label="Save"]');
        if (btn) {
            await btn.click();
            await humanDelay(1000, 2000);
            console.log('  ✅ Clicked Save (role button)');
            return true;
        }

        console.log('  ⚠️  Save button not found');
        return false;
    } catch (err) {
        console.log(`  ⚠️  Save failed: ${err.message}`);
        return false;
    }
}

async function closeDialog(page) {
    try {
        const closeBtn = await page.$('svg[aria-label="Close"]');
        if (closeBtn) {
            await closeBtn.click();
            await humanDelay(500, 1000);
            return;
        }
        // Fallback: press Escape
        await page.keyboard.press('Escape');
        await humanDelay(500, 1000);
    } catch {
        await page.keyboard.press('Escape');
        await humanDelay(500, 1000);
    }
}

// ═══════════════════════════════════════════════════════════════
//  TEST RUNNER
// ═══════════════════════════════════════════════════════════════

async function testAction(actionName, targetUsername, actionFn, page) {
    console.log('\n' + '═'.repeat(60));
    console.log(`🧪 TEST: ${actionName}`);
    console.log(`   Target: @${targetUsername}`);
    console.log('═'.repeat(60));

    const startTime = Date.now();

    try {
        const result = await actionFn(page, targetUsername);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (result && result.success) {
            console.log(`\n✅ PASS [${elapsed}s] — ${actionName} on @${targetUsername}`);
        } else {
            console.log(`\n❌ FAIL [${elapsed}s] — ${actionName} on @${targetUsername}`);
            console.log(`   Error: ${result?.error || 'No error message'}`);
        }

        return { action: actionName, success: result?.success || false, time: elapsed, error: result?.error || null };
    } catch (err) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n💥 CRASH [${elapsed}s] — ${actionName} on @${targetUsername}`);
        console.log(`   Error: ${err.message}`);
        return { action: actionName, success: false, time: elapsed, error: err.message };
    }
}

async function runAllTests() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     FEEDFLOW — ACTION TEST SUITE                ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(`\n📱 Testing as @${YOUR_INSTA_USERNAME}...\n`);

    const session = new InstagramSession(path.join(__dirname, 'sessions'));

    try {
        // Step 1: Launch browser
        console.log('🚀 Launching browser...');
        await session.launch();
        console.log('✅ Browser launched');

        // Step 2: Login
        console.log('🔑 Logging in...');
        const loginResult = await session.login(YOUR_INSTA_USERNAME, YOUR_INSTA_PASSWORD);

        if (!loginResult.success) {
            if (loginResult.needsChallenge) {
                console.log('⚠️  Challenge required! Enter code below:');
                const code = await new Promise((resolve) => {
                    const readline = require('readline');
                    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                    rl.question('   Verification code: ', (answer) => {
                        rl.close();
                        resolve(answer.trim());
                    });
                });
                const challengeResult = await session.submitChallengeCode(code);
                if (!challengeResult.success) {
                    throw new Error(`Challenge failed: ${challengeResult.error}`);
                }
                console.log('✅ Challenge resolved!');
            } else {
                throw new Error(`Login failed: ${loginResult.error}`);
            }
        } else {
            console.log(`✅ Logged in (method: ${loginResult.method})`);
        }

        // Get the page from the session
        const page = session.page;
        if (!page) {
            throw new Error('No page available after login');
        }

        // Step 3: Run each test using STANDALONE functions
        const results = [];

        results.push(await testAction('view_profile', TEST_TARGETS.view_profile, actionViewProfile, page));
        results.push(await testAction('watch_reel', TEST_TARGETS.watch_reel, actionWatchReel, page));
        results.push(await testAction('like_post', TEST_TARGETS.like_post, actionLikePost, page));
        results.push(await testAction('save_post', TEST_TARGETS.save_post, actionSavePost, page));
        results.push(await testAction('follow', TEST_TARGETS.follow, actionFollow, page));

        // ─── SUMMARY ───
        console.log('\n\n╔══════════════════════════════════════════════╗');
        console.log('║           📊 TEST SUMMARY                   ║');
        console.log('╚══════════════════════════════════════════════╝');

        let passed = 0;
        let failed = 0;

        for (const r of results) {
            const icon = r.success ? '✅' : '❌';
            const status = r.success ? 'PASS' : 'FAIL';
            const extra = r.success ? '' : ` | ${r.error}`;
            console.log(` ${icon} ${status} | ${r.action.padEnd(15)} | ${r.time}s${extra}`);
            if (r.success) passed++;
            else failed++;
        }

        console.log('\n' + '─'.repeat(50));
        console.log(` 📊 Total: ${results.length}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}`);
        console.log('─'.repeat(50));

    } catch (err) {
        console.error(`\n💥 Fatal error: ${err.message}`);
        console.error(err.stack);
    } finally {
        console.log('\n🔌 Closing browser...');
        try { await session.close(); } catch (e) { console.error(`   Warning: ${e.message}`); }
        console.log('👋 Done!');
        process.exit(0);
    }
}

runAllTests();