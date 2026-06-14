import React from "react";
import {
    View,
    Text,
    ScrollView,
    Dimensions,
} from "react-native";

import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function AnalyticsScreen() {
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
                    Analytics
                </Text>

                <Text
                    style={{
                        color: "#94A3B8",
                        marginTop: 5,
                    }}
                >
                    Personalization performance
                </Text>
            </View>

            <View
                style={{
                    backgroundColor: "#141B2D",
                    margin: 20,
                    borderRadius: 24,
                    padding: 20,
                }}
            >
                <Text
                    style={{
                        color: "white",
                        fontSize: 20,
                        fontWeight: "bold",
                        marginBottom: 20,
                    }}
                >
                    Feed Improvement
                </Text>

                <LineChart
                    data={{
                        labels: ["D1", "D3", "D5", "D7"],
                        datasets: [
                            {
                                data: [42, 56, 67, 78],
                            },
                        ],
                    }}
                    width={screenWidth - 80}
                    height={220}
                    yAxisSuffix="%"
                    chartConfig={{
                        backgroundColor: "#141B2D",
                        backgroundGradientFrom: "#141B2D",
                        backgroundGradientTo: "#141B2D",
                        decimalPlaces: 0,
                        color: (opacity = 1) =>
                            `rgba(124,58,237,${opacity})`,
                        labelColor: (opacity = 1) =>
                            `rgba(255,255,255,${opacity})`,
                    }}
                    bezier
                    style={{
                        borderRadius: 16,
                    }}
                />
            </View>

            <View
                style={{
                    marginHorizontal: 20,
                }}
            >
                {[
                    "Day 1 - Feed Alignment 42%",
                    "Day 3 - Feed Alignment 56%",
                    "Day 5 - Feed Alignment 67%",
                    "Day 7 - Feed Alignment 78%",
                ].map((item, index) => (
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
                            {item}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}