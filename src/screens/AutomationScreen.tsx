import React, {
    useEffect,
    useState,
} from "react";

import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";

import {
    getAutomationStatus,
    getAnalytics,
    generateAutomation,
    pauseAutomation,
    resumeAutomation,
    stopAutomation,
} from "../services/api";

import {
    getUsername,
} from "../services/storage";

export default function AutomationScreen() {

    const [
        automation,
        setAutomation,
    ] = useState<any>(null);

    const [
        logs,
        setLogs,
    ] = useState<any[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    useEffect(() => {

        const loadData =
            async () => {

                try {

                    const username =
                        await getUsername();

                    if (!username)
                        return;

                    const status =
                        await getAutomationStatus(
                            username
                        );

                    const analytics =
                        await getAnalytics(
                            username
                        );

                    setAutomation(
                        status
                    );

                    setLogs(
                        analytics.logs || []
                    );

                } catch (err) {

                    console.log(
                        err
                    );

                } finally {

                    setLoading(
                        false
                    );

                }
            };

        loadData();

        const interval =
            setInterval(
                loadData,
                10000
            );

        return () =>
            clearInterval(
                interval
            );

    }, []);

    if (loading) {

        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor:
                        "#0B0F19",
                    justifyContent:
                        "center",
                    alignItems:
                        "center",
                }}
            >
                <ActivityIndicator
                    size="large"
                    color="#7C3AED"
                />
            </View>
        );

    }

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
                    Automation Center
                </Text>

                <Text
                    style={{
                        color:
                            "#94A3B8",
                        marginTop: 5,
                    }}
                >
                    Feed personalization engine
                </Text>
            </View>

            <View
                style={{
                    backgroundColor:
                        "#141B2D",
                    marginHorizontal:
                        20,
                    borderRadius: 24,
                    padding: 20,
                }}
            >
                <Text
                    style={{
                        color:
                            "#94A3B8",
                    }}
                >
                    Automation Status
                </Text>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent:
                            "space-between",
                        margin: 20,
                    }}
                >{automation?.automationStatus ===
                    "running" && (
                        <>
                            <TouchableOpacity
                                onPress={async () => {

                                    const username =
                                        await getUsername();

                                    if (!username)
                                        return;

                                    await pauseAutomation(
                                        username
                                    );

                                    const status =
                                        await getAutomationStatus(
                                            username
                                        );

                                    setAutomation(
                                        status
                                    );
                                }}
                                style={{
                                    backgroundColor:
                                        "#F59E0B",
                                    width: "48%",
                                    padding: 16,
                                    borderRadius: 16,
                                    alignItems:
                                        "center",
                                }}
                            >
                                <Text
                                    style={{
                                        color: "white",
                                        fontWeight:
                                            "bold",
                                    }}
                                >
                                    Pause
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={async () => {

                                    const username =
                                        await getUsername();

                                    if (!username)
                                        return;

                                    await stopAutomation(
                                        username
                                    );

                                    const status =
                                        await getAutomationStatus(
                                            username
                                        );

                                    setAutomation(
                                        status
                                    );
                                }}
                                style={{
                                    backgroundColor:
                                        "#EF4444",
                                    width: "48%",
                                    padding: 16,
                                    borderRadius: 16,
                                    alignItems:
                                        "center",
                                }}
                            >
                                <Text
                                    style={{
                                        color: "white",
                                        fontWeight:
                                            "bold",
                                    }}
                                >
                                    Stop
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {automation?.automationStatus ===
                        "paused" && (
                            <TouchableOpacity
                                onPress={async () => {

                                    const username =
                                        await getUsername();

                                    if (!username)
                                        return;

                                    await resumeAutomation(
                                        username
                                    );

                                    const status =
                                        await getAutomationStatus(
                                            username
                                        );

                                    setAutomation(
                                        status
                                    );
                                }}
                                style={{
                                    backgroundColor:
                                        "#10B981",
                                    width: "100%",
                                    padding: 16,
                                    borderRadius: 16,
                                    alignItems:
                                        "center",
                                }}
                            >
                                <Text
                                    style={{
                                        color: "white",
                                        fontWeight:
                                            "bold",
                                    }}
                                >
                                    Resume
                                </Text>
                            </TouchableOpacity>
                        )}</View>

                <Text
                    style={{
                        color:
                            automation?.automationStatus ===
                                "running"
                                ? "#10B981"
                                : automation?.automationStatus ===
                                    "completed"
                                    ? "#3B82F6"
                                    : "#EF4444",
                        fontSize: 30,
                        fontWeight:
                            "bold",
                        marginTop: 10,
                    }}
                >
                    {
                        automation?.automationStatus?.toUpperCase()
                    }
                </Text>

                <Text
                    style={{
                        color:
                            "#94A3B8",
                        marginTop: 10,
                    }}
                >
                    Pending Jobs:{" "}
                    {
                        automation?.pendingJobs
                    }
                </Text>

                <Text
                    style={{
                        color:
                            "#94A3B8",
                        marginTop: 5,
                    }}
                >
                    Completed Jobs:{" "}
                    {
                        automation?.completedJobs
                    }
                </Text>

                {automation?.nextJob && (
                    <Text
                        style={{
                            color:
                                "white",
                            marginTop: 10,
                        }}
                    >
                        Next Action:
                        {" "}
                        {
                            automation.nextJob.action
                        }
                        {" @"}
                        {
                            automation.nextJob.creator_username
                        }
                    </Text>
                )}
            </View>

            <View
                style={{
                    flexDirection:
                        "row",
                    justifyContent:
                        "space-between",
                    marginHorizontal:
                        20,
                    marginTop: 20,
                }}
            >
                <View
                    style={{
                        width: "48%",
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
                        Tasks Today
                    </Text>

                    <Text
                        style={{
                            color:
                                "white",
                            fontSize: 30,
                            fontWeight:
                                "bold",
                            marginTop: 10,
                        }}
                    >
                        {logs.length}
                    </Text>
                </View>

                <View
                    style={{
                        width: "48%",
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
                        Alignment
                    </Text>

                    <Text
                        style={{
                            color:
                                "#7C3AED",
                            fontSize: 30,
                            fontWeight:
                                "bold",
                            marginTop: 10,
                        }}
                    >
                        {alignment}%
                    </Text>
                </View>
            </View>

            <View
                style={{
                    marginHorizontal:
                        20,
                    marginTop: 20,
                    backgroundColor:
                        "#141B2D",
                    borderRadius: 20,
                    padding: 20,
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
                    Recent Activity
                </Text>

                {logs.length === 0 ? (
                    <Text
                        style={{
                            color:
                                "#94A3B8",
                            marginTop: 15,
                        }}
                    >
                        No activity yet
                    </Text>
                ) : (
                    [...logs]
                        .sort(
                            (a, b) =>
                                new Date(
                                    b.created_at
                                ).getTime() -
                                new Date(
                                    a.created_at
                                ).getTime()
                        )
                        .slice(0, 20)
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
                                            "#0B0F19",
                                        padding: 16,
                                        borderRadius: 16,
                                        marginTop: 12,
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
                                        {new Date(
                                            log.created_at
                                        ).toLocaleString(
                                            "en-GB",
                                            {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit",
                                            }
                                        )}
                                    </Text>
                                </View>
                            )
                        )
                )}
            </View>

            {(
                automation?.automationStatus ===
                "completed" ||
                automation?.automationStatus ===
                "stopped"
            ) && (
                    <TouchableOpacity
                        onPress={async () => {

                            try {

                                const username =
                                    await getUsername();

                                if (!username)
                                    return;

                                const result =
                                    await generateAutomation(
                                        username
                                    );

                                console.log(
                                    "NEW CYCLE",
                                    result
                                );

                                if (
                                    result.success
                                ) {

                                    const status =
                                        await getAutomationStatus(
                                            username
                                        );

                                    const analytics =
                                        await getAnalytics(
                                            username
                                        );

                                    setAutomation(
                                        status
                                    );

                                    setLogs(
                                        analytics.logs ||
                                        []
                                    );
                                }

                            } catch (err) {

                                console.log(
                                    err
                                );

                            }

                        }}
                        style={{
                            backgroundColor:
                                "#10B981",
                            margin: 20,
                            padding: 18,
                            borderRadius: 18,
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
                            Generate New Cycle
                        </Text>
                    </TouchableOpacity>
                )}

        </ScrollView>
    );
}