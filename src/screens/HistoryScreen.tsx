import React, {
    useEffect,
    useState,
} from "react";

import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
} from "react-native";

import {
    getAnalytics,
} from "../services/api";

import {
    getUsername,
} from "../services/storage";

export default function HistoryScreen() {

    const [
        logs,
        setLogs,
    ] = useState<any[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const formatDate = (
        date: string
    ) => {

        return new Date(
            date
        ).toLocaleString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            }
        );

    };

    useEffect(() => {

        const loadHistory =
            async () => {

                try {

                    const username =
                        await getUsername();

                    if (!username)
                        return;

                    const analytics =
                        await getAnalytics(
                            username
                        );

                    setLogs(
                        analytics.logs || []
                    );

                } catch (err) {

                    console.log(err);

                } finally {

                    setLoading(
                        false
                    );

                }
            };

        loadHistory();

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
                        color:
                            "white",
                        fontSize: 30,
                        fontWeight:
                            "bold",
                    }}
                >
                    Activity History
                </Text>

                <Text
                    style={{
                        color:
                            "#94A3B8",
                        marginTop: 5,
                    }}
                >
                    Complete FeedFlow activity log
                </Text>
            </View>

            <View
                style={{
                    marginHorizontal:
                        20,
                    marginBottom: 20,
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
                    Total Actions
                </Text>

                <Text
                    style={{
                        color:
                            "white",
                        fontSize: 36,
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
                    marginHorizontal:
                        20,
                    marginBottom: 40,
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
                    Recent Activities
                </Text>

                {logs.length === 0 ? (
                    <View
                        style={{
                            backgroundColor:
                                "#141B2D",
                            padding: 20,
                            borderRadius: 20,
                        }}
                    >
                        <Text
                            style={{
                                color:
                                    "#94A3B8",
                                textAlign:
                                    "center",
                            }}
                        >
                            No activity found
                        </Text>
                    </View>
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
                        .map(
                            (
                                log,
                                index
                            ) => (
                                <View
                                    key={
                                        log.id ||
                                        index
                                    }
                                    style={{
                                        backgroundColor:
                                            "#141B2D",
                                        padding: 18,
                                        borderRadius: 18,
                                        marginBottom: 12,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color:
                                                "white",
                                            fontSize:
                                                16,
                                            fontWeight:
                                                "600",
                                        }}
                                    >
                                        {
                                            log.action
                                        }
                                    </Text>

                                    <Text
                                        style={{
                                            color:
                                                "#7C3AED",
                                            marginTop:
                                                5,
                                        }}
                                    >
                                        @
                                        {
                                            log.creator_username
                                        }
                                    </Text>

                                    <Text
                                        style={{
                                            color:
                                                "#94A3B8",
                                            marginTop:
                                                8,
                                            fontSize:
                                                12,
                                        }}
                                    >
                                        {
                                            formatDate(
                                                log.created_at
                                            )
                                        }
                                    </Text>
                                </View>
                            )
                        )
                )}
            </View>
        </ScrollView>
    );
}