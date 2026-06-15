const API_URL = "http://192.168.20.12:5000";

// ─── Instagram Session ───

export async function connectInstagramSession(
    instagram_username: string,
    password: string
) {
    const response = await fetch(`${API_URL}/instagram-session/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_username, password }),
    });
    return response.json();
}

export async function submitChallenge(
    instagram_username: string,
    code: string
) {
    const response = await fetch(`${API_URL}/instagram-session/submit-challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_username, code }),
    });
    return response.json();
}

export async function getInstagramSessionStatus(username: string) {
    const response = await fetch(`${API_URL}/instagram-session/status/${username}`);
    return response.json();
}

export async function disconnectInstagramSession(instagram_username: string) {
    const response = await fetch(`${API_URL}/instagram-session/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_username }),
    });
    return response.json();
}

// ─── Instagram Account ───

export async function connectInstagram(username: string, sessionCookie: string) {
    const response = await fetch(`${API_URL}/instagram/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, session_cookie: sessionCookie }),
    });
    return response.json();
}

// ─── Preferences ───

export async function savePreferences(instagramUsername: string, interests: string[]) {
    const response = await fetch(`${API_URL}/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_username: instagramUsername, interests }),
    });
    return response.json();
}

export async function getPreferences(username: string) {
    const response = await fetch(`${API_URL}/preferences/${username}`);
    return response.json();
}

// ─── Creators ───

export async function getCreators(interest: string) {
    const response = await fetch(`${API_URL}/creators/${interest}`);
    return response.json();
}

export async function saveCreators(instagramUsername: string, creators: any[]) {
    const response = await fetch(`${API_URL}/creators/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_username: instagramUsername, creators }),
    });
    return response.json();
}

// ─── Automation ───

export async function generateJobs(username: string) {
    const response = await fetch(`${API_URL}/automation/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_username: username }),
    });
    return response.json();
}

export async function startAutomation(instagram_username: string) {
    const response = await fetch(`${API_URL}/automation/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_username }),
    });
    return response.json();
}

export async function getAutomationStatus(username: string) {
    const response = await fetch(`${API_URL}/automation/status/${username}`);
    return response.json();
}

export async function pauseAutomation(instagram_username: string) {
    const response = await fetch(`${API_URL}/automation/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_username }),
    });
    return response.json();
}

export async function resumeAutomation(instagram_username: string) {
    const response = await fetch(`${API_URL}/automation/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_username }),
    });
    return response.json();
}

export async function stopAutomation(instagram_username: string) {
    const response = await fetch(`${API_URL}/automation/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram_username }),
    });
    return response.json();
}

// ─── Analytics ───

export async function getAnalytics(username: string) {
    const response = await fetch(`${API_URL}/analytics/${username}`);
    return response.json();
}

export async function verifyCreator(
    username: string
) {

    const response =
        await fetch(
            `${API_URL}/creator-verify/${username}`
        );

    return response.json();
}