const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const InstagramSession = require("../services/instagramSession");
const supabase = require("../services/supabase");

const SESSION_DIR =
    process.env.SESSION_DIR ||
    path.join(__dirname, "..", "sessions");

if (!fs.existsSync(SESSION_DIR))
    fs.mkdirSync(SESSION_DIR, { recursive: true });

if (!global.activeBots) global.activeBots = new Map();
if (!global.runningProcesses)
    global.runningProcesses = new Map();

// ─── POST /instagram-session/connect ───
router.post("/connect", async (req, res) => {
    const { instagram_username, password } = req.body;

    if (!instagram_username || !password) {
        return res.status(400).json({
            success: false,
            error: "instagram_username and password required",
        });
    }

    try {
        // Close existing session
        const existing = global.activeBots.get(instagram_username);
        if (existing?.bot) {
            await existing.bot.close().catch(() => { });
            global.activeBots.delete(instagram_username);
        }

        const bot = new InstagramSession(SESSION_DIR);
        await bot.launch();

        // Store with pending status
        global.activeBots.set(instagram_username, {
            bot,
            username: instagram_username,
            status: "connecting",
            error: null,
        });

        // Login in background
        bot
            .login(instagram_username, password)
            .then(async result => {
                if (result.success) {
                    console.log(`✅ ${instagram_username} connected (${result.method})`);

                    // ✅ Update global state to connected
                    const session = global.activeBots.get(instagram_username);
                    if (session) {
                        session.status = "connected";
                        session.error = null;
                    }

                    await supabase
                        .from("instagram_accounts")
                        .update({
                            session_connected: true,
                            session_file: `${instagram_username}.json`,
                            connected_at: new Date().toISOString(),
                            status: "connected",
                        })
                        .eq("instagram_username", instagram_username);
                } else if (result.needsChallenge) {
                    console.log(`🔐 ${instagram_username} needs 2FA challenge`);

                    const session = global.activeBots.get(instagram_username);
                    if (session) {
                        session.status = "challenge_required";
                        session.error = result.message || "Verification code required";
                    }
                } else {
                    console.error(`❌ ${instagram_username} login failed:`, result.error);

                    // ❌ Update global state to failed
                    const session = global.activeBots.get(instagram_username);
                    if (session) {
                        session.status = "login_failed";
                        session.error = result.error || "Login failed — check credentials";
                    }

                    // Close the browser since login failed
                    bot.close().catch(() => { });
                    // Don't delete from map — frontend can read the error state
                }
            })
            .catch(err => {
                console.error(`❌ ${instagram_username} error:`, err);

                const session = global.activeBots.get(instagram_username);
                if (session) {
                    session.status = "login_failed";
                    session.error = err.message;
                }

                bot.close().catch(() => { });
            });

        res.json({
            success: true,
            message: "Connection initiated. Check status endpoint.",
        });
    } catch (err) {
        console.error("Connect error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── POST /instagram-session/submit-challenge ───
router.post("/submit-challenge", async (req, res) => {
    const { instagram_username, code } = req.body;
    const session = global.activeBots.get(instagram_username);
    if (!session?.bot) {
        return res.status(400).json({ success: false, error: "No active session" });
    }

    const result = await session.bot.submitChallengeCode(code);
    if (result.success) {
        session.status = "connected";
        session.error = null;

        await supabase
            .from("instagram_accounts")
            .update({
                session_connected: true,
                status: "connected",
                connected_at: new Date().toISOString(),
            })
            .eq("instagram_username", instagram_username);
    } else {
        session.error = result.error || "Challenge code may be incorrect";
    }

    res.json(result);
});

// ─── GET /instagram-session/status/:username ───
router.get("/status/:username", async (req, res) => {
    const { username } = req.params;
    const botSession = global.activeBots.get(username);
    const process = global.runningProcesses.get(username);

    const { data: account } = await supabase
        .from("instagram_accounts")
        .select("*")
        .eq("instagram_username", username)
        .single();

    // ✅ Return detailed status with error info
    res.json({
        connected: botSession?.status === "connected",
        status: botSession?.status || "disconnected",
        error: botSession?.error || null,
        isRunning: !!process && !process.cancelled,
        isPaused: process?.paused || false,
        account: account || null,
        automationStatus: account?.automation_status || "stopped",
        sessionConnected: account?.session_connected || false,
    });
});

// ─── POST /instagram-session/disconnect ───
router.post("/disconnect", async (req, res) => {
    const { instagram_username } = req.body;
    const session = global.activeBots.get(instagram_username);

    if (session?.bot) {
        const process = global.runningProcesses.get(instagram_username);
        if (process) process.cancelled = true;

        await session.bot.close().catch(() => { });
        global.activeBots.delete(instagram_username);
    }

    await supabase
        .from("instagram_accounts")
        .update({
            session_connected: false,
            status: "disconnected",
            automation_status: "stopped",
        })
        .eq("instagram_username", instagram_username);

    res.json({ success: true });
});

module.exports = router;