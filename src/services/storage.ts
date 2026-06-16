import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveUsername(
    username: string
) {
    await AsyncStorage.setItem(
        "instagram_username",
        username
    );
}

export async function getUsername() {
    return await AsyncStorage.getItem(
        "instagram_username"
    );
}

export async function removeUsername() {
    await AsyncStorage.removeItem(
        "instagram_username"
    );
}

export async function setOnboardingCompleted() {
    await AsyncStorage.setItem(
        "hasCompletedOnboarding",
        "true"
    );
}

export async function getOnboardingCompleted() {
    return await AsyncStorage.getItem(
        "hasCompletedOnboarding"
    );
}

export async function clearOnboarding() {

    await AsyncStorage.removeItem(
        "hasCompletedOnboarding"
    );

}