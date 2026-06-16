import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { getCreators, saveCreators, generateJobs, verifyCreator } from "../services/api";
import { getUsername, setOnboardingCompleted } from "../services/storage";
import { T } from "../services/theme";
import { Card, SectionLabel, Btn, Badge, Input, Header } from "../components/ui";

const INTEREST_OPTIONS = ["Technology", "Cybersecurity", "AI", "Startups", "Gaming", "Finance", "Fitness"];

export default function CreatorReviewScreen({ route, navigation }: any) {
    const interests = route.params.interests;

    const [creators, setCreators] = useState<any[]>([]);
    const [selectedCreators, setSelectedCreators] = useState<any[]>([]);
    const [creatorPreview, setCreatorPreview] = useState<any>(null);
    const [verifying, setVerifying] = useState(false);
    const [newCreator, setNewCreator] = useState("");
    const [newInterest, setNewInterest] = useState("Technology");

    useEffect(() => {
        const load = async () => {
            try {
                let all: any[] = [];
                for (const interest of interests) {
                    const r = await getCreators(interest);
                    if (r.success) all.push(...r.data);
                }
                setCreators(all);
                setSelectedCreators(all);
            } catch (e) { console.log(e); }
        };
        load();
    }, []);

    const verifyAndPreview = async () => {
        if (!newCreator.trim()) { Alert.alert("Enter a username"); return; }
        try {
            setVerifying(true);
            const result = await verifyCreator(newCreator.trim());
            if (!result.success || !result.exists) {
                Alert.alert("Creator Not Found");
                setCreatorPreview(null);
                return;
            }
            setCreatorPreview({ username: newCreator.trim() });
        } catch { Alert.alert("Verification Failed"); }
        finally { setVerifying(false); }
    };

    const addCreator = () => {
        if (!creatorPreview) {
            Alert.alert("Verify first", "Please verify the creator before adding.");
            return;
        }
        const exists = selectedCreators.some(
            (i) => i.creator_username.toLowerCase() === creatorPreview.username.toLowerCase()
        );
        if (exists) { Alert.alert("Already added"); return; }

        const creator = {
            creator_username: creatorPreview.username.trim(),
            interest: newInterest.trim(),
        };
        setCreators((p) => [...p, creator]);
        setSelectedCreators((p) => [...p, creator]);
        setCreatorPreview(null);
        setNewCreator("");
        setNewInterest("Technology");
    };

    const toggleCreator = (creator: any) => {
        const exists = selectedCreators.find((i) => i.creator_username === creator.creator_username);
        if (exists) {
            setSelectedCreators((p) => p.filter((i) => i.creator_username !== creator.creator_username));
        } else {
            setSelectedCreators((p) => [...p, creator]);
        }
    };

    const handleSave = async () => {
        try {
            const username = await getUsername();
            if (!username) { Alert.alert("Username not found"); return; }
            await saveCreators(username, selectedCreators);
            await generateJobs(username);
            await setOnboardingCompleted();
            navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
        } catch {
            Alert.alert("Error", "Failed to save creators");
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: T.bg }}>
            <Header
                title="Creator Review"
                subtitle="Tap a creator to toggle selection"
            />

            <View style={{ paddingHorizontal: 16 }}>

                {/* Add creator card */}
                <Card>
                    <SectionLabel>Add Creator</SectionLabel>
                    <Input
                        value={newCreator}
                        onChangeText={setNewCreator}
                        placeholder="creator_username"
                        autoCapitalize="none"
                    />
                    <Btn
                        label={verifying ? "Verifying..." : "Verify Creator"}
                        variant="primary"
                        onPress={verifyAndPreview}
                        disabled={verifying}
                    />

                    {creatorPreview && (
                        <View style={{
                            backgroundColor: T.bg,
                            borderRadius: 8,
                            padding: 10,
                            alignItems: "center",
                            marginBottom: 10,
                            borderWidth: 0.5,
                            borderColor: T.green.border,
                        }}>
                            <Text style={{ color: T.green.text, fontSize: 12 }}>✓ Verified</Text>
                            <Text style={{ color: T.text, fontSize: 13, marginTop: 2 }}>
                                @{creatorPreview.username}
                            </Text>
                        </View>
                    )}

                    <SectionLabel>Category</SectionLabel>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                        {INTEREST_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                onPress={() => setNewInterest(opt)}
                                style={{
                                    backgroundColor: newInterest === opt ? T.purple.bg : T.bg,
                                    borderWidth: 0.5,
                                    borderColor: newInterest === opt ? T.purple.border : T.border,
                                    borderRadius: 6,
                                    paddingVertical: 5,
                                    paddingHorizontal: 10,
                                }}
                            >
                                <Text style={{
                                    color: newInterest === opt ? T.purple.text : T.muted,
                                    fontSize: 12,
                                }}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Btn label="Add Creator" variant="success" onPress={addCreator} />
                </Card>

                {/* Creator list */}
                <SectionLabel>Creators ({creators.length})</SectionLabel>
                {creators.map((creator, i) => {
                    const isSelected = !!selectedCreators.find(
                        (item) => item.creator_username === creator.creator_username
                    );
                    return (
                        <TouchableOpacity
                            key={i}
                            onPress={() => toggleCreator(creator)}
                            style={{
                                backgroundColor: T.surface,
                                borderRadius: 12,
                                padding: 12,
                                marginBottom: 7,
                                borderWidth: 0.5,
                                borderColor: isSelected ? T.purple.border : T.border,
                            }}
                        >
                            <Text style={{ color: T.text, fontSize: 14, fontWeight: "500" }}>
                                @{creator.creator_username}
                            </Text>
                            <Text style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>
                                {creator.interest}
                            </Text>
                            {isSelected
                                ? <Badge label="✓ selected" variant="primary" />
                                : <Text style={{ color: T.hint, fontSize: 11, marginTop: 5 }}>Tap to add</Text>
                            }
                        </TouchableOpacity>
                    );
                })}

                <View style={{ marginTop: 8 }}>
                    <Btn label="Start Automation" variant="success" onPress={handleSave} />
                </View>
                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
}