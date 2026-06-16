const express =
    require("express");

const router =
    express.Router();

router.get(
    "/:username",
    async (req, res) => {

        const username =
            req.params.username;

        res.json({
            success: true,
            exists: true,

            profile: {
                username,
                full_name:
                    username,

                verified:
                    Math.random() > 0.5,

                follower_count:
                    Math.floor(
                        Math.random() *
                        100000
                    ) + 1000,
            },
        });

    }
);

module.exports =
    router;