import { View, Text, TouchableOpacity } from "react-native";

export default function OnboardingScreen({ navigation }: any) {
    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#0B0F19",
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
            }}
        >
            <Text
                style={{
                    color: "white",
                    fontSize: 32,
                    fontWeight: "bold",
                    textAlign: "center",
                }}
            >
                Personalize Your Instagram Feed
            </Text>

            <Text
                style={{
                    color: "#94A3B8",
                    textAlign: "center",
                    marginTop: 15,
                }}
            >
                Choose your interests and let FeedFlow optimize your experience.
            </Text>

            <TouchableOpacity
                onPress={() => navigation.navigate("InstagramConnect")}
                style={{
                    backgroundColor: "#7C3AED",
                    paddingHorizontal: 30,
                    paddingVertical: 15,
                    borderRadius: 15,
                    marginTop: 40,
                }}
            >
                <Text style={{ color: "white" }}>
                    Get Started
                </Text>
            </TouchableOpacity>
        </View>
    );
}