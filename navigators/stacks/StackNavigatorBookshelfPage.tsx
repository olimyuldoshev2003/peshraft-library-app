import Bookshelf from "@/screens/application/Bookshelf";
import Duetime from "@/screens/application/Duetime";
import Notifications from "@/screens/application/Notifications";
import ReceivedBook from "@/screens/application/ReceivedBook";
import ReturnBook from "@/screens/application/ReturnBook";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

const StackNavigatorBookshelfPage = () => {
  const Stack = createNativeStackNavigator();

  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Bookshelf"
        component={Bookshelf}
        options={{
          animation: "ios_from_right",
        }}
      />
      <Stack.Screen
        name="ReceivedBook"
        component={ReceivedBook}
        options={{
          animation: "ios_from_right",
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{
          animation: "ios_from_right",
        }}
      />
      <Stack.Screen
        name="ReturnBook"
        component={ReturnBook}
        options={{
          animation: "ios_from_right",
        }}
      />
      <Stack.Screen
        name={"Duetime"}
        component={Duetime}
        options={{
          title: t("notifications.t2"),
          headerShown: true,
          animation: "ios_from_right",
        }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigatorBookshelfPage;

const styles = StyleSheet.create({});