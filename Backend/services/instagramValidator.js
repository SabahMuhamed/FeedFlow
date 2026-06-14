const axios = require("axios");

async function validateInstagram(
    username,
    sessionCookie
) {

    // Development mode bypass
    if (
        process.env.DEV_MODE ===
        "true"
    ) {
        console.log(
            "DEV MODE ENABLED - Skipping Instagram Validation"
        );

        return {
            valid: true,
            reason: "dev_mode",
        };
    }

    try {

        const response =
            await axios.get(
                "https://www.instagram.com/accounts/edit/",
                {
                    headers: {
                        Cookie:
                            `sessionid=${sessionCookie}`,
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0 Safari/537.36",
                        Accept:
                            "text/html,application/xhtml+xml",
                    },

                    // Don't automatically follow redirects
                    maxRedirects: 0,

                    // Allow us to inspect non-200 responses
                    validateStatus: () => true,
                }
            );

        console.log(
            "Instagram Status:",
            response.status
        );

        // Instagram often redirects invalid sessions
        if (
            response.status === 301 ||
            response.status === 302
        ) {
            return {
                valid: false,
                reason:
                    "redirected_to_login",
            };
        }

        // Forbidden / blocked
        if (
            response.status === 403
        ) {
            return {
                valid: false,
                reason: "forbidden",
            };
        }

        // Rate limited
        if (
            response.status === 429
        ) {
            return {
                valid: false,
                reason:
                    "rate_limited",
            };
        }

        const html =
            response.data || "";

        const found =
            html
                .toLowerCase()
                .includes(
                    username
                        .trim()
                );

        return {
            valid: found,
            reason: found
                ? "username_found"
                : "username_not_found",
        };

    } catch (err) {

        console.log(
            "INSTAGRAM VALIDATION ERROR"
        );

        console.log(
            err.message
        );

        if (
            err.response
        ) {
            console.log(
                "Status:",
                err.response.status
            );
        }

        return {
            valid: false,
            reason: "exception",
        };
    }
}

module.exports =
    validateInstagram;