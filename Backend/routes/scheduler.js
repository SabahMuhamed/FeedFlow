const express =
    require("express");

const router =
    express.Router();

const {
    runScheduler,
} = require(
    "../services/schedulerService"
);

router.post(
    "/run",
    async (req, res) => {

        try {

            const result =
                await runScheduler();

            res.json(result);

        } catch (err) {

            console.error(
                "SCHEDULER ERROR:"
            );

            console.error(err);

            res.status(500).json({
                success: false,
                error:
                    err.message,
            });

        }

    }
);

module.exports =
    router;