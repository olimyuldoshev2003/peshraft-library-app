import React from "react";
import { StyleSheet } from "react-native";

import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import {
  NavigationContainer,
  NavigationIndependentTree,
} from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Duetime from "./Duetime";
import News from "./News";

const Notifications = () => {
  const Tab = createMaterialTopTabNavigator();

  const { t } = useTranslation();

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: "#00A9FF",
            tabBarInactiveTintColor: "#515151",
            tabBarIndicatorStyle: {
              backgroundColor: "#00A9FF",
              height: 3,
            },
            tabBarLabelStyle: {
              fontSize: 16,
              fontWeight: "600",
            },
          }}
        >
          <Tab.Screen
            name="Duetime"
            options={{
              title: t("notifications.t2"),
            }}
            component={Duetime}
          />
          <Tab.Screen
            name="News"
            options={{
              title: t("notifications.t3"),
            }}
            component={News}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};

export default Notifications;

const styles = StyleSheet.create({});
