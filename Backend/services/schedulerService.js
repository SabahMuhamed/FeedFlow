const supabase = require("./supabase");
const { processJobs } = require("../routes/automation");

const CHECK_INTERVAL = 15000; // 15 seconds
let interval = null;

async function checkPendingJobs() {
    try {
        const { data: pendingJobs, error } = await supabase
            .from("automation_jobs")
            .select("*")
            .eq("status", "pending")
            .lte("scheduled_at", new Date().toISOString())
            .order("scheduled_at", { ascending: true })
            .limit(50);

        if (error) {
            console.error("Scheduler error:", error);
            return;
        }

        if (!pendingJobs || pendingJobs.length === 0) return;

        console.log(`📬 [Scheduler] Found ${pendingJobs.length} pending job(s) ready`);

        // Group by user
        const userGroups = {};
        for (const job of pendingJobs) {
            if (!userGroups[job.instagram_username]) {
                userGroups[job.instagram_username] = [];
            }
            userGroups[job.instagram_username].push(job);
        }

        for (const [username, jobs] of Object.entries(userGroups)) {
            // Check if already running
            const existing = global.runningProcesses?.get(username);
            if (existing && !existing.cancelled) {
                console.log(`  ⏭️  ${username} already has active automation`);
                continue;
            }

            // Check if bot session exists
            const session = global.activeBots?.get(username);
            if (!session?.bot) {
                console.log(`  ⏭️  ${username} has no active bot session`);
                // Mark jobs as failed
                await supabase
                    .from("automation_jobs")
                    .update({ status: "failed" })
                    .in("id", jobs.map(j => j.id));
                continue;
            }

            console.log(`  🚀 Starting automation for ${username} (${jobs.length} jobs)`);
            processJobs(session.bot, username, jobs);
        }
    } catch (err) {
        console.error("Scheduler check error:", err);
    }
}

// Start
console.log("🔄 Scheduler started (checking every 15s)");
interval = setInterval(checkPendingJobs, CHECK_INTERVAL);

// Export for graceful shutdown
module.exports = {
    start: () => {
        if (!interval) {
            interval = setInterval(checkPendingJobs, CHECK_INTERVAL);
            console.log("🔄 Scheduler started");
        }
    },
    stop: () => {
        if (interval) {
            clearInterval(interval);
            interval = null;
            console.log("⏹️  Scheduler stopped");
        }
    },
};