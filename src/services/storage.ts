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