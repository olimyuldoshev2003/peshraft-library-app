import FinalIntroduction from "@/screens/introduction/FinalIntroduction";
import IntroductionAboutApp from "@/screens/introduction/IntroductionAboutApp";
import IntroductionAboutBook from "@/screens/introduction/IntroductionAboutBook";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet } from "react-native";
import TabNavigator from "../tabs/TabNavigator";

const StackNavigatorIntroduction = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="IntroductionAboutApp"
        component={IntroductionAboutApp}
        options={{
          animation: "ios_from_right",
        }}
      />
      <Stack.Screen
        name="IntroductionAboutBook"
        component={IntroductionAboutBook}
        options={{
          animation: "ios_from_right",
        }}
      />
      <Stack.Screen
        name="FinalIntroduction"
        component={FinalIntroduction}
        options={{
          animation: "ios_from_right",
        }}
      />
      <Stack.Screen
        name="Application"
        component={TabNavigator}
        options={{
          animation: "ios_from_right",
        }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigatorIntroduction;

const styles = StyleSheet.create({});
