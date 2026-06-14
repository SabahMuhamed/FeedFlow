
import React, {
    useEffect,
    useState,
    useCallback,
} from "react";

import {
    useFocusEffect,

} from "@react-navigation/native";

import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from "react-native";

import {
    getAnalytics,
    getAutomationStatus,
} from "../services/api";

import {
    usePreferences,
} from "../store/usePreferences";

import {
    getUsername,
} from "../services/storage";

export default function DashboardScreen({
    navigation,
}: any) {

    const [username, setUsername] =
        useState("");

    const [analytics, setAnalytics] =
        useState<any>(null);

    const [automation, setAutomation] =
        useState<any>(null);

    const [logs, setLogs] =
        useState<any[]>([]);

    const interests =
        usePreferences(
            (state) =>
                state.interests
        );

    const loadData =
        async () => {

            const savedUser =
                await getUsername();

            if (!savedUser)
                return;

            setUsername(
                savedUser
            );

            const analyticsData =
                await getAnalytics(
                    savedUser
                );

            const automationData =
                await getAutomationStatus(
                    savedUser
                );

            setAnalytics(
                analyticsData
            );

            setAutomation(
                automationData
            );

            setLogs(
                analyticsData?.logs ||
                []
            );
        };

    useFocusEffect(
        useCallback(() => {

            loadData();

        }, [])
    );

    useEffect(() => {

        const interval =
            setInterval(() => {

                loadData();

            }, 5000);

        return () =>
            clearInterval(
                interval
            );

    }, []);

    const formatDate =
        (date: string) => {

            return new Date(
                date
            ).toLocaleString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                }
            );
        };

    const alignment =
        automation
            ? Math.round(
                (
                    automation.completedJobs /
                    Math.max(
                        automation.completedJobs +
                        automation.pendingJobs,
                        1
                    )
                ) * 100
            )
            : 0;

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
                backgroundColor:
                    "#0B0F19",
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
                        fontWeight:
                            "bold",
                    }}
                >
                    FeedFlow
                </Text>

                <View
                    style={{
                        backgroundColor:
                            "#141B2D",
                        marginHorizontal:
                            20,
                        borderRadius: 24,
                        padding: 20,
                        marginBottom: 20,
                    }}
                >
                    <Text
                        style={{
                            color:
                                "#94A3B8",
                            fontSize: 14,
                        }}
                    >
                        Instagram Account
                    </Text>

                    <View
                        style={{
                            flexDirection:
                                "row",
                            alignItems:
                                "center",
                            marginTop: 12,
                        }}
                    >
                        <View
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor:
                                    "#10B981",
                                marginRight: 8,
                            }}
                        />

                        <Text
                            style={{
                                color:
                                    "#10B981",
                                fontWeight:
                                    "bold",
                            }}
                        >
                            {instagram.status}
                        </Text>
                    </View>

                    <Text
                        style={{
                            color:
                                "white",
                            fontSize: 20,
                            fontWeight:
                                "bold",
                            marginTop: 10,
                        }}
                    >
                        {
                            instagram.username
                        }
                    </Text>

                    <Text
                        style={{
                            color:
                                "#94A3B8",
                            marginTop: 8,
                        }}
                    >
                        {
                            instagram.lastSync
                        }
                    </Text>
                </View>

                <Text
                    style={{
                        color:
                            "#94A3B8",
                        marginTop: 5,
                    }}
                >
                    Personalizing your
                    Instagram experience
                </Text>
            </View>

            <View
                style={{
                    paddingHorizontal:
                        20,
                    marginBottom: 20,
                }}
            >
                <Text
                    style={{
                        color:
                            "white",
                        fontSize: 20,
                        fontWeight:
                            "bold",
                    }}
                >
                    Your Interests
                </Text>

                <Text
                    style={{
                        color:
                            "#7C3AED",
                        marginTop: 10,
                    }}
                >
                    {interests.length > 0
                        ? interests.join(
                            ", "
                        )
                        : "No interests selected"}
                </Text>
            </View>

            <TouchableOpacity
                onPress={() =>
                    navigation.navigate(
                        "Interests"
                    )
                }
                style={{
                    backgroundColor:
                        "#7C3AED",
                    marginHorizontal:
                        20,
                    marginBottom: 20,
                    padding: 16,
                    borderRadius: 16,
                    alignItems:
                        "center",
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
                    Edit Interests
                </Text>
            </TouchableOpacity>

            <View
                style={{
                    flexDirection:
                        "row",
                    justifyContent:
                        "space-between",
                    paddingHorizontal:
                        20,
                }}
            >
                <View
                    style={{
                        backgroundColor:
                            "#141B2D",
                        width: "48%",
                        borderRadius: 20,
                        padding: 20,
                    }}
                >
                    <Text
                        style={{
                            color:
                                "#94A3B8",
                        }}
                    >
                        Feed Alignment
                    </Text>

                    <Text
                        style={{
                            color:
                                "white",
                            fontSize: 32,
                            fontWeight:
                                "bold",
                            marginTop: 10,
                        }}
                    >
                        {alignment}%
                    </Text>
                </View>

                <View
                    style={{
                        backgroundColor:
                            "#141B2D",
                        width: "48%",
                        borderRadius: 20,
                        padding: 20,
                    }}
                >
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
                                automation?.automationStatus ===
                                    "running"
                                    ? "#10B981"
                                    : automation?.automationStatus ===
                                        "completed"
                                        ? "#3B82F6"
                                        : automation?.automationStatus ===
                                            "paused"
                                            ? "#F59E0B"
                                            : "#EF4444",
                            fontSize: 24,
                            fontWeight:
                                "bold",
                            marginTop: 10,
                        }}
                    >
                        {
                            automation?.automationStatus ||
                            "stopped"
                        }
                    </Text>
                </View>
            </View>

            <View
                style={{
                    margin: 20,
                    backgroundColor:
                        "#141B2D",
                    borderRadius: 20,
                    padding: 20,
                }}
            >
                <Text
                    style={{
                        color:
                            "#94A3B8",
                    }}
                >
                    Actions Today
                </Text>

                <Text
                    style={{
                        color:
                            "white",
                        fontSize: 40,
                        fontWeight:
                            "bold",
                        marginTop: 10,
                    }}
                >
                    {
                        analytics?.actionsToday ||
                        0
                    }
                </Text>
            </View>

            <View
                style={{
                    marginHorizontal:
                        20,
                    marginBottom: 30,
                }}
            >
                <Text
                    style={{
                        color:
                            "white",
                        fontSize: 22,
                        fontWeight:
                            "bold",
                        marginBottom: 15,
                    }}
                >
                    Recent Activity
                </Text>

                {[...logs]
                    .sort(
                        (a, b) =>
                            new Date(
                                b.created_at
                            ).getTime() -
                            new Date(
                                a.created_at
                            ).getTime()
                    )
                    .slice(0, 10)
                    .map(
                        (
                            log,
                            index
                        ) => (
                            <View
                                key={
                                    index
                                }
                                style={{
                                    backgroundColor:
                                        "#141B2D",
                                    padding: 16,
                                    borderRadius: 16,
                                    marginBottom: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        color:
                                            "white",
                                    }}
                                >
                                    {
                                        log.action
                                    }
                                    {" @"}
                                    {
                                        log.creator_username
                                    }
                                </Text>
                                <Text
                                    style={{
                                        color: "#94A3B8",
                                        marginTop: 5,
                                        fontSize: 12,
                                    }}
                                >
                                    {formatDate(
                                        log.created_at
                                    )}
                                </Text>
                            </View>
                        )
                    )}
            </View>
        </ScrollView>
    );
}