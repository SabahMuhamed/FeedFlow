const express = require("express");
const router = express.Router();


const supabase = require("../services/supabase");

router.post("/", async (req, res) => {
    try {
        const {
            instagram_username,
            interests,
        } = req.body;

        const rows = interests.map(
            (interest) => ({
                instagram_username,
                interest,
                weight: 10,
            })
        );

        await supabase
            .from("preferences")
            .delete()
            .eq(
                "instagram_username",
                instagram_username
            );

        const { data, error } =
            await supabase
                .from("preferences")
                .insert(rows)
                .select();

        if (error) throw error;

        res.json({
            success: true,
            data,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
router.get(
    "/:username",
    async (req, res) => {

        try {

            const username =
                req.params.username;

            const {
                data,
                error,
            } = await supabase
                .from("preferences")
                .select("*")
                .eq(
                    "instagram_username",
                    username
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

module.exports = router;