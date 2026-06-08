import { AuthProvider } from "@/context/AuthContext";
import StackNavigator from "@/navigators/stacks/StackNavigator";
import {
  NavigationContainer,
  NavigationIndependentTree,
} from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import "../i18n";

const App = () => {
  return (
    <React.Suspense
      fallback={
        <View>
          <Text>...Loading</Text>
        </View>
      }
    >

    <NavigationIndependentTree>
      <AuthProvider>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </AuthProvider>
    </NavigationIndependentTree>
    </React.Suspense>
  );
};

export default App;

const styles = StyleSheet.create({});
