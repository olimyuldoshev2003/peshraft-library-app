import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  useNavigation,
  usePathname,
  useRouter,
  useFocusEffect,
} from "expo-router";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { StyleSheet, ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Octicons from "@expo/vector-icons/Octicons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import StackNavigatorBookshelfPage from "../stacks/StackNavigatorBookshelfPage";
import StackNavigatorFavoritePage from "../stacks/StackNavigatorFavoritePage";
import StackNavigatorHomePage from "../stacks/StackNavigatorHomePage";
import StackNavigatorProfilePage from "../stacks/StackNavigatorProfilePage";
import { Modalize } from "react-native-modalize";
import LanguageModal from "@/components/profile/LanguageModal";
import { useTranslation } from "react-i18next";

// Enhanced loading wrapper with focus-based loading
const withLoadingScreen = (
  Component: React.ComponentType<any>,
  props?: any,
) => {
  return (screenProps: any) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Reload when screen comes into focus
    useFocusEffect(
      useCallback(() => {
        setIsRefreshing(true);
        // Simulate data fetching
        const loadData = async () => {
          try {
            // You can add actual data fetching here
            await new Promise((resolve) => setTimeout(resolve, 300));
          } finally {
            setIsLoading(false);
            setIsRefreshing(false);
          }
        };

        loadData();

        return () => {
          // Cleanup if needed
        };
      }, []),
    );

    if (isLoading || isRefreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7EC7EC" />
        </View>
      );
    }

    return <Component {...screenProps} {...props} />;
  };
};

// Custom hook to track tab changes
const useTabChangeListener = (tabName: string) => {
  const [isTabLoading, setIsTabLoading] = useState(true);

  useEffect(() => {
    setIsTabLoading(true);
    const timer = setTimeout(() => {
      setIsTabLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [tabName]);

  return isTabLoading;
};

const TabNavigator = () => {
  const Tab = createBottomTabNavigator();

  const navigation = useNavigation();
  const pathName = usePathname();
  const router = useRouter();

  const { t } = useTranslation();

  const languageModal = useRef<Modalize>(null);

  const StackNavigatorProfilePageWithFunctionLanguageModal = () => (
    <StackNavigatorProfilePage languageModal={languageModal} />
  );

  const [currentTab, setCurrentTab] = useState("HomeStack");

  const getTabBarStyle = (route: any) => {
    const routeName = getFocusedRouteNameFromRoute(route);

    const hideTabBarScreens = [
      "Book",
      "Notifications",
      "ReceivedBook",
      "HistoryBook",
      "EditUser",
      "Feedback",
    ];

    if (routeName && hideTabBarScreens.includes(routeName)) {
      return {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 8,
        display: "none" as const,
      };
    }

    return {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 4,
      elevation: 8,
      display: "flex" as const,
    };
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#7EC7EC",
          tabBarInactiveTintColor: "#939393",
          tabBarIconStyle: {},
          tabBarLabelStyle: {
            fontSize: 18,
          },
          tabBarStyle: {
            backgroundColor: "#fff",
          },
        }}
        screenListeners={{
          tabPress: (e) => {
            // You can add haptic feedback or analytics here
          },
        }}
      >
        <Tab.Screen
          name="HomeStack"
          component={withLoadingScreen(StackNavigatorHomePage)}
          options={({ route }) => ({
            title: t("navigators.t1"),
            tabBarStyle: getTabBarStyle(route),
            tabBarIcon: ({ size, color, focused }) => {
              return <Octicons name="home" size={size} color={color} />;
            },
          })}
        />
        <Tab.Screen
          name="BookshelfStack"
          component={withLoadingScreen(StackNavigatorBookshelfPage)}
          options={({ route }) => ({
            title: t("navigators.t2"),
            tabBarStyle: getTabBarStyle(route),
            tabBarIcon: ({ size, color, focused }) => {
              return <Feather name="book-open" size={size} color={color} />;
            },
          })}
        />
        <Tab.Screen
          name="FavoriteBooksStack"
          component={withLoadingScreen(StackNavigatorFavoritePage)}
          options={({ route }) => ({
            title: t("navigators.t3"),
            tabBarStyle: getTabBarStyle(route),
            tabBarIcon: ({ size, color, focused }) => {
              return <Feather name="heart" size={size} color={color} />;
            },
          })}
        />
        <Tab.Screen
          name="ProfileStack"
          component={withLoadingScreen(
            StackNavigatorProfilePageWithFunctionLanguageModal,
          )}
          options={({ route }) => ({
            title: t("navigators.t4"),
            tabBarStyle: getTabBarStyle(route),
            tabBarIcon: ({ size, color, focused }) => {
              return (
                <FontAwesome6 name="user-circle" size={size} color={color} />
              );
            },
          })}
        />
      </Tab.Navigator>

      {/* language Modal */}
      <LanguageModal languageModal={languageModal} />
    </GestureHandlerRootView>
  );
};

export default TabNavigator;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
