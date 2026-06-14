import { useEffect } from "react";
import { View, Text } from "react-native";

export default function SplashScreen({ navigation }: any) {
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace("Onboarding");
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#0B0F19",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Text
                style={{
                    color: "white",
                    fontSize: 40,
                    fontWeight: "bold",
                }}
            >
                FeedFlow
            </Text>
        </View>
    );
}