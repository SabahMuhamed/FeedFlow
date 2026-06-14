import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
} from "react-native";

import { usePreferences } from "../store/usePreferences";
import { savePreferences } from "../services/api";

import {
    getUsername,
} from "../services/storage";

import {
    getPreferences,
} from "../services/api";

const interests = [
    {
        title: "AI",
        icon: "🤖",
        description: "Machine Learning & LLMs",
    },
    {
        title: "Technology",
        icon: "💻",
        description: "Software & Innovation",
    },
    {
        title: "Cybersecurity",
        icon: "🛡️",
        description: "Security & Privacy",
    },
    {
        title: "Startups",
        icon: "🚀",
        description: "Entrepreneurship",
    },
    {
        title: "Finance",
        icon: "📈",
        description: "Investing & Markets",
    },
    {
        title: "Gaming",
        icon: "🎮",
        description: "Esports & Gaming",
    },
];

export default function InterestScreen({
    navigation,
    route,
}: any) {
    const [selected, setSelected] =
        useState<string[]>([]);

    const [instagramUsername, setInstagramUsername] = useState("");
    useEffect(() => {

        const loadPreferences =
            async () => {

                try {

                    const username =
                        await getUsername();

                    if (!username)
                        return;

                    setInstagramUsername(
                        username
                    );

                    const result =
                        await getPreferences(
                            username
                        );

                    if (
                        result.success
                    ) {

                        const saved =
                            result.data.map(
                                (
                                    item: any
                                ) =>
                                    item.interest
                            );
                        console.log("LOADING PREFERENCES");
                        console.log(result.data);

                        setSelected(
                            saved
                        );
                    }

                } catch (
                err
                ) {

                    console.log(
                        err
                    );

                }
            };

        loadPreferences();

    }, []);



    const setInterests =
        usePreferences(
            (state) =>
                state.setInterests
        );

    const toggleInterest = (
        interestTitle: string
    ) => {
        if (
            selected.includes(
                interestTitle
            )
        ) {
            setSelected(
                selected.filter(
                    (item) =>
                        item !==
                        interestTitle
                )
            );
        } else {
            setSelected([
                ...selected,
                interestTitle,
            ]);
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
                }}
            >
                <Text
                    style={{
                        color: "white",
                        fontSize: 30,
                        fontWeight:
                            "bold",
                        marginTop: 50,
                    }}
                >
                    Choose Your Interests
                </Text>

                <Text
                    style={{
                        color:
                            "#94A3B8",
                        marginTop: 10,
                        marginBottom: 30,
                    }}
                >
                    Select topics you
                    want to see more
                    of.
                </Text>

                <View
                    style={{
                        flexDirection:
                            "row",
                        flexWrap:
                            "wrap",
                        justifyContent:
                            "space-between",
                    }}
                >
                    {interests.map(
                        (
                            interest
                        ) => {
                            const isSelected =
                                selected.includes(
                                    interest.title
                                );

                            return (
                                <TouchableOpacity
                                    key={
                                        interest.title
                                    }
                                    onPress={() =>
                                        toggleInterest(
                                            interest.title
                                        )
                                    }
                                    style={{
                                        width:
                                            "48%",
                                        backgroundColor:
                                            "#141B2D",
                                        borderRadius: 20,
                                        padding: 16,
                                        marginBottom: 15,
                                        borderWidth:
                                            isSelected
                                                ? 2
                                                : 0,
                                        borderColor:
                                            "#7C3AED",
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 32,
                                        }}
                                    >
                                        {
                                            interest.icon
                                        }
                                    </Text>

                                    <Text
                                        style={{
                                            color:
                                                "white",
                                            fontSize: 18,
                                            fontWeight:
                                                "bold",
                                            marginTop: 10,
                                        }}
                                    >
                                        {
                                            interest.title
                                        }
                                    </Text>

                                    <Text
                                        style={{
                                            color:
                                                "#94A3B8",
                                            fontSize: 12,
                                            marginTop: 5,
                                        }}
                                    >
                                        {
                                            interest.description
                                        }
                                    </Text>

                                    {isSelected && (
                                        <Text
                                            style={{
                                                color:
                                                    "#7C3AED",
                                                marginTop: 10,
                                                fontWeight:
                                                    "bold",
                                            }}
                                        >
                                            ✓
                                            Selected
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            );
                        }
                    )}
                </View>

                <TouchableOpacity
                    onPress={async () => {
                        try {
                            console.log(
                                "USERNAME:"
                            );
                            console.log(
                                instagramUsername
                            );

                            const result =
                                await savePreferences(
                                    instagramUsername,
                                    selected
                                );

                            console.log(
                                result
                            );

                            setInterests(
                                selected
                            );

                            navigation.navigate(
                                "CreatorReview",
                                {
                                    interests: selected,
                                }
                            );
                        } catch (
                        err
                        ) {
                            console.log(
                                err
                            );
                        }
                    }}
                    style={{
                        backgroundColor:
                            "#7C3AED",
                        padding: 18,
                        borderRadius: 18,
                        alignItems:
                            "center",
                        marginTop: 20,
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
                        Continue
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}