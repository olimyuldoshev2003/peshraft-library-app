import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem("access_token", token);
  } catch (error) {
    console.error("Error saving token:", error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("access_token");
    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("access_token");
  } catch (error) {
    console.error("Error removing token:", error);
  }
};

// Save signup completion status
export const setIsSignedUpUser = async (value: boolean) => {
  try {
    await AsyncStorage.setItem("isSignedUpUser", JSON.stringify(value));
  } catch (error) {
    console.error("Error saving isSignedUpUser:", error);
  }
};

// Get signup completion status
export const getIsSignedUpUser = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem("isSignedUpUser");
    return value ? JSON.parse(value) : false;
  } catch (error) {
    console.error("Error getting isSignedUpUser:", error);
    return false;
  }
};

// Optional: clear everything on logout
export const clearStorage = async () => {
  try {
    await AsyncStorage.removeItem("isSignedUpUser");
  } catch (error) {
    console.error("Error clearing storage:", error);
  }
};
