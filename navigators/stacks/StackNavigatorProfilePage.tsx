import Book from "@/screens/application/Book";
import EditUser from "@/screens/application/EditUser";
import Feedback from "@/screens/application/Feedback";
import HistoryBook from "@/screens/application/HistoryBook";
import Profile from "@/screens/application/Profile";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet } from "react-native";
import { Modalize } from "react-native-modalize";

// Must be defined OUTSIDE component to avoid "t1" warning
const createProfileScreen = (languageModal: React.RefObject<any>) => {
  const Screen = () => <Profile languageModal={languageModal} />;
  Screen.displayName = "ProfileScreen";
  return Screen;
};

const StackNavigatorProfilePage = ({ languageModal }:{ languageModal: React.RefObject<any> }) => {
  const Stack = createNativeStackNavigator();
  const ProfileWithLanguageModal = React.useMemo(() => createProfileScreen(languageModal), []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileWithLanguageModal}
        options={{
          animation: "ios_from_right",
        }}
      />
      <Stack.Screen
        name="HistoryBook"
        component={HistoryBook}
        options={{
          animation: "ios_from_right",
        }}
      />
      <Stack.Screen
        name="Book"
        component={Book}
        options={{
          animation: "ios_from_right",
        }}
      />
      <Stack.Screen
        name="EditUser"
        component={EditUser}
        options={{
          animation: "ios_from_right",
        }}
      />
      <Stack.Screen
        name="Feedback"
        component={Feedback}
        options={{
          animation: "ios_from_right",
        }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigatorProfilePage;

const styles = StyleSheet.create({});