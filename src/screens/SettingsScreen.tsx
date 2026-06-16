import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { getUsername, removeUsername, clearOnboarding } from "../services/storage";
import { getAnalytics } from "../services/api";
import { usePreferences } from "../store/usePreferences";
import { T } from "../services/theme";
import { Card, SectionLabel, Btn, Badge, Header } from "../components/ui";

export default function SettingsScreen({ navigation }: any) {
    const [username, setUsername] = useState("");
    const interests = usePreferences((s) => s.interests);

    useEffect(() => {
        const load = async () => {
            const user = await getUsername();
            if (user) setUsername(user);
        };
        load();
    }, []);

    const handleDisconnect = () => {
        Alert.alert("Disconnect Instagram", "Are you sure?", [
            { text: "Cancel" },
            {
                text: "Disconnect",
                style: "destructive",
                onPress: async () => {
                    await clearOnboarding();
                    await removeUsername();
                    setUsername("");
                },
            },
        ]);
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Logout from FeedFlow?", [
            { text: "Cancel" },
            {
                text: "Logout",
                onPress: async () => {
                    await clearOnboarding();
                    await removeUsername();
                    navigation.replace("InstagramConnect");
                },
            },
        ]);
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: T.bg }}>
            <Header title="Settings" subtitle="Manage your account" />

            <View style={{ paddingHorizontal: 16 }}>

                {/* Profile */}
                <Card>
                    <Text style={{ color: T.muted, fontSize: 12 }}>Signed in as</Text>
                    <Text style={{ color: T.text, fontSize: 18, fontWeight: "600", marginTop: 2 }}>
                        @{username}
                    </Text>
                    <Badge label="● Connected" variant="success" />
                </Card>

                {/* Instagram */}
                <SectionLabel>Instagram</SectionLabel>
                <Btn
                    label="Reconnect Instagram"
                    onPress={() => navigation.navigate("InstagramConnect")}
                />
                <Btn label="Disconnect" variant="danger" onPress={handleDisconnect} />

                {/* Preferences */}
                <SectionLabel>Content Preferences</SectionLabel>
                <Text style={{ color: T.purple.text, fontSize: 13, marginBottom: 8 }}>
                    {interests.join(", ") || "None selected"}
                </Text>
                <Btn label="Edit Interests" onPress={() => navigation.navigate("Interests")} />

                {/* Automation */}
                <SectionLabel>Automation</SectionLabel>
                <Btn
                    label="Open Automation Center"
                    variant="success"
                    onPress={() => navigation.navigate("Automation")}
                />

                {/* Activity */}
                <SectionLabel>Activity</SectionLabel>
                <Btn
                    label="View Full History"
                    onPress={() => navigation.navigate("History")}
                />

                {/* Account */}
                <SectionLabel>Account</SectionLabel>
                <Btn label="Export My Data" />
                <Btn label="Delete Account" variant="danger" />
                <Btn label="Logout" variant="warning" onPress={handleLogout} />

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
}