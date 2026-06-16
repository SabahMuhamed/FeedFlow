const express = require("express");
const router = express.Router();

const supabase =
    require("../services/supabase");

router.post(
    "/connect",
    async (req, res) => {

        try {

            const { username } =
                req.body;

            const {
                data,
                error,
            } = await supabase
                .from(
                    "instagram_accounts"
                )
                .upsert(
                    {
                        instagram_username:
                            username,

                        status:
                            "connected",

                        session_connected:
                            true,

                        automation_status:
                            "stopped",

                        connected_at:
                            new Date()
                                .toISOString(),

                        last_sync:
                            new Date()
                                .toISOString(),
                    },
                    {
                        onConflict:
                            "instagram_username",
                    }
                )
                .select();

            if (error)
                throw error;

            // Demo interests
            await supabase
                .from("preferences")
                .upsert([
                    {
                        instagram_username:
                            username,
                        interest: "AI",
                        weight: 10,
                    },
                    {
                        instagram_username:
                            username,
                        interest:
                            "Cybersecurity",
                        weight: 10,
                    },
                    {
                        instagram_username:
                            username,
                        interest:
                            "Startups",
                        weight: 10,
                    },
                ]);

            res.json({
                success: true,
                simulated: true,
                data,
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false,
                error:
                    err.message,
            });

        }

    }
);

module.exports = router;