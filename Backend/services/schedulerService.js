const supabase =
    require("./supabase");

async function runScheduler() {

    const {
        data: users,
        error: usersError,
    } = await supabase
        .from("automation_jobs")
        .select("instagram_username")
        .eq("status", "pending");

    if (usersError)
        throw usersError;

    const uniqueUsers = [
        ...new Set(
            users.map(
                (user) =>
                    user.instagram_username
            )
        ),
    ];

    let processed = 0;

    for (const username of uniqueUsers) {

        const {
            data: account,
            error: accountError,
        } = await supabase
            .from("instagram_accounts")
            .select("automation_status")
            .eq(
                "instagram_username",
                username
            )
            .single();

        if (accountError)
            throw accountError;

        if (
            account?.automation_status !==
            "running"
        ) {
            continue;
        }

        const {
            data: jobs,
            error: jobsError,
        } = await supabase
            .from("automation_jobs")
            .select("*")
            .eq(
                "instagram_username",
                username
            )
            .eq("status", "pending")
            .lte(
                "scheduled_at",
                new Date().toISOString()
            )
            .order(
                "scheduled_at",
                {
                    ascending: true,
                }
            )
            .limit(1);

        if (jobsError)
            throw jobsError;

        if (!jobs?.length)
            continue;

        const job = jobs[0];

        console.log(
            `Executing ${job.action} on @${job.creator_username}`
        );

        await supabase
            .from("activity_logs")
            .insert([
                {
                    instagram_username:
                        job.instagram_username,
                    creator_username:
                        job.creator_username,
                    interest:
                        job.interest,

                    action:
                        `${job.action}`,
                },
            ]);

        await supabase
            .from("automation_jobs")
            .update({
                status:
                    "completed",
            })
            .eq("id", job.id);

        const {
            data: remainingJobs,
        } = await supabase
            .from("automation_jobs")
            .select("id")
            .eq(
                "instagram_username",
                job.instagram_username
            )
            .eq(
                "status",
                "pending"
            );

        if (
            !remainingJobs ||
            remainingJobs.length === 0
        ) {

            await supabase
                .from(
                    "instagram_accounts"
                )
                .update({
                    automation_status:
                        "completed",
                })
                .eq(
                    "instagram_username",
                    job.instagram_username
                );

            console.log(
                `Automation completed for ${job.instagram_username}`
            );
        }

        processed++;
    }

    return {
        success: true,
        processed,
    };
}

module.exports = {
    runScheduler,
};