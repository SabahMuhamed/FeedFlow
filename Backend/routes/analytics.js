const express = require("express");
const router = express.Router();

const supabase =
    require("../services/supabase");

router.get(
    "/:username",
    async (req, res) => {

        try {

            const username =
                req.params.username;

            const {
                data: logs,
                error,
            } = await supabase
                .from("activity_logs")
                .select("*")
                .eq(
                    "instagram_username",
                    username
                );

            if (error)
                throw error;

            const actionsToday =
                logs.length;

            const reels =
                logs.filter(
                    (log) =>
                        log.action ===
                        "watch_reel"
                ).length;

            const saves =
                logs.filter(
                    (log) =>
                        log.action ===
                        "save_post"
                ).length;

            const profiles =
                logs.filter(
                    (log) =>
                        log.action ===
                        "view_profile"
                ).length;

            res.json({
                success: true,
                actionsToday,
                reels,
                saves,
                profiles,
                logs,
            });

        } catch (err) {

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