import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    ScrollView,
} from "react-native";

import { connectInstagram } from "../services/api";
import { saveUsername } from "../services/storage";

export default function InstagramConnectScreen({
    navigation,
}: any) {
    const [status, setStatus] = useState<
        "disconnected" | "connecting" | "connected"
    >("disconnected");

    const [username, setUsername] =
        useState("");

    const [cookie, setCookie] =
        useState("");

    const handleConnect = async () => {
        try {
            if (!username || !cookie) {
                Alert.alert(
                    "Missing Information",
                    "Please enter username and session cookie"
                );
                return;
            }

            setStatus("connecting");

            const result =
                await connectInstagram(
                    username,
                    cookie
                );

            console.log(
                "CONNECT RESULT"
            );
            console.log(result);

            if (result.success) {

                await saveUsername(
                    username
                        .trim()
                );

                setStatus("connected");
            } else {
                setStatus(
                    "disconnected"
                );

                Alert.alert(
                    "Connection Failed",
                    result.error ||
                    "Unknown error"
                );
            }
        } catch (err) {
            console.log(err);

            setStatus(
                "disconnected"
            );

            Alert.alert(
                "Connection Failed",
                "Could not reach backend"
            );
        }
    };

    return (
        <ScrollView
            style={{
                flex: 1,
                backgroundColor:
                    "#0B0F19",
            }}
            contentContainerStyle={{
                padding: 24,
                justifyContent:
                    "center",
                flexGrow: 1,
            }}
        >
            <Text
                style={{
                    color: "white",
                    fontSize: 32,
                    fontWeight:
                        "bold",
                    textAlign:
                        "center",
                }}
            >
                Connect Instagram
            </Text>

            <Text
                style={{
                    color:
                        "#94A3B8",
                    textAlign:
                        "center",
                    marginTop: 12,
                }}
            >
                FeedFlow needs
                access to
                personalize your
                Instagram
                experience.
            </Text>

            <View
                style={{
                    backgroundColor:
                        "#141B2D",
                    borderRadius: 24,
                    padding: 24,
                    marginTop: 40,
                }}
            >
                <Text
                    style={{
                        color:
                            "#94A3B8",
                        marginBottom: 8,
                    }}
                >
                    Instagram
                    Username
                </Text>

                <TextInput
                    value={username}
                    onChangeText={
                        setUsername
                    }
                    placeholder="instagram_username"
                    placeholderTextColor="#64748B"
                    style={{
                        backgroundColor:
                            "#0B0F19",
                        color: "white",
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 16,
                    }}
                />

                <Text
                    style={{
                        color:
                            "#94A3B8",
                        marginBottom: 8,
                    }}
                >
                    Session Cookie
                </Text>

                <TextInput
                    value={cookie}
                    onChangeText={
                        setCookie
                    }
                    placeholder="Paste session cookie"
                    placeholderTextColor="#64748B"
                    multiline
                    style={{
                        backgroundColor:
                            "#0B0F19",
                        color: "white",
                        borderRadius: 12,
                        padding: 14,
                        minHeight: 120,
                        textAlignVertical:
                            "top",
                        marginBottom: 20,
                    }}
                />

                <Text
                    style={{
                        color:
                            "#94A3B8",
                    }}
                >
                    Status
                </Text>

                <Text
                    style={{
                        color:
                            status ===
                                "connected"
                                ? "#10B981"
                                : status ===
                                    "connecting"
                                    ? "#F59E0B"
                                    : "#EF4444",
                        fontSize: 24,
                        fontWeight:
                            "bold",
                        marginTop: 10,
                    }}
                >
                    {status ===
                        "connected"
                        ? "Connected"
                        : status ===
                            "connecting"
                            ? "Connecting..."
                            : "Disconnected"}
                </Text>

                {status ===
                    "connecting" && (
                        <ActivityIndicator
                            size="large"
                            color="#7C3AED"
                            style={{
                                marginTop: 20,
                            }}
                        />
                    )}

                {status ===
                    "connected" && (
                        <>
                            <Text
                                style={{
                                    color:
                                        "white",
                                    marginTop: 15,
                                }}
                            >
                                @{username}
                            </Text>

                            <Text
                                style={{
                                    color:
                                        "#94A3B8",
                                    marginTop: 5,
                                }}
                            >
                                Last Sync:
                                Just now
                            </Text>
                        </>
                    )}
            </View>

            {status !==
                "connected" ? (
                <TouchableOpacity
                    onPress={
                        handleConnect
                    }
                    style={{
                        backgroundColor:
                            "#7C3AED",
                        padding: 18,
                        borderRadius: 18,
                        alignItems:
                            "center",
                        marginTop: 30,
                    }}
                >
                    <Text
                        style={{
                            color:
                                "white",
                            fontWeight:
                                "bold",
                        }}
                    >
                        Connect
                        Instagram
                    </Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={() =>
                        navigation.replace(
                            "Interests",
                            {
                                instagramUsername:
                                    username.trim(),
                            }
                        )
                    }
                    style={{
                        backgroundColor:
                            "#10B981",
                        padding: 18,
                        borderRadius: 18,
                        alignItems:
                            "center",
                        marginTop: 30,
                    }}
                >
                    <Text
                        style={{
                            color:
                                "white",
                            fontWeight:
                                "bold",
                        }}
                    >
                        Continue
                    </Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}