import React, {
    useEffect,
    useState,
} from "react";

import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
} from "react-native";

import {
    getCreators,
    saveCreators,
    generateJobs,
    verifyCreator,
} from "../services/api";

import {
    getUsername,
} from "../services/storage";

export default function CreatorReviewScreen({
    route,
    navigation,
}: any) {
    const interests =
        route.params.interests;

    const [
        creators,
        setCreators,
    ] = useState<any[]>([]);

    const [
        selectedCreators,
        setSelectedCreators,
    ] = useState<any[]>([]);

    const [
        creatorPreview,
        setCreatorPreview,
    ] = useState<any>(null);

    const [
        verifying,
        setVerifying,
    ] = useState(false);

    const [newCreator, setNewCreator] =
        useState("");

    const [newInterest, setNewInterest] =
        useState("Technology");

    const interestOptions = [
        "Technology ",
        "Cybersecurity ",
        "AI ",
        "Startups ",
        "Gaming ",
        "Finance ",
        "Fitness ",
    ];

    const verifyAndPreview =
        async () => {

            if (!newCreator.trim()) {

                Alert.alert(
                    "Enter Creator Username"
                );

                return;
            }

            try {

                setVerifying(true);

                const result =
                    await verifyCreator(
                        newCreator.trim()
                    );

                if (
                    !result.success ||
                    !result.exists
                ) {

                    Alert.alert(
                        "Creator Not Found"
                    );

                    setCreatorPreview(
                        null
                    );

                    return;
                }

                setCreatorPreview({
                    username:
                        newCreator.trim(),
                });

                Alert.alert(
                    "Creator Verified"
                );

            } catch (err) {

                Alert.alert(
                    "Verification Failed"
                );

            } finally {

                setVerifying(false);

            }
        };

    const addCreator = () => {

        if (!creatorPreview) {

            Alert.alert(
                "Verification Required",
                "Please verify creator first."
            );

            return;
        }

        const exists =
            selectedCreators.some(
                (item) =>
                    item.creator_username.toLowerCase() ===
                    creatorPreview.username.toLowerCase()
            );

        if (exists) {

            Alert.alert(
                "Already Added"
            );

            return;
        }

        const creator = {
            creator_username:
                creatorPreview.username,
            interest:
                newInterest,
        };

        setCreators([
            ...creators,
            creator,
        ]);

        setSelectedCreators([
            ...selectedCreators,
            creator,
        ]);

        setCreatorPreview(
            null
        );

        setNewCreator("");

        Alert.alert(
            "Success",
            "Creator added"
        );
    };

    useEffect(() => {
        const loadCreators =
            async () => {
                try {
                    let allCreators: any[] =
                        [];

                    for (const interest of interests) {
                        const result =
                            await getCreators(
                                interest
                            );

                        if (
                            result.success
                        ) {
                            allCreators.push(
                                ...result.data
                            );
                        }
                    }

                    setCreators(
                        allCreators
                    );

                    setSelectedCreators(
                        allCreators
                    );
                } catch (err) {
                    console.log(err);
                }
            };

        loadCreators();
    }, []);

    const toggleCreator = (
        creator: any
    ) => {
        const exists =
            selectedCreators.find(
                (item) =>
                    item.creator_username ===
                    creator.creator_username
            );

        if (exists) {
            setSelectedCreators(
                selectedCreators.filter(
                    (item) =>
                        item.creator_username !==
                        creator.creator_username
                )
            );
        } else {
            setSelectedCreators([
                ...selectedCreators,
                creator,
            ]);
        }
    };

    const handleSaveCreators =
        async () => {
            try {
                const username =
                    await getUsername();

                if (!username) {
                    Alert.alert(
                        "Error",
                        "Username not found"
                    );
                    return;
                }

                const result =
                    await saveCreators(
                        username,
                        selectedCreators
                    );

                console.log(
                    "SAVE CREATORS RESPONSE"
                );
                console.log(result);

                const jobsResult =
                    await generateJobs(
                        username
                    );

                console.log(
                    "JOBS GENERATED"
                );

                console.log(
                    jobsResult
                );

                navigation.navigate(
                    "Dashboard"
                );
            } catch (err) {
                console.log(err);

                Alert.alert(
                    "Error",
                    "Failed to save creators"
                );
            }
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
                    Creator Review
                </Text>

                <Text
                    style={{
                        color:
                            "#94A3B8",
                        marginTop: 10,
                        marginBottom: 20,
                    }}
                >
                    FeedFlow selected creators
                    based on your interests.
                    Tap a creator to remove
                    or add them.
                </Text>

                <View
                    style={{
                        backgroundColor:
                            "#141B2D",
                        padding: 16,
                        borderRadius: 16,
                        marginBottom: 20,
                    }}
                >
                    <Text
                        style={{
                            color: "white",
                            fontSize: 18,
                            fontWeight: "bold",
                            marginBottom: 10,
                        }}
                    >
                        Add Creator
                    </Text>

                    <TextInput
                        value={newCreator}
                        onChangeText={
                            setNewCreator
                        }
                        placeholder="creator_username"
                        placeholderTextColor="#64748B"
                        style={{
                            backgroundColor:
                                "#0B0F19",
                            color: "white",
                            padding: 14,
                            borderRadius: 12,
                        }}
                    />

                    <TouchableOpacity
                        onPress={
                            verifyAndPreview
                        }
                        style={{
                            backgroundColor:
                                "#3B82F6",
                            padding: 14,
                            borderRadius: 12,
                            marginTop: 12,
                            alignItems:
                                "center",
                        }}
                    >
                        <Text
                            style={{
                                color: "white",
                                fontWeight: "bold",
                            }}
                        >
                            {verifying
                                ? "Verifying..."
                                : "Verify Creator"}
                        </Text>
                    </TouchableOpacity>

                    {creatorPreview && (
                        <View
                            style={{
                                backgroundColor:
                                    "#0B0F19",
                                padding: 12,
                                borderRadius: 12,
                                marginTop: 12,
                            }}
                        >
                            <Text
                                style={{
                                    color: "#10B981",
                                    textAlign: "center",
                                }}
                            >
                                ✓ Verified
                            </Text>

                            <Text
                                style={{
                                    color: "white",
                                    textAlign: "center",
                                    marginTop: 5,
                                }}
                            >
                                @{creatorPreview.username}
                            </Text>
                        </View>
                    )}
                    <Text
                        style={{
                            color: "#94A3B8",
                            marginTop: 15,
                            marginBottom: 10,
                        }}
                    >
                        Category
                    </Text>

                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                        }}
                    >
                        {interestOptions.map(
                            (interest) => (
                                <TouchableOpacity
                                    key={interest}
                                    onPress={() =>
                                        setNewInterest(
                                            interest
                                        )
                                    }
                                    style={{
                                        backgroundColor:
                                            newInterest ===
                                                interest
                                                ? "#7C3AED"
                                                : "#0B0F19",
                                        paddingVertical: 8,
                                        paddingHorizontal: 14,
                                        borderRadius: 12,
                                        marginRight: 8,
                                        marginBottom: 8,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color:
                                                "white",
                                        }}
                                    >
                                        {interest}
                                    </Text>
                                </TouchableOpacity>
                            )
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={addCreator}
                        style={{
                            backgroundColor:
                                "#10B981",
                            padding: 14,
                            borderRadius: 12,
                            marginTop: 12,
                            alignItems:
                                "center",
                        }}
                    >
                        <Text
                            style={{
                                color: "white",
                                fontWeight: "bold",
                            }}
                        >
                            Add Creator
                        </Text>
                    </TouchableOpacity>
                </View>

                {creators.map(
                    (
                        creator,
                        index
                    ) => {
                        const isSelected =
                            selectedCreators.find(
                                (
                                    item
                                ) =>
                                    item.creator_username ===
                                    creator.creator_username
                            );

                        return (
                            <TouchableOpacity
                                key={
                                    index
                                }
                                onPress={() =>
                                    toggleCreator(
                                        creator
                                    )
                                }
                                style={{
                                    backgroundColor:
                                        isSelected
                                            ? "#7C3AED"
                                            : "#141B2D",
                                    padding: 16,
                                    borderRadius: 16,
                                    marginTop: 15,
                                }}
                            >
                                <Text
                                    style={{
                                        color:
                                            "white",
                                        fontSize:
                                            18,
                                        fontWeight:
                                            "bold",
                                    }}
                                >
                                    @
                                    {
                                        creator.creator_username
                                    }
                                </Text>

                                <Text
                                    style={{
                                        color:
                                            "#E2E8F0",
                                        marginTop:
                                            5,
                                    }}
                                >
                                    {
                                        creator.interest
                                    }
                                </Text>

                                <Text
                                    style={{
                                        color:
                                            isSelected
                                                ? "#D8B4FE"
                                                : "#94A3B8",
                                        marginTop:
                                            8,
                                    }}
                                >
                                    {isSelected
                                        ? "✓ Selected"
                                        : "Tap to Add"}
                                </Text>
                            </TouchableOpacity>
                        );
                    }
                )}

                <TouchableOpacity
                    onPress={
                        handleSaveCreators
                    }
                    style={{
                        backgroundColor:
                            "#10B981",
                        padding: 18,
                        borderRadius: 18,
                        alignItems:
                            "center",
                        marginTop: 30,
                        marginBottom: 40,
                    }}
                >
                    <Text
                        style={{
                            color:
                                "white",
                            fontWeight:
                                "bold",
                            fontSize: 16,
                        }}
                    >
                        Start Automation
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}