const express =
    require("express");

const router =
    express.Router();

const {
    connectInstagram,
} = require(
    "../services/instagramSession"
);

router.post(
    "/reconnect",
    async (req, res) => {

        const {
            instagram_username,
        } = req.body;

        const result =
            await connectInstagram(
                instagram_username
            );

        res.json(
            result
        );
    }
);

module.exports = router;