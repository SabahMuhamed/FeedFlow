const express = require("express");
const router = express.Router();

const validateInstagram =
    require("../services/instagramValidator");

const supabase =
    require("../services/supabase");

router.post(
    "/connect",
    async (req, res) => {
        try {

            const {
                username,
                session_cookie,
            } = req.body;

            const validation =
                await validateInstagram(
                    username,
                    session_cookie
                );

            if (
                !validation.valid
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        error:
                            "Invalid Instagram session",
                    });
            }

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
                        session_cookie,
                        status:
                            "connected",
                        last_sync:
                            new Date(),
                    },
                    {
                        onConflict:
                            "instagram_username",
                    }
                )
                .select();

            if (error)
                throw error;

            res.json({
                success: true,
                data,
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

module.exports = router;