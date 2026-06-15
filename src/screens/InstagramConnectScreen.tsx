import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    ScrollView,
} from "react-native";
import {
    connectInstagramSession,
    getInstagramSessionStatus,
    submitChallenge,
    disconnectInstagramSession,
} from "../services/api";
import { saveUsername, getUserData } from "../services/storage";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    disconnected: { color: "#EF4444", label: "Disconnected" },
    connecting: { color: "#F59E0B", label: "Connecting..." },
    launching_browser: { color: "#F59E0B", label: "Launching browser..." },
    checking_session: { color: "#F59E0B", label: "Checking saved session..." },
    session_expired: { color: "#F59E0B", label: "Session expired, logging in..." },
    navigating_to_login: { color: "#F59E0B", label: "Opening Instagram login..." },
    logging_in: { color: "#F59E0B", label: "Logging in..." },
    challenge_required: { color: "#F59E0B", label: "Verification required" },
    connected: { color: "#10B981", label: "Connected" },
    login_failed: { color: "#EF4444", label: "Login Failed" },
};

export default function InstagramConnectScreen({ navigation }: any) {
    const [status, setStatus] = useState<string>("disconnected");
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

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const startPolling = (user: string) => {
        if (pollRef.current) clearInterval(pollRef.current);

        let pollCount = 0;
        const MAX_POLLS = 30; // 30 * 2s = 60 seconds max wait

        pollRef.current = setInterval(async () => {
            pollCount++;
            try {
                const result = await getInstagramSessionStatus(user);

                if (result.connected) {
                    // ✅ Connected successfully
                    setStatus("connected");
                    setConnectedUsername(user);
                    setStatusMessage("Session active — Bot Ready");
                    setErrorMessage("");
                    setIsProcessing(false);
                    if (pollRef.current) clearInterval(pollRef.current);
                    return;
                }

                if (result.status === "login_failed") {
                    // ❌ Login failed — stop polling and show error
                    setStatus("login_failed");
                    setErrorMessage(result.error || "Login failed — check your credentials");
                    setStatusMessage(result.error || "Login failed");
                    setIsProcessing(false);
                    if (pollRef.current) clearInterval(pollRef.current);
                    return;
                }

                if (result.status === "challenge_required") {
                    setStatus("challenge_required");
                    setShowChallengeInput(true);
                    setStatusMessage("Instagram sent a verification code. Check your email or phone.");
                    setErrorMessage("");
                    // Don't stop polling — keep checking in case user submits code
                    return;
                }

                // Still connecting — update status message
                if (result.status && STATUS_CONFIG[result.status]) {
                    setStatus(result.status);
                    setStatusMessage(STATUS_CONFIG[result.status].label);
                }

                // Timeout after max polls
                if (pollCount >= MAX_POLLS) {
                    setStatus("login_failed");
                    setErrorMessage("Connection timed out after 60 seconds. Try again.");
                    setStatusMessage("Connection timed out");
                    setIsProcessing(false);
                    if (pollRef.current) clearInterval(pollRef.current);
                }
            } catch (e) {
                console.log("Poll error:", e);
            }
        }, 2000);
    };

    const handleConnect = async () => {
        if (!username.trim()) {
            Alert.alert("Missing Username", "Please enter your Instagram username.");
            return;
        }
        if (!password.trim()) {
            Alert.alert("Missing Password", "Please enter your Instagram password.");
            return;
        }

        setIsProcessing(true);
        setStatus("launching_browser");
        setStatusMessage("Starting browser session...");
        setErrorMessage("");
        setShowChallengeInput(false);
        setConnectedUsername("");

        try {
            const result = await connectInstagramSession(
                username.trim(),
                password.trim()
            );

            if (result.success) {
                setStatus("connecting");
                setStatusMessage("Connection initiated. Checking status...");
                startPolling(username.trim());
            } else {
                setStatus("login_failed");
                setErrorMessage(result.error || "Connection failed");
                setStatusMessage(result.error || "Connection failed");
                setIsProcessing(false);
            }
        } catch (err: any) {
            console.log(err);
            setStatus("disconnected");
            setErrorMessage("Could not reach server. Check your backend connection.");
            setStatusMessage("Server unreachable");
            setIsProcessing(false);
        }
    };

    const handleSubmitChallengeCode = async () => {
        if (!challengeCode.trim()) {
            Alert.alert("Missing Code", "Enter the verification code from your email or SMS.");
            return;
        }

        try {
            setStatusMessage("Verifying code...");
            const result = await submitChallenge(username.trim(), challengeCode.trim());
            if (result.success) {
                setShowChallengeInput(false);
                setChallengeCode("");
                setStatus("connected");
                setConnectedUsername(username.trim());
                setStatusMessage("Verification successful!");
                setErrorMessage("");
                setIsProcessing(false);
                if (pollRef.current) clearInterval(pollRef.current);
            } else {
                Alert.alert("Verification Failed", result.error || "Invalid code. Try again.");
            }
        } catch (e: any) {
            Alert.alert("Error", e.message);
        }
    };

    const handleRetry = () => {
        // Clean up old session first
        disconnectInstagramSession(username.trim()).catch(() => { });
        setStatus("disconnected");
        setErrorMessage("");
        setStatusMessage("");
        setShowChallengeInput(false);
        setIsProcessing(false);
    };

    const getStatusColor = () => {
        if (status === "login_failed") return "#EF4444";
        if (status === "connected") return "#10B981";
        if (status === "challenge_required") return "#F59E0B";
        if (status.includes("ing") || status.includes("check")) return "#F59E0B";
        return "#EF4444";
    };

    const getStatusLabel = () => {
        return STATUS_CONFIG[status]?.label || status;
    };

    const isConnecting =
        status !== "disconnected" &&
        status !== "connected" &&
        status !== "login_failed";

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "#0B0F19" }}
            contentContainerStyle={{
                padding: 24,
                justifyContent: "center",
                flexGrow: 1,
            }}
        >
            <Text
                style={{
                    color: "white",
                    fontSize: 32,
                    fontWeight: "bold",
                    textAlign: "center",
                }}
            >
                Connect Instagram
            </Text>

            <Text
                style={{
                    color: "#94A3B8",
                    textAlign: "center",
                    marginTop: 12,
                }}
            >
                Connect your Instagram account using a secure browser session.
            </Text>

            {/* ─── Connection Card ─── */}
            <View
                style={{
                    backgroundColor: "#141B2D",
                    borderRadius: 24,
                    padding: 24,
                    marginTop: 40,
                }}
            >
                <Text style={{ color: "#94A3B8", marginBottom: 8 }}>
                    Instagram Username
                </Text>
                <TextInput
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="your_instagram_username"
                    placeholderTextColor="#64748B"
                    editable={status !== "connected"}
                    style={{
                        backgroundColor: "#0B0F19",
                        color: "white",
                        borderRadius: 12,
                        padding: 14,
                        opacity: status === "connected" ? 0.5 : 1,
                    }}
                />

                <Text style={{ color: "#94A3B8", marginTop: 20, marginBottom: 8 }}>
                    Password
                </Text>
                <View style={{ position: "relative" }}>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        placeholder="Your Instagram password"
                        placeholderTextColor="#64748B"
                        editable={status !== "connected"}
                        style={{
                            backgroundColor: "#0B0F19",
                            color: "white",
                            borderRadius: 12,
                            padding: 14,
                            paddingRight: 50,
                            opacity: status === "connected" ? 0.5 : 1,
                        }}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: 12, top: 12 }}
                    >
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                            {showPassword ? "HIDE" : "SHOW"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={{ color: "#64748B", fontSize: 11, marginTop: 6 }}>
                    Your password is used once for browser login and is never stored.
                </Text>

                {/* ─── Status Section ─── */}
                <Text style={{ color: "#94A3B8", marginTop: 24 }}>Status</Text>

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                    <View
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: getStatusColor(),
                            marginRight: 8,
                        }}
                    />
                    <Text
                        style={{
                            color: getStatusColor(),
                            fontSize: 16,
                            fontWeight: "bold",
                        }}
                    >
                        {getStatusLabel()}
                    </Text>
                </View>

                {/* Status message */}
                {statusMessage ? (
                    <Text
                        style={{
                            color:
                                status === "login_failed" ? "#EF4444" : "#94A3B8",
                            fontSize: 12,
                            marginTop: 6,
                        }}
                    >
                        {statusMessage}
                    </Text>
                ) : null}

                {/* ❌ Error message — shown when login fails */}
                {status === "login_failed" && errorMessage ? (
                    <View
                        style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            borderWidth: 1,
                            borderColor: "rgba(239, 68, 68, 0.3)",
                            borderRadius: 12,
                            padding: 14,
                            marginTop: 12,
                        }}
                    >
                        <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "600" }}>
                            Login Failed
                        </Text>
                        <Text style={{ color: "#FCA5A5", fontSize: 12, marginTop: 4 }}>
                            {errorMessage}
                        </Text>
                        <Text style={{ color: "#FCA5A5", fontSize: 11, marginTop: 8 }}>
                            Make sure your Instagram username and password are correct.
                            If 2FA is enabled, you'll see a verification prompt.
                        </Text>
                    </View>
                ) : null}

                {/* Loading spinner */}
                {isConnecting && (
                    <ActivityIndicator
                        size="large"
                        color="#7C3AED"
                        style={{ marginTop: 20 }}
                    />
                )}

                {/* Connected info */}
                {status === "connected" && (
                    <>
                        <Text
                            style={{
                                color: "#10B981",
                                marginTop: 15,
                                fontSize: 16,
                                fontWeight: "bold",
                            }}
                        >
                            @{connectedUsername || username}
                        </Text>
                        <Text style={{ color: "#64748B", marginTop: 5 }}>
                            Session Active — Bot Ready
                        </Text>
                    </>
                )}

                {/* ─── Challenge Input (2FA) ─── */}
                {showChallengeInput && (
                    <View style={{ marginTop: 20 }}>
                        <Text
                            style={{
                                color: "#F59E0B",
                                marginBottom: 10,
                                fontWeight: "bold",
                            }}
                        >
                            Verification Code Required
                        </Text>
                        <Text style={{ color: "#94A3B8", fontSize: 12, marginBottom: 10 }}>
                            Instagram sent a code to your email or phone. Enter it below to complete login.
                        </Text>
                        <TextInput
                            value={challengeCode}
                            onChangeText={setChallengeCode}
                            placeholder="Enter verification code"
                            placeholderTextColor="#64748B"
                            keyboardType="number-pad"
                            style={{
                                backgroundColor: "#0B0F19",
                                color: "white",
                                borderRadius: 12,
                                padding: 14,
                            }}
                        />
                        <TouchableOpacity
                            onPress={handleSubmitChallengeCode}
                            style={{
                                backgroundColor: "#F59E0B",
                                padding: 14,
                                borderRadius: 12,
                                alignItems: "center",
                                marginTop: 10,
                            }}
                        >
                            <Text style={{ color: "black", fontWeight: "bold" }}>
                                Submit Code
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* ─── Action Buttons ─── */}
            {status === "connected" ? (
                <TouchableOpacity
                    onPress={async () => {
                        await saveUsername(connectedUsername || username.trim());
                        navigation.replace("Interests", {
                            instagramUsername: connectedUsername || username.trim(),
                        });
                    }}
                    style={{
                        backgroundColor: "#10B981",
                        padding: 18,
                        borderRadius: 18,
                        alignItems: "center",
                        marginTop: 30,
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                        ✅ Continue to FeedFlow Setup
                    </Text>
                </TouchableOpacity>
            ) : status === "login_failed" ? (
                <TouchableOpacity
                    onPress={handleRetry}
                    style={{
                        backgroundColor: "#7C3AED",
                        padding: 18,
                        borderRadius: 18,
                        alignItems: "center",
                        marginTop: 30,
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                        🔄 Retry Connection
                    </Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={handleConnect}
                    disabled={isProcessing}
                    style={{
                        backgroundColor: isProcessing ? "#374151" : "#7C3AED",
                        padding: 18,
                        borderRadius: 18,
                        alignItems: "center",
                        marginTop: 30,
                        opacity: isProcessing ? 0.6 : 1,
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                        {isProcessing ? "⏳ Connecting..." : "🔗 Connect Instagram"}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Help text */}
            <Text
                style={{
                    color: "#374151",
                    fontSize: 11,
                    textAlign: "center",
                    marginTop: 30,
                    lineHeight: 18,
                }}
            >
                Your credentials are used once inside an ephemeral browser session and are
                never stored. The session cookie is encrypted and saved for future use.
            </Text>
        </ScrollView>
    );
}