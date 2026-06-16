import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import {
    getAutomationStatus, getAnalytics, generateJobs,
    pauseAutomation, resumeAutomation, stopAutomation,
} from "../services/api";
import { getUsername } from "../services/storage";
import { T } from "../services/theme";
import { Card, SectionLabel, StatCard, Btn, StatusRow, Header } from "../components/ui";

export default function AutomationScreen() {
    const [automation, setAutomation] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoCycleEnabled, setAutoCycleEnabled] = useState(false);
    const [cycleInterval, setCycleInterval] = useState(1);
    const [countdown, setCountdown] = useState("00:00:00");

    const fetchData = async () => {
        try {
            const user = await getUsername();
            if (!user) return;
            const [status, analytics] = await Promise.all([
                getAutomationStatus(user),
                getAnalytics(user),
            ]);
            setAutomation(status);
            setLogs(analytics.logs || []);
        } catch (e) { console.log(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const t = setInterval(fetchData, 10000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (!autoCycleEnabled || automation?.automationStatus !== "completed") return;
        const target = Date.now() + cycleInterval * 60 * 60 * 1000;
        const t = setInterval(() => {
            const diff = target - Date.now();
            if (diff <= 0) { setCountdown("00:00:00"); clearInterval(t); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        }, 1000);
        return () => clearInterval(t);
    }, [autoCycleEnabled, cycleInterval, automation?.automationStatus]);

    const withUsername = async (fn: (u: string) => Promise<any>) => {
        const user = await getUsername();
        if (!user) return;
        await fn(user);
        const status = await getAutomationStatus(user);
        setAutomation(status);
    };

    const alignment = automation
        ? Math.round((automation.completedJobs / Math.max(automation.completedJobs + automation.pendingJobs, 1)) * 100)
        : 0;

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={T.purple.text} />
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: T.bg }}>
            <Header title="Automation" subtitle="Feed personalisation engine" />

            <View style={{ paddingHorizontal: 16 }}>

                {/* Status card */}
                <Card>
                    <SectionLabel>Status</SectionLabel>
                    <StatusRow status={automation?.automationStatus || "stopped"} />
                    <Text style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>
                        {automation?.pendingJobs ?? 0} pending · {alignment}% alignment
                    </Text>
                    {automation?.nextJob && (
                        <Text style={{ color: T.text, fontSize: 12, marginTop: 6 }}>
                            Next: {automation.nextJob.action} @{automation.nextJob.creator_username}
                        </Text>
                    )}

                    {automation?.automationStatus === "running" && (
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Btn label="Pause" variant="warning" onPress={() => withUsername(pauseAutomation)} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Btn label="Stop" variant="danger" onPress={() => withUsername(stopAutomation)} />
                            </View>
                        </View>
                    )}
                    {automation?.automationStatus === "paused" && (
                        <Btn label="Resume" variant="success" onPress={() => withUsername(resumeAutomation)} />
                    )}
                </Card>

                {/* Auto-cycle card */}
                <Card>
                    <SectionLabel>Auto-cycle</SectionLabel>
                    <Btn
                        label={autoCycleEnabled ? "Enabled" : "Disabled"}
                        variant={autoCycleEnabled ? "success" : "default"}
                        onPress={() => setAutoCycleEnabled((p) => !p)}
                    />

                    <Text style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>Generate every</Text>
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                        {[1, 2, 3, 4, 5].map((h) => (
                            <TouchableOpacity
                                key={h}
                                onPress={() => setCycleInterval(h)}
                                style={{
                                    backgroundColor: cycleInterval === h ? T.purple.bg : T.bg,
                                    borderWidth: 0.5,
                                    borderColor: cycleInterval === h ? T.purple.border : T.border,
                                    borderRadius: 6,
                                    paddingVertical: 6,
                                    paddingHorizontal: 12,
                                }}
                            >
                                <Text style={{ color: cycleInterval === h ? T.purple.text : T.muted, fontSize: 12 }}>
                                    {h}h
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {autoCycleEnabled && (
                        <View style={{
                            backgroundColor: T.bg,
                            borderRadius: 8,
                            padding: 12,
                            marginTop: 10,
                            alignItems: "center",
                            borderWidth: 0.5,
                            borderColor: T.border,
                        }}>
                            <Text style={{ color: T.muted, fontSize: 11 }}>Next cycle in</Text>
                            <Text style={{ color: T.green.text, fontSize: 24, fontWeight: "600", marginTop: 2 }}>
                                {countdown}
                            </Text>
                            <Text style={{ color: T.muted, fontSize: 11, marginTop: 3 }}>
                                Every {cycleInterval}h
                            </Text>
                        </View>
                    )}
                </Card>

                {/* Stats */}
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                    <StatCard label="Tasks Today" value={logs.length} />
                    <StatCard label="Alignment" value={`${alignment}%`} valueColor={T.purple.text} />
                </View>

                {/* Recent activity */}
                <SectionLabel>Recent Activity</SectionLabel>
                {logs.length === 0 ? (
                    <Text style={{ color: T.muted, fontSize: 13, marginBottom: 12 }}>No activity yet</Text>
                ) : (
                    [...logs]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 5)
                        .map((log, i) => (
                            <Card key={i} style={{ marginBottom: 7 }}>
                                <Text style={{ color: T.text, fontSize: 13 }}>
                                    {log.action} @{log.creator_username}
                                </Text>
                                <Text style={{ color: T.muted, fontSize: 11, marginTop: 3 }}>
                                    {new Date(log.created_at).toLocaleString("en-GB", {
                                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                                    })}
                                </Text>
                            </Card>
                        ))
                )}

                {/* Generate new cycle */}
                {["completed", "stopped"].includes(automation?.automationStatus?.toLowerCase()) && (
                    <Btn
                        label="Generate New Cycle"
                        variant="success"
                        onPress={async () => {
                            const user = await getUsername();
                            if (!user) return;
                            const result = await generateJobs(user);
                            if (result.success) {
                                const [status, analytics] = await Promise.all([
                                    getAutomationStatus(user),
                                    getAnalytics(user),
                                ]);
                                setAutomation(status);
                                setLogs(analytics.logs || []);
                            }
                        }}
                    />
                )}

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
}