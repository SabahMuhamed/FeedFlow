const express = require("express");
const router = express.Router();

const supabase =
    require("../services/supabase");

router.get(
    "/status/:username",
    async (req, res) => {

        try {

            const username =
                req.params.username;

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
                    account.automation_status,
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

module.exports = router;