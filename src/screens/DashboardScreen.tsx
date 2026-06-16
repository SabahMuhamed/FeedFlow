import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAnalytics, getAutomationStatus } from "../services/api";
import { usePreferences } from "../store/usePreferences";
import { getUsername } from "../services/storage";
import { T } from "../services/theme";
import { Card, SectionLabel, StatCard, Btn, Badge, Header } from "../components/ui";

export default function DashboardScreen({ navigation }: any) {
    const [username, setUsername] = useState("");
    const [analytics, setAnalytics] = useState<any>(null);
    const [automation, setAutomation] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const interests = usePreferences((s) => s.interests);

    const loadData = async () => {
        const saved = await getUsername();
        if (!saved) return;
        setUsername(saved);
        const [a, au] = await Promise.all([
            getAnalytics(saved),
            getAutomationStatus(saved),
        ]);
        setAnalytics(a);
        setAutomation(au);
        setLogs(a?.logs || []);
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    useEffect(() => {
        const t = setInterval(loadData, 5000);
        return () => clearInterval(t);
    }, []);

    const alignment = automation
        ? Math.round((automation.completedJobs / Math.max(automation.completedJobs + automation.pendingJobs, 1)) * 100)
        : 0;

    const formatDate = (d: string) =>
        new Date(d).toLocaleString("en-GB", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
        });

    return (
        <ScrollView style={{ flex: 1, backgroundColor: T.bg }}>
            <Header title="FeedFlow" subtitle="Personalising your Instagram" />

            <View style={{ paddingHorizontal: 16 }}>

                {/* Account */}
                <Card>
                    <SectionLabel>Account</SectionLabel>
                    <Text style={{ color: T.text, fontSize: 16, fontWeight: "600" }}>
                        @{username || "feedflow_user"}
                    </Text>
                    <Badge label="● Connected" variant="success" />
                    <Text style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>
                        Last sync {new Date().toLocaleTimeString()}
                    </Text>
                </Card>

                {/* Stats row */}
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                    <StatCard label="Feed Alignment" value={`${alignment}%`} valueColor={T.purple.text} />
                    <StatCard label="Status" value={automation?.automationStatus || "stopped"} />
                </View>

                {/* Actions today */}
                <Card>
                    <SectionLabel>Actions Today</SectionLabel>
                    <Text style={{ color: T.text, fontSize: 32, fontWeight: "600" }}>
                        {analytics?.actionsToday || 0}
                    </Text>
                </Card>

                {/* Interests */}
                <SectionLabel>Interests</SectionLabel>
                <Text style={{ color: T.purple.text, fontSize: 13, marginBottom: 8 }}>
                    {interests.length > 0 ? interests.join(", ") : "No interests selected"}
                </Text>
                <Btn
                    label="Edit Interests"
                    variant="primary"
                    onPress={() => navigation.navigate("Interests")}
                />

                {/* Recent activity */}
                <SectionLabel>Recent Activity</SectionLabel>
                {[...logs]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((log, i) => (
                        <Card key={i} style={{ marginBottom: 7 }}>
                            <Text style={{ color: T.text, fontSize: 13 }}>
                                {log.action} @{log.creator_username}
                            </Text>
                            <Text style={{ color: T.muted, fontSize: 11, marginTop: 3 }}>
                                {formatDate(log.created_at)}
                            </Text>
                        </Card>
                    ))}

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
}