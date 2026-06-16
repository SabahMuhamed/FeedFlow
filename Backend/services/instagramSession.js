const supabase =
    require("./supabase");

async function connectInstagram(
    username
) {

    try {

        const {
            data,
            error,
        } = await supabase
            .from(
                "instagram_accounts"
            )
            .upsert([
                {
                    instagram_username:
                        username,

                    status:
                        "connected",

                    automation_status:
                        "stopped",

                    session_connected:
                        true,

                    session_file:
                        "simulation",

                    connected_at:
                        new Date()
                            .toISOString(),

                    last_sync:
                        new Date()
                            .toISOString(),
                },
            ])
            .select();

        if (error)
            throw error;

        console.log(
            `✅ Simulated Instagram connection for ${username}`
        );

        return {
            success: true,
            simulated: true,
            account:
                data?.[0] || null,
        };

    } catch (err) {

        console.error(
            "Simulation connect error:",
            err
        );

        return {
            success: false,
            error:
                err.message,
        };

    }

}

async function verifySession(
    username
) {

    try {

        const {
            data,
            error,
        } = await supabase
            .from(
                "instagram_accounts"
            )
            .select(
                "session_connected"
            )
            .eq(
                "instagram_username",
                username
            )
            .single();

        if (
            error ||
            !data
        ) {

            return {
                valid: false,
            };

        }

        return {
            valid:
                data.session_connected ===
                true,
        };

    } catch (err) {

        return {
            valid: false,
        };

    }

}

module.exports = {
    connectInstagram,
    verifySession,
};