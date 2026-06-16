import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { usePreferences } from "../store/usePreferences";
import { savePreferences, getPreferences } from "../services/api";
import { getUsername } from "../services/storage";
import { T } from "../services/theme";
import { Btn, Badge, Header } from "../components/ui";

const INTERESTS = [
    { title: "AI", icon: "🤖", description: "Machine Learning & LLMs" },
    { title: "Technology", icon: "💻", description: "Software & Innovation" },
    { title: "Cybersecurity", icon: "🛡️", description: "Security & Privacy" },
    { title: "Startups", icon: "🚀", description: "Entrepreneurship" },
    { title: "Finance", icon: "📈", description: "Investing & Markets" },
    { title: "Gaming", icon: "🎮", description: "Esports & Gaming" },
];

export default function InterestScreen({ navigation, route }: any) {
    const [selected, setSelected] = useState<string[]>([]);
    const [instagramUsername, setInstagramUsername] = useState("");
    const setInterests = usePreferences((s) => s.setInterests);

    useEffect(() => {
        const load = async () => {
            try {
                const user = await getUsername();
                if (!user) return;
                setInstagramUsername(user);
                const result = await getPreferences(user);
                if (result.success) {
                    setSelected(result.data.map((item: any) => item.interest));
                }
            } catch (e) { console.log(e); }
        };
        load();
    }, []);

    const toggle = (title: string) =>
        setSelected((prev) =>
            prev.includes(title) ? prev.filter((i) => i !== title) : [...prev, title]
        );

    const handleContinue = async () => {
        try {
            await savePreferences(instagramUsername, selected);
            setInterests(selected);
            navigation.navigate("CreatorReview", { interests: selected });
        } catch (e) { console.log(e); }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: T.bg }}>
            <Header title="Your Interests" subtitle="Select topics to personalise your feed" />

            <View style={{ paddingHorizontal: 16 }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                    {INTERESTS.map((interest) => {
                        const isSelected = selected.includes(interest.title);
                        return (
                            <TouchableOpacity
                                key={interest.title}
                                onPress={() => toggle(interest.title)}
                                style={{
                                    width: "47%",
                                    backgroundColor: T.surface,
                                    borderRadius: 12,
                                    padding: 14,
                                    borderWidth: 0.5,
                                    borderColor: isSelected ? T.purple.border : T.border,
                                }}
                            >
                                <Text style={{ fontSize: 24, marginBottom: 6 }}>{interest.icon}</Text>
                                <Text style={{ color: T.text, fontSize: 14, fontWeight: "500" }}>
                                    {interest.title}
                                </Text>
                                <Text style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>
                                    {interest.description}
                                </Text>
                                {isSelected && <Badge label="✓ selected" variant="primary" />}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Btn label="Continue" variant="primary" onPress={handleContinue} />
                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
}