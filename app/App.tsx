import { AuthProvider } from "@/context/AuthContext";
import StackNavigator from "@/navigators/stacks/StackNavigator";
import {
  NavigationContainer,
  NavigationIndependentTree,
} from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import "../i18n";
import { Provider } from "react-redux";
import { store } from "@/store/store";

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
        <Provider store={store}>
          <AuthProvider>
            <NavigationContainer>
              <StackNavigator />
            </NavigationContainer>
          </AuthProvider>
        </Provider>
      </NavigationIndependentTree>
    </React.Suspense>
  );
};

export default App;

const styles = StyleSheet.create({});
