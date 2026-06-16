import React, {
    useEffect,
    useState,
} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import InterestScreen from "../screens/InterestScreen";
import DashboardScreen from "../screens/DashboardScreen";
import BottomTabs from "./BottomTabs";
import InstagramConnectScreen from "../screens/InstagramConnectScreen";
import CreatorReviewScreen from "../screens/CreatorReviewScreen";
import HistoryScreen from "../screens/HistoryScreen";
import {
    getOnboardingCompleted,
    getUsername,
} from "../services/storage";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {

    const [
        initialRoute,
        setInitialRoute,
    ] = useState<string | null>(null);

    useEffect(() => {

        const initialize =
            async () => {

                const completed =
                    await getOnboardingCompleted();

                const username =
                    await getUsername();

                if (
                    completed &&
                    username
                ) {

                    setInitialRoute(
                        "Dashboard"
                    );

                } else {

                    setInitialRoute(
                        "InstagramConnect"
                    );

                }

            };

        initialize();

    }, []);

    if (!initialRoute) {
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={
                    initialRoute
                }
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen
                    name="Splash"
                    component={SplashScreen}
                />

                <Stack.Screen
                    name="Onboarding"
                    component={OnboardingScreen}
                />

                <Stack.Screen
                    name="InstagramConnect"
                    component={InstagramConnectScreen}
                />

                <Stack.Screen
                    name="Interests"
                    component={InterestScreen}
                />

                <Stack.Screen
                    name="CreatorReview"
                    component={CreatorReviewScreen}
                />

                <Stack.Screen
                    name="Dashboard"
                    component={BottomTabs}
                />

                <Stack.Screen
                    name="History"
                    component={HistoryScreen}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}