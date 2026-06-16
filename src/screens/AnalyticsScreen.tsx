import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { getAnalytics } from "../services/api";
import { getUsername } from "../services/storage";
import { T } from "../services/theme";
import { Card, SectionLabel, Header } from "../components/ui";

const W = Dimensions.get("window").width;

export default function AnalyticsScreen() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const user = await getUsername();
                if (!user) return;
                setAnalytics(await getAnalytics(user));
            } catch (e) { console.log(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={T.purple.text} />
            </View>
        );
    }

    const { actionsToday = 0, likes = 0, reels = 0, saves = 0, profiles = 0, follows = 0 } = analytics || {};

    const STATS = [
        { label: "Likes", value: likes },
        { label: "Reels Watched", value: reels },
        { label: "Posts Saved", value: saves },
        { label: "Profiles Viewed", value: profiles },
        { label: "Follows", value: follows },
    ];

    return (
        <ScrollView style={{ flex: 1, backgroundColor: T.bg }}>
            <Header title="Analytics" subtitle="FeedFlow performance" />

            <View style={{ paddingHorizontal: 16 }}>

                {/* Total */}
                <Card>
                    <SectionLabel>Total Actions Today</SectionLabel>
                    <Text style={{ color: T.text, fontSize: 36, fontWeight: "600" }}>
                        {actionsToday}
                    </Text>
                </Card>

                {/* Chart */}
                <Card>
                    <SectionLabel>Activity Breakdown</SectionLabel>
                    <LineChart
                        data={{
                            labels: ["Likes", "Reels", "Saves", "Profiles"],
                            datasets: [{ data: [likes, reels, saves, profiles] }],
                        }}
                        width={W - 64}
                        height={180}
                        chartConfig={{
                            backgroundColor: T.surface,
                            backgroundGradientFrom: T.surface,
                            backgroundGradientTo: T.surface,
                            decimalPlaces: 0,
                            color: (o = 1) => `rgba(165,180,252,${o})`,
                            labelColor: (o = 1) => `rgba(100,116,139,${o})`,
                        }}
                        bezier
                        style={{ borderRadius: 8, marginTop: 4 }}
                    />
                </Card>

                {/* Stat rows */}
                <SectionLabel>Breakdown</SectionLabel>
                {STATS.map((item, i) => (
                    <View
                        key={i}
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingVertical: 12,
                            borderBottomWidth: 0.5,
                            borderBottomColor: T.border,
                        }}
                    >
                        <Text style={{ color: T.muted, fontSize: 13 }}>{item.label}</Text>
                        <Text style={{ color: T.text, fontSize: 16, fontWeight: "600" }}>{item.value}</Text>
                    </View>
                ))}

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
}