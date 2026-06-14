import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from "react-native";

export default function AutomationScreen() {
    const [active, setActive] = useState(true);

    const activityPool = [
        "Viewed AI Reel",
        "Saved Startup Post",
        "Opened #ArtificialIntelligence",
        "Ignored Fitness Reel",
        "Followed Tech Creator",
        "Viewed Cybersecurity Content",
        "Opened Startup Founder Profile",
        "Liked Technology Reel",
    ];

    const [logs, setLogs] = useState<string[]>([
        "Automation Started",
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            const randomAction =
                activityPool[
                Math.floor(
                    Math.random() * activityPool.length
                )
                ];

            const time = new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });

            setLogs((prev) => [
                `${time} • ${randomAction}`,
                ...prev,
            ]);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <ScrollView
            style={{
                flex: 1,
                backgroundColor: "#0B0F19",
            }}
        >
            {/* Header */}
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
                    Automation Center
                </Text>

                <Text
                    style={{
                        color: "#94A3B8",
                        marginTop: 5,
                    }}
                >
                    Feed personalization engine
                </Text>
            </View>

            {/* Status */}
            <View
                style={{
                    backgroundColor: "#141B2D",
                    marginHorizontal: 20,
                    borderRadius: 24,
                    padding: 20,
                }}
            >
                <Text
                    style={{
                        color: "#94A3B8",
                    }}
                >
                    Automation Status
                </Text>

                <Text
                    style={{
                        color: active
                            ? "#10B981"
                            : "#EF4444",
                        fontSize: 30,
                        fontWeight: "bold",
                        marginTop: 10,
                    }}
                >
                    {active ? "ACTIVE" : "PAUSED"}
                </Text>

                <Text
                    style={{
                        color: "#94A3B8",
                        marginTop: 10,
                    }}
                >
                    Last Run: 2 minutes ago
                </Text>
            </View>

            {/* Metrics */}
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginHorizontal: 20,
                    marginTop: 20,
                }}
            >
                <View
                    style={{
                        width: "48%",
                        backgroundColor: "#141B2D",
                        borderRadius: 20,
                        padding: 20,
                    }}
                >
                    <Text style={{ color: "#94A3B8" }}>
                        Tasks Today
                    </Text>

                    <Text
                        style={{
                            color: "white",
                            fontSize: 30,
                            fontWeight: "bold",
                            marginTop: 10,
                        }}
                    >
                        {logs.length}
                    </Text>
                </View>

                <View
                    style={{
                        width: "48%",
                        backgroundColor: "#141B2D",
                        borderRadius: 20,
                        padding: 20,
                    }}
                >
                    <Text style={{ color: "#94A3B8" }}>
                        Alignment
                    </Text>

                    <Text
                        style={{
                            color: "#7C3AED",
                            fontSize: 30,
                            fontWeight: "bold",
                            marginTop: 10,
                        }}
                    >
                        78%
                    </Text>
                </View>
            </View>

            {/* Control Button */}
            <TouchableOpacity
                onPress={() => setActive(!active)}
                style={{
                    backgroundColor: active
                        ? "#EF4444"
                        : "#10B981",
                    margin: 20,
                    padding: 18,
                    borderRadius: 18,
                    alignItems: "center",
                }}
            >
                <Text
                    style={{
                        color: "white",
                        fontWeight: "bold",
                    }}
                >
                    {active
                        ? "Pause Automation"
                        : "Resume Automation"}
                </Text>
            </TouchableOpacity>

            {/* Activity Feed */}
            <View
                style={{
                    marginHorizontal: 20,
                    marginBottom: 40,
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
                        <Text
                            style={{
                                color: "white",
                            }}
                        >
                            {log}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}