router.get(
    "/status/:username",
    async (req, res) => {

        const username =
            req.params.username;

        const result =
            await verifySession(
                username
            );

        res.json({
            success: true,
            connected:
                result.valid,
        });
    }
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