import Book from "@/screens/application/Book";
import FavoriteBooks from "@/screens/application/FavoriteBooks";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet } from "react-native";

const StackNavigatorFavoritePage = () => {
  const Stack = createNativeStackNavigator();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="FavoriteBooks" component={FavoriteBooks} options={{
          animation: "ios_from_right",
        }}/>
      <Stack.Screen name="Book" component={Book} options={{
          animation: "ios_from_right",
        }}/>
    </Stack.Navigator>
  );
};

export default StackNavigatorFavoritePage;

const styles = StyleSheet.create({});
