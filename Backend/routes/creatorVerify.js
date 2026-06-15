const express = require("express");
const router = express.Router();

router.get("/:username", async (req, res) => {
    try {
        const username = req.params.username;

        // Instagram's internal API - returns JSON directly, no JS rendering needed
        const response = await fetch(
            `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "X-IG-App-ID": "936619743392459", // Public Instagram Web app ID
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": `https://www.instagram.com/${username}/`,
                    "Origin": "https://www.instagram.com",
                },
            }
        );

        console.log("API Status:", response.status);

        // 404 = user not found, 200 = exists, 401/403 = rate limited
        if (response.status === 404) {
            return res.json({ success: true, exists: false });
        }

        if (response.status === 401 || response.status === 403) {
            return res.status(429).json({
                success: false,
                error: "Rate limited by Instagram. Try again later.",
            });
        }

        if (response.status === 200) {
            const data = await response.json();
            const user = data?.data?.user;

            return res.json({
                success: true,
                exists: !!user,
                // Optionally return basic profile info
                profile: user ? {
                    username: user.username,
                    full_name: user.full_name,
                    is_private: user.is_private,
                    follower_count: user.edge_followed_by?.count,
                } : null,
            });
        }

        // Unexpected status
        return res.json({ success: false, error: `Unexpected status: ${response.status}` });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});

module.exports = router;