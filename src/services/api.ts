const API_URL =
    "http://192.168.20.12:5000";

export async function connectInstagram(
    username: string,
    sessionCookie: string
) {
    const response =
        await fetch(
            `${API_URL}/instagram/connect`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    username,
                    session_cookie:
                        sessionCookie,
                }),
            }
        );

    return response.json();
}

export async function savePreferences(
    instagramUsername: string,
    interests: string[]
) {
    const response =
        await fetch(
            `${API_URL}/preferences`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    instagram_username:
                        instagramUsername,
                    interests,
                }),
            }
        );

    return response.json();
}
export async function getPreferences(
    username: string
) {

    const response =
        await fetch(
            `${API_URL}/preferences/${username}`
        );

    return response.json();
}