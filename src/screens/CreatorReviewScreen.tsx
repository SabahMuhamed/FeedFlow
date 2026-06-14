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
} from "react-native";

import {
    getCreators,
    saveCreators,
    generateJobs,
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