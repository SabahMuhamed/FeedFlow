import React, {
    useEffect,
    useState,
} from "react";

import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from "react-native";

import { usePreferences } from "../store/usePreferences";
import {
    getUsername,
} from "../services/storage";

export default function DashboardScreen({
    navigation,
}: any) {
    const [username, setUsername] =
        useState("");
    useEffect(() => {

        const loadUser =
            async () => {

                const savedUser =
                    await getUsername();

                if (savedUser) {
                    setUsername(savedUser);
                }

            };

        loadUser();

    }, []);

    const interests = usePreferences(
        (state) => state.interests
    );

    const logs = [
        "Viewed AI Reel",
        "Saved Startup Post",
        "Ignored Fitness Reel",
        "Opened #ArtificialIntelligence",
        "Followed Tech Creator",
    ];
    const instagram = {
        username: username
            ? `@${username}`
            : "@feedflow_user",

        status: "Connected",

        lastSync:
            new Date().toLocaleTimeString(),
    };

    return (
        <ScrollView
            style={{
                flex: 1,
                backgroundColor: "#0B0F19",
            }}
        >
            <View
                style={{
                    padding: 20,
                    marginTop: 50,
                }}
            >
                <Text
                    style={{
                        color: "white",
                        fontSize: 30,
                        fontWeight: "bold",
                    }}
                >
                    FeedFlow
                </Text>

                <View
                    style={{
                        backgroundColor: "#141B2D",
                        marginHorizontal: 20,
                        borderRadius: 24,
                        padding: 20,
                        marginBottom: 20,
                    }}
                >
                    <Text
                        style={{
                            color: "#94A3B8",
                            fontSize: 14,
                        }}
                    >
                        Instagram Account
                    </Text>

                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 12,
                        }}
                    >
                        <View
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: "#10B981",
                                marginRight: 8,
                            }}
                        />

                        <Text
                            style={{
                                color: "#10B981",
                                fontWeight: "bold",
                            }}
                        >
                            {instagram.status}
                        </Text>
                    </View>

                    <Text
                        style={{
                            color: "white",
                            fontSize: 20,
                            fontWeight: "bold",
                            marginTop: 10,
                        }}
                    >
                        {instagram.username}
                    </Text>

                    <Text
                        style={{
                            color: "#94A3B8",
                            marginTop: 8,
                        }}
                    >
                        {instagram.lastSync}
                    </Text>
                </View>

                <Text
                    style={{
                        color: "#94A3B8",
                        marginTop: 5,
                    }}
                >
                    Personalizing your Instagram experience
                </Text>
            </View>

            <View
                style={{
                    paddingHorizontal: 20,
                    marginBottom: 20,
                }}
            >
                <Text
                    style={{
                        color: "white",
                        fontSize: 20,
                        fontWeight: "bold",
                    }}
                >
                    Your Interests
                </Text>

                <Text
                    style={{
                        color: "#7C3AED",
                        marginTop: 10,
                    }}
                >
                    {interests.length > 0
                        ? interests.join(", ")
                        : "No interests selected"}
                </Text>
            </View>

            <TouchableOpacity
                onPress={() =>
                    navigation.navigate("Interests")
                }
                style={{
                    backgroundColor: "#7C3AED",
                    marginHorizontal: 20,
                    marginBottom: 20,
                    padding: 16,
                    borderRadius: 16,
                    alignItems: "center",
                }}
            >
                <Text
                    style={{
                        color: "white",
                        fontWeight: "bold",
                    }}
                >
                    Edit Interests
                </Text>
            </TouchableOpacity>

            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                }}
            >
                <View
                    style={{
                        backgroundColor: "#141B2D",
                        width: "48%",
                        borderRadius: 20,
                        padding: 20,
                    }}
                >
                    <Text style={{ color: "#94A3B8" }}>
                        Feed Alignment
                    </Text>

                    <Text
                        style={{
                            color: "white",
                            fontSize: 32,
                            fontWeight: "bold",
                            marginTop: 10,
                        }}
                    >
                        78%
                    </Text>
                </View>

                <View
                    style={{
                        backgroundColor: "#141B2D",
                        width: "48%",
                        borderRadius: 20,
                        padding: 20,
                    }}
                >
                    <Text style={{ color: "#94A3B8" }}>
                        Status
                    </Text>

                    <Text
                        style={{
                            color: "#10B981",
                            fontSize: 24,
                            fontWeight: "bold",
                            marginTop: 10,
                        }}
                    >
                        Active
                    </Text>
                </View>
            </View>

            <View
                style={{
                    margin: 20,
                    backgroundColor: "#141B2D",
                    borderRadius: 20,
                    padding: 20,
                }}
            >
                <Text style={{ color: "#94A3B8" }}>
                    Actions Today
                </Text>

                <Text
                    style={{
                        color: "white",
                        fontSize: 40,
                        fontWeight: "bold",
                        marginTop: 10,
                    }}
                >
                    142
                </Text>
            </View>

            <View
                style={{
                    marginHorizontal: 20,
                    marginBottom: 30,
                }}
            >
                <Text
                    style={{
                        color: "white",
                        fontSize: 22,
                        fontWeight: "bold",
                        marginBottom: 15,
                    }}
                >
                    Recent Activity
                </Text>

                {logs.map((log, index) => (
                    <View
                        key={index}
                        style={{
                            backgroundColor: "#141B2D",
                            padding: 16,
                            borderRadius: 16,
                            marginBottom: 12,
                        }}
                    >
                        <Text style={{ color: "white" }}>
                            {log}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}