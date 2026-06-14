const express = require("express");
const router = express.Router();

const supabase =
    require("../services/supabase");

router.get(
    "/:interest",
    async (req, res) => {

        try {

            const interest =
                req.params.interest;

            const {
                data,
                error,
            } = await supabase
                .from("creator_pool")
                .select("*")
                .eq(
                    "interest",
                    interest
                );

            if (error)
                throw error;

            res.json({
                success: true,
                data,
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
    "/save",
    async (req, res) => {

        try {

            const {
                instagram_username,
                creators,
            } = req.body;

            await supabase
                .from("user_creators")
                .delete()
                .eq(
                    "instagram_username",
                    instagram_username
                );

            const rows =
                creators.map(
                    (creator) => ({
                        instagram_username,
                        creator_username:
                            creator.creator_username,
                        interest:
                            creator.interest,
                    })
                );

            const {
                data,
                error,
            } = await supabase
                .from("user_creators")
                .insert(rows)
                .select();

            if (error)
                throw error;

            res.json({
                success: true,
                data,
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