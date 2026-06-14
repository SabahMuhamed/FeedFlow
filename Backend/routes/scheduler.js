const express = require("express");
const router = express.Router();

const supabase =
    require("../services/supabase");

router.post(
    "/run",
    async (req, res) => {

        try {

            const {
                data: users,
                error: usersError,
            } = await supabase
                .from("automation_jobs")
                .select(
                    "instagram_username"
                )
                .eq(
                    "status",
                    "pending"
                );

            if (usersError)
                throw usersError;

            const uniqueUsers =
                [
                    ...new Set(
                        users.map(
                            (
                                user
                            ) =>
                                user.instagram_username
                        )
                    ),
                ];

            let processed =
                0;

            for (
                const username
                of uniqueUsers
            ) {
                const {
                    data: account,
                    error: accountError,
                } = await supabase
                    .from(
                        "instagram_accounts"
                    )
                    .select(
                        "automation_status"
                    )
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
                    .from(
                        "automation_jobs"
                    )
                    .select("*")
                    .eq(
                        "instagram_username",
                        username
                    )
                    .eq(
                        "status",
                        "pending"
                    )
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

                if (
                    jobsError
                )
                    throw jobsError;

                if (
                    !jobs ||
                    jobs.length === 0
                )
                    continue;

                const job =
                    jobs[0];

                console.log(
                    `Executing ${job.action} on @${job.creator_username} for ${job.instagram_username}`
                );

                const {
                    error:
                    logError,
                } = await supabase
                    .from(
                        "activity_logs"
                    )
                    .insert([
                        {
                            instagram_username:
                                job.instagram_username,
                            creator_username:
                                job.creator_username,
                            interest:
                                job.interest,
                            action:
                                job.action,
                        },
                    ]);

                if (
                    logError
                )
                    throw logError;

                const {
                    error:
                    updateError,
                } = await supabase
                    .from(
                        "automation_jobs"
                    )
                    .update({
                        status:
                            "completed",
                    })
                    .eq(
                        "id",
                        job.id
                    );

                if (
                    updateError
                )
                    throw updateError;
                const {
                    data: remainingJobs,
                    error: remainingError,
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

                if (remainingError)
                    throw remainingError;

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
                    console.log(
                        "Remaining jobs:",
                        remainingJobs?.length || 0
                    );
                }

                processed++;
            }

            res.json({
                success: true,
                processed,
            });

        } catch (err) {

            console.error(
                "SCHEDULER ERROR:"
            );

            console.error(
                err
            );

            res.status(500)
                .json({
                    success: false,
                    error:
                        err.message,
                });
        }
    }
);

module.exports = router;