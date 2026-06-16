const express = require("express");
const router = express.Router();
const supabase = require("../services/supabase");

// ─── POST /automation/start ───
router.post("/start", async (req, res) => {
    const { instagram_username } = req.body;
    if (!instagram_username) {
        return res.status(400).json({ success: false, error: "instagram_username required" });
    }

    try {
        const botSession = global.activeBots.get(instagram_username);
        if (!botSession?.bot) {
            return res.status(400).json({
                success: false,
                error: "No active Instagram session. Connect your account first.",
            });
        }

        // Prevent double-run
        const existingProcess = global.runningProcesses?.get(instagram_username);
        if (existingProcess && !existingProcess.cancelled) {
            return res.status(400).json({
                success: false,
                error: "Automation is already running for this account. Stop it first.",
            });
        }

        const { data: jobs, error } = await supabase
            .from("automation_jobs")
            .select("*")
            .eq("instagram_username", instagram_username)
            .eq("status", "pending")
            .order("scheduled_at", { ascending: true });

        if (error) throw error;

        if (!jobs || jobs.length === 0) {
            return res.json({ success: true, message: "No pending jobs found", jobsProcessed: 0 });
        }

        // Respond immediately, process in background
        res.json({ success: true, message: `Starting ${jobs.length} jobs`, jobsQueued: jobs.length });

        // Process jobs in background
        processJobs(botSession.bot, instagram_username, jobs);

    } catch (err) {
        console.error("Start error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── POST /automation/generate ───
router.post("/generate", async (req, res) => {
    try {
        const { instagram_username } = req.body;

        // Check for existing pending jobs
        const { data: existingJobs } = await supabase
            .from("automation_jobs")
            .select("id")
            .eq("instagram_username", instagram_username)
            .eq("status", "pending");

        if (existingJobs && existingJobs.length > 0) {
            return res.json({ success: false, error: "Pending jobs already exist. Complete or stop them first." });
        }

        // Get user's creators
        const { data: creators, error } = await supabase
            .from("user_creators")
            .select("*")
            .eq("instagram_username", instagram_username)
            .eq("active", true);

        if (error) throw error;
        if (!creators || creators.length === 0) {
            return res.status(400).json({ success: false, error: "No creators selected" });
        }

        const actions = ["view_profile", "watch_reel", "save_post", "like_post", "follow"];
        const jobs = [];
        let currentTime = new Date();

        for (const creator of creators) {
            const action = actions[Math.floor(Math.random() * actions.length)];
            const delaySeconds = Math.floor(Math.random() * 21) + 10; // 10-30s
            currentTime = new Date(currentTime.getTime() + delaySeconds * 1000);

            jobs.push({
                instagram_username,
                creator_username: creator.creator_username,
                interest: creator.interest,
                action,
                status: "pending",
                scheduled_at: currentTime.toISOString(),
                created_at: new Date().toISOString(),
            });
        }

        const { data, error: insertError } = await supabase
            .from("automation_jobs")
            .insert(jobs)
            .select();

        if (insertError) throw insertError;

        await supabase
            .from("instagram_accounts")
            .update({ automation_status: "running" })
            .eq("instagram_username", instagram_username);

        res.json({ success: true, jobs: data });

    } catch (err) {
        console.error("Generate error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── GET /automation/status/:username ───
router.get("/status/:username", async (req, res) => {
    try {
        const { username } = req.params;

        const { data: account } = await supabase
            .from("instagram_accounts")
            .select("automation_status, auto_cycle_enabled, cycle_interval_hours, last_cycle_completed")
            .eq("instagram_username", username)
            .single();

        const { count: pendingJobs } = await supabase
            .from("automation_jobs")
            .select("*", { count: "exact", head: true })
            .eq("instagram_username", username)
            .eq("status", "pending");

        const { count: completedJobs } = await supabase
            .from("automation_jobs")
            .select("*", { count: "exact", head: true })
            .eq("instagram_username", username)
            .eq("status", "completed");

        const { count: failedJobs } = await supabase
            .from("automation_jobs")
            .select("*", { count: "exact", head: true })
            .eq("instagram_username", username)
            .eq("status", "failed");

        const { data: nextJob } = await supabase
            .from("automation_jobs")
            .select("*")
            .eq("instagram_username", username)
            .eq("status", "pending")
            .order("scheduled_at", { ascending: true })
            .limit(1);

        const runningProcess = global.runningProcesses?.get(username);

        res.json({
            success: true,
            automationStatus: account?.automation_status || "stopped",
            isRunning: !!runningProcess && !runningProcess.cancelled,
            isPaused: runningProcess?.paused || false,
            pendingJobs,
            completedJobs,
            failedJobs,
            nextJob: nextJob?.[0] || null,
            autoCycleEnabled: account?.auto_cycle_enabled || false,
            cycleIntervalHours: account?.cycle_interval_hours || 0,
            lastCycleCompleted: account?.last_cycle_completed || null,
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── NEW: POST /automation/cycle-settings ───
router.post("/cycle-settings", async (req, res) => {
    try {
        const { instagram_username, auto_cycle_enabled, cycle_interval_hours } = req.body;

        if (!instagram_username) {
            return res.status(400).json({ success: false, error: "instagram_username required" });
        }

        const { error } = await supabase
            .from("instagram_accounts")
            .update({
                auto_cycle_enabled,
                cycle_interval_hours,
            })
            .eq("instagram_username", instagram_username);

        if (error) throw error;

        console.log(`🔄 [${instagram_username}] Auto-cycle ${auto_cycle_enabled ? 'ENABLED' : 'DISABLED'} (${cycle_interval_hours}h)`);

        res.json({ success: true });

    } catch (err) {
        console.error("Cycle-settings error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── POST /automation/pause ───
router.post("/pause", async (req, res) => {
    try {
        const { instagram_username } = req.body;
        const process = global.runningProcesses?.get(instagram_username);
        if (process) process.paused = true;

        await supabase
            .from("instagram_accounts")
            .update({ automation_status: "paused" })
            .eq("instagram_username", instagram_username);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── POST /automation/resume ───
router.post("/resume", async (req, res) => {
    try {
        const { instagram_username } = req.body;
        const process = global.runningProcesses?.get(instagram_username);
        if (process) {
            process.paused = false;
        } else {
            return res.redirect(307, "/automation/start");
        }

        await supabase
            .from("instagram_accounts")
            .update({ automation_status: "running" })
            .eq("instagram_username", instagram_username);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── POST /automation/stop ───
router.post("/stop", async (req, res) => {
    try {
        const { instagram_username } = req.body;

        const process = global.runningProcesses?.get(instagram_username);
        if (process) {
            process.cancelled = true;
            console.log(`⏹️  [${instagram_username}] Stop signal sent to automation process`);
        }

        await supabase
            .from("automation_jobs")
            .update({ status: "cancelled" })
            .eq("instagram_username", instagram_username)
            .in("status", ["pending", "running"]);

        await supabase
            .from("instagram_accounts")
            .update({ automation_status: "stopped" })
            .eq("instagram_username", instagram_username);

        res.json({ success: true, message: "Automation stopped and pending jobs cancelled" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ═══════════════════════════════════════════
//  JOB PROCESSOR — Core execution engine
// ═══════════════════════════════════════════

async function processJobs(bot, instagram_username, jobs) {
    if (!global.runningProcesses) global.runningProcesses = new Map();
    const processState = { cancelled: false, paused: false };
    global.runningProcesses.set(instagram_username, processState);

    console.log(`\n🔁 [${instagram_username}] Starting ${jobs.length} jobs...`);

    await supabase
        .from("instagram_accounts")
        .update({ automation_status: "running" })
        .eq("instagram_username", instagram_username);

    for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];

        if (processState.cancelled) {
            console.log(`⏹️  [${instagram_username}] Cancelled`);
            break;
        }

        while (processState.paused) {
            await sleep(2000);
            if (processState.cancelled) break;
        }
        if (processState.cancelled) break;

        await supabase
            .from("automation_jobs")
            .update({ status: "running" })
            .eq("id", job.id);

        console.log(`\n📋 [${instagram_username}] ${i + 1}/${jobs.length}: ${job.action} on @${job.creator_username}`);

        try {
            const result = await bot.executeAction(job.action, job.creator_username, job.interest);

            if (result.success) {
                await supabase
                    .from("automation_jobs")
                    .update({ status: "completed", completed_at: new Date().toISOString() })
                    .eq("id", job.id);

                await supabase
                    .from("activity_logs")
                    .insert({
                        instagram_username,
                        creator_username: job.creator_username,
                        interest: job.interest,
                        action: job.action,
                        created_at: new Date().toISOString(),
                    });

                console.log(`  ✅ ${job.action} on @${job.creator_username} — COMPLETED`);
            } else {
                throw new Error(result.error || "Action returned no success");
            }
        } catch (err) {
            console.error(`  ❌ ${job.action} on @${job.creator_username} — FAILED: ${err.message}`);

            await supabase
                .from("automation_jobs")
                .update({ status: "failed", error: err.message })
                .eq("id", job.id);

            await supabase
                .from("activity_logs")
                .insert({
                    instagram_username,
                    creator_username: job.creator_username,
                    interest: job.interest,
                    action: `${job.action}_failed`,
                    created_at: new Date().toISOString(),
                });
        }

        if (i < jobs.length - 1 && !processState.cancelled) {
            const delay = Math.floor(Math.random() * 5000) + 3000;
            console.log(`  ⏳ Waiting ${(delay / 1000).toFixed(1)}s before next job...`);
            await sleep(delay);
        }
    }

    // ─── UPDATED: Record last_cycle_completed when automation completes ───
    const status = processState.cancelled ? "stopped" : "completed";

    const updateData = { automation_status: status };
    if (status === "completed") {
        updateData.last_cycle_completed = new Date().toISOString();
        console.log(`  📅 [${instagram_username}] Cycle completed at ${updateData.last_cycle_completed}`);
    }

    await supabase
        .from("instagram_accounts")
        .update(updateData)
        .eq("instagram_username", instagram_username);

    global.runningProcesses.delete(instagram_username);
    console.log(`\n🏁 [${instagram_username}] Automation ${status}.`);
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

module.exports = router;
module.exports.processJobs = processJobs;