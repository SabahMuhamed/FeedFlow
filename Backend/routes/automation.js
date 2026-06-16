const express = require("express");
const router = express.Router();

const supabase =
    require("../services/supabase");

router.post(
    "/generate",
    async (req, res) => {

        try {

            const {
                instagram_username,
            } = req.body;

            const {
                data: existingJobs,
            } = await supabase
                .from("automation_jobs")
                .select("*")
                .eq(
                    "instagram_username",
                    instagram_username
                )
                .eq(
                    "status",
                    "pending"
                );

            if (
                existingJobs &&
                existingJobs.length > 0
            ) {
                return res.json({
                    success: false,
                    error:
                        "Automation already running",
                });
            }

            const {
                data: creators,
                error,
            } = await supabase
                .from("user_creators")
                .select("*")
                .eq(
                    "instagram_username",
                    instagram_username
                );

            if (error)
                throw error;

            const actions = [
                "view_profile",
                "watch_reel",
                "save_post",
            ];

            const jobs = [];

            let currentTime =
                new Date();

            for (
                const creator
                of creators
            ) {

                const action =
                    actions[
                    Math.floor(
                        Math.random() *
                        actions.length
                    )
                    ];

                const delaySeconds =
                    Math.floor(
                        Math.random() *
                        21
                    ) + 10;

                currentTime =
                    new Date(
                        currentTime.getTime() +
                        delaySeconds *
                        1000
                    );

                jobs.push({
                    instagram_username,
                    creator_username:
                        creator.creator_username,
                    interest:
                        creator.interest,
                    action,
                    status:
                        "pending",
                    scheduled_at:
                        currentTime,
                });
            }

            const {
                data,
                error:
                insertError,
            } = await supabase
                .from(
                    "automation_jobs"
                )
                .insert(jobs)
                .select();

            if (
                insertError
            )
                throw insertError;

            await supabase
                .from(
                    "instagram_accounts"
                )
                .update({
                    automation_status:
                        "running",
                })
                .eq(
                    "instagram_username",
                    instagram_username
                );

            res.json({
                success: true,
                jobs: data,
            });

        } catch (err) {

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
router.get(
    "/status/:username",
    async (req, res) => {

        try {

            const username =
                req.params.username;

            const {
                data: account,
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

            const {
                count: pendingJobs,
            } = await supabase
                .from(
                    "automation_jobs"
                )
                .select("*", {
                    count: "exact",
                    head: true,
                })
                .eq(
                    "instagram_username",
                    username
                )
                .eq(
                    "status",
                    "pending"
                );

            const {
                count: completedJobs,
            } = await supabase
                .from(
                    "automation_jobs"
                )
                .select("*", {
                    count: "exact",
                    head: true,
                })
                .eq(
                    "instagram_username",
                    username
                )
                .eq(
                    "status",
                    "completed"
                );

            const {
                data: nextJob,
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
                .order(
                    "scheduled_at",
                    {
                        ascending: true,
                    }
                )
                .limit(1);

            res.json({
                success: true,
                automationStatus:
                    account?.automation_status ||
                    "stopped",
                pendingJobs,
                completedJobs,
                nextJob:
                    nextJob?.[0] || null,
            });

        } catch (err) {

            res.status(500).json({
                success: false,
                error:
                    err.message,
            });

        }
    }
);
router.post(
    "/pause",
    async (req, res) => {

        try {

            const {
                instagram_username,
            } = req.body;

            await supabase
                .from(
                    "instagram_accounts"
                )
                .update({
                    automation_status:
                        "paused",
                })
                .eq(
                    "instagram_username",
                    instagram_username
                );

            res.json({
                success: true,
            });

        } catch (err) {

            res.status(500).json({
                success: false,
                error:
                    err.message,
            });

        }
    }
);
router.post(
    "/resume",
    async (req, res) => {

        try {

            const {
                instagram_username,
            } = req.body;

            await supabase
                .from(
                    "instagram_accounts"
                )
                .update({
                    automation_status:
                        "running",
                })
                .eq(
                    "instagram_username",
                    instagram_username
                );

            res.json({
                success: true,
            });

        } catch (err) {

            res.status(500).json({
                success: false,
                error:
                    err.message,
            });

        }
    }
);
router.post(
    "/stop",
    async (req, res) => {

        try {

            const {
                instagram_username,
            } = req.body;

            await supabase
                .from(
                    "automation_jobs"
                )
                .delete()
                .eq(
                    "instagram_username",
                    instagram_username
                )
                .eq(
                    "status",
                    "pending"
                );

            await supabase
                .from(
                    "instagram_accounts"
                )
                .update({
                    automation_status:
                        "stopped",
                })
                .eq(
                    "instagram_username",
                    instagram_username
                );

            res.json({
                success: true,
            });

        } catch (err) {

            res.status(500).json({
                success: false,
                error:
                    err.message,
            });

        }
    }
);

module.exports = router;