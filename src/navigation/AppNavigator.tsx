import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import InterestScreen from "../screens/InterestScreen";
import DashboardScreen from "../screens/DashboardScreen";
import BottomTabs from "./BottomTabs";
import InstagramConnectScreen from "../screens/InstagramConnectScreen";

const Stack = createNativeStackNavigator();


export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
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
                    name="Dashboard"
                    component={BottomTabs}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}