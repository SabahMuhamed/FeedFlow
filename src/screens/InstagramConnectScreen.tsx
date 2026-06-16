import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import {
    connectInstagramSession, getInstagramSessionStatus,
    submitChallenge, disconnectInstagramSession,
} from "../services/api";
import { saveUsername } from "../services/storage";
import { T } from "../services/theme";
import { Card, SectionLabel, Btn, Badge, StatusRow, Input, Header } from "../components/ui";

const STATUS_CONFIG: Record<string, string> = {
    disconnected: "Disconnected",
    connecting: "Connecting...",
    launching_browser: "Launching browser...",
    checking_session: "Checking saved session...",
    session_expired: "Session expired, logging in...",
    navigating_to_login: "Opening Instagram login...",
    logging_in: "Logging in...",
    challenge_required: "Verification required",
    connected: "Connected",
    login_failed: "Login Failed",
};

export default function InstagramConnectScreen({ navigation }: any) {
    const [status, setStatus] = useState("disconnected");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [connectedUsername, setConnectedUsername] = useState("");
    const [challengeCode, setChallengeCode] = useState("");
    const [showChallengeInput, setShowChallengeInput] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const pollRef = useRef<any>(null);

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    const startPolling = (user: string) => {
        if (pollRef.current) clearInterval(pollRef.current);
        let count = 0;
        pollRef.current = setInterval(async () => {
            count++;
            try {
                const result = await getInstagramSessionStatus(user);
                if (result.connected) {
                    setStatus("connected");
                    setConnectedUsername(user);
                    setStatusMessage("Session active");
                    setIsProcessing(false);
                    clearInterval(pollRef.current);
                    return;
                }
                if (result.status === "login_failed") {
                    setStatus("login_failed");
                    setErrorMessage(result.error || "Login failed — check your credentials");
                    setIsProcessing(false);
                    clearInterval(pollRef.current);
                    return;
                }
                if (result.status === "challenge_required") {
                    setStatus("challenge_required");
                    setShowChallengeInput(true);
                    setStatusMessage("Check your email or phone for a code");
                    return;
                }
                if (result.status && STATUS_CONFIG[result.status]) {
                    setStatus(result.status);
                    setStatusMessage(STATUS_CONFIG[result.status]);
                }
                if (count >= 30) {
                    setStatus("login_failed");
                    setErrorMessage("Timed out after 60 seconds. Try again.");
                    setIsProcessing(false);
                    clearInterval(pollRef.current);
                }
            } catch (e) { console.log("Poll error:", e); }
        }, 2000);
    };

    const handleConnect = async () => {
        if (!username.trim()) { Alert.alert("Enter your Instagram username"); return; }
        if (!password.trim()) { Alert.alert("Enter your Instagram password"); return; }
        setIsProcessing(true);
        setStatus("launching_browser");
        setStatusMessage("Starting browser session...");
        setErrorMessage("");
        setShowChallengeInput(false);
        try {
            const result = await connectInstagramSession(username.trim(), password.trim());
            if (result.success) {
                setStatus("connecting");
                startPolling(username.trim());
            } else {
                setStatus("login_failed");
                setErrorMessage(result.error || "Connection failed");
                setIsProcessing(false);
            }
        } catch {
            setStatus("disconnected");
            setErrorMessage("Could not reach server");
            setIsProcessing(false);
        }
    };

    const handleSubmitChallengeCode = async () => {
        if (!challengeCode.trim()) { Alert.alert("Enter the verification code"); return; }
        try {
            setStatusMessage("Verifying code...");
            const result = await submitChallenge(username.trim(), challengeCode.trim());
            if (result.success) {
                setShowChallengeInput(false);
                setChallengeCode("");
                setStatus("connected");
                setConnectedUsername(username.trim());
                setIsProcessing(false);
                clearInterval(pollRef.current);
            } else {
                Alert.alert("Invalid code", result.error || "Try again.");
            }
        } catch (e: any) { Alert.alert("Error", e.message); }
    };

    const handleRetry = () => {
        disconnectInstagramSession(username.trim()).catch(() => { });
        setStatus("disconnected");
        setErrorMessage("");
        setStatusMessage("");
        setShowChallengeInput(false);
        setIsProcessing(false);
    };

    const isConnecting = !["disconnected", "connected", "login_failed"].includes(status);

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: T.bg }}
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 }}
        >
            <Header title="Connect Instagram" subtitle="Secure one-time browser session" />

            <Card>
                <SectionLabel>Username</SectionLabel>
                <Input
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="your_instagram_username"
                    editable={status !== "connected"}
                />

                <SectionLabel>Password</SectionLabel>
                <View style={{ position: "relative" }}>
                    <Input
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        placeholder="Your Instagram password"
                        style={{ paddingRight: 50 }}
                        editable={status !== "connected"}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: 12, top: 10 }}
                    >
                        <Text style={{ color: T.muted, fontSize: 11 }}>
                            {showPassword ? "hide" : "show"}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={{ color: T.hint, fontSize: 11, marginBottom: 14 }}>
                    Used once — never stored on our servers
                </Text>

                <SectionLabel>Status</SectionLabel>
                <StatusRow status={status} />
                {statusMessage ? (
                    <Text style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>
                        {statusMessage}
                    </Text>
                ) : null}

                {status === "login_failed" && (
                    <View style={{
                        backgroundColor: T.red.bg,
                        borderWidth: 0.5,
                        borderColor: T.red.border,
                        borderRadius: 8,
                        padding: 12,
                        marginTop: 10,
                    }}>
                        <Text style={{ color: T.red.text, fontSize: 12, fontWeight: "500" }}>
                            Login failed
                        </Text>
                        <Text style={{ color: "#FCA5A5", fontSize: 11, marginTop: 3 }}>
                            {errorMessage}
                        </Text>
                    </View>
                )}

                {isConnecting && (
                    <ActivityIndicator size="small" color={T.purple.text} style={{ marginTop: 14 }} />
                )}

                {status === "connected" && (
                    <View style={{ marginTop: 10 }}>
                        <Text style={{ color: T.text, fontSize: 14, fontWeight: "500" }}>
                            @{connectedUsername || username}
                        </Text>
                        <Badge label="Session active · bot ready" variant="success" />
                    </View>
                )}
            </Card>

            {showChallengeInput && (
                <Card style={{ borderColor: T.green.border }}>
                    <SectionLabel>2FA Verification</SectionLabel>
                    <Text style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>
                        Enter the code Instagram sent to your email or phone
                    </Text>
                    <Input
                        value={challengeCode}
                        onChangeText={setChallengeCode}
                        placeholder="6-digit code"
                        keyboardType="number-pad"
                    />
                    <Btn label="Submit code" variant="success" onPress={handleSubmitChallengeCode} />
                </Card>
            )}

            <View style={{ marginTop: 4 }}>
                {status === "connected" ? (
                    <Btn
                        label="Continue to FeedFlow setup"
                        variant="success"
                        onPress={async () => {
                            await saveUsername(connectedUsername || username.trim());
                            navigation.replace("Interests", {
                                instagramUsername: connectedUsername || username.trim(),
                            });
                        }}
                    />
                ) : status === "login_failed" ? (
                    <Btn label="Retry connection" variant="primary" onPress={handleRetry} />
                ) : (
                    <Btn
                        label={isProcessing ? "Connecting..." : "Connect Instagram"}
                        variant="primary"
                        onPress={handleConnect}
                        disabled={isProcessing}
                    />
                )}
            </View>

            <Text style={{ color: T.hint, fontSize: 11, textAlign: "center", marginTop: 20, lineHeight: 17 }}>
                Credentials are used inside an ephemeral browser session and never stored.
                The session cookie is encrypted for future use.
            </Text>
        </ScrollView>
    );
}