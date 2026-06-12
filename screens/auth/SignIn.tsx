import { useAuth } from "@/context/AuthContext";
import Entypo from "@expo/vector-icons/Entypo";
import { mobileSignIn, mobileForgotPassword } from "@/firebase/mobile.services";
import { useNavigation } from "expo-router";
import { Formik } from "formik";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Yup from "yup";

// Define types for form values
interface SignInFormValues {
  email: string;
  password: string;
}

// Validation Schema
const SignInSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required")
    .test(
      "email-format",
      "Email must be properly formatted (e.g., user@example.com)",
      (value) => {
        if (!value) return false;
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        return emailRegex.test(value);
      },
    )
    .max(100, "Email must not exceed 100 characters")
    .trim(),

  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must not exceed 50 characters")
    .test(
      "password-strength",
      "Password must contain at least one number",
      (value) => {
        if (!value) return false;
        const hasNumbers = /\d/.test(value);
        return hasNumbers;
      },
    ),
});

const SignIn = () => {
  const navigation: any = useNavigation();
  const [showAndHidePassword, setShowAndHidePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();

  const initialValues: SignInFormValues = {
    email: "",
    password: "",
  };

  const handleSignIn = async (values: SignInFormValues) => {
    setIsSubmitting(true);
    try {
     await mobileSignIn(values.email.trim(), values.password.trim());
      Alert.alert("Success", "Login successful!");
    } catch (error: any) {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        Alert.alert("Error", "Invalid email or password");
      } else if (error.code === "auth/user-not-found") {
        Alert.alert("Error", "User not found");
      } else if (error.code === "auth/too-many-requests") {
        Alert.alert("Error", "Too many attempts. Please try again later.");
      } else {
        Alert.alert("Error", "An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Reset Password",
      "A password reset link will be sent to your email address.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: () => {
            Alert.alert(
              "Success",
              "Reset link sent to your email! Check your inbox.",
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.signInComponent}>
      <View style={styles.signInComponentBlock}>
        <View style={styles.headerSignInComponent}>
          <Image
            source={require("../../assets/peshraft-library/auth/signInImg.jpg")}
            style={styles.imgHeaderSignInComponent}
          />
        </View>
        <View style={styles.sectionSignInComponent}>
          <Formik
            initialValues={initialValues}
            validationSchema={SignInSchema}
            onSubmit={handleSignIn}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              isValid,
              dirty,
            }) => (
              <View style={styles.formSignIn}>
                <Text style={styles.titleFormSignin}>Login</Text>

                <View style={styles.blockLabelsAndInputs}>
                  {/* Email Input */}
                  <View
                    style={[
                      styles.labelAndInputEmailBlock,
                      styles.labelAndInputBlock,
                    ]}
                  >
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={[
                        styles.input,
                        touched.email && errors.email
                          ? styles.inputError
                          : null,
                        touched.email && !errors.email
                          ? styles.inputSuccess
                          : null,
                      ]}
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      value={values.email}
                      placeholder="Enter your email"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      editable={!isSubmitting}
                      testID="email-input"
                    />
                    {touched.email && errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                    {touched.email && !errors.email && values.email !== "" && (
                      <Text style={styles.successText}>✓ Valid email</Text>
                    )}
                  </View>

                  {/* Password Input */}
                  <View
                    style={[
                      styles.labelAndInputPasswordBlock,
                      styles.labelAndInputBlock,
                    ]}
                  >
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.iconAndInputPasswordBlock}>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputPassword,
                          touched.password && errors.password
                            ? styles.inputError
                            : null,
                          touched.password && !errors.password
                            ? styles.inputSuccess
                            : null,
                        ]}
                        onChangeText={handleChange("password")}
                        onBlur={handleBlur("password")}
                        value={values.password}
                        placeholder="Enter your password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showAndHidePassword}
                        autoComplete="password"
                        autoCapitalize="none"
                        editable={!isSubmitting}
                        testID="password-input"
                      />
                      {showAndHidePassword ? (
                        <Entypo
                          name="eye"
                          size={30}
                          color="black"
                          style={styles.showAndHidePasswordIcon}
                          onPress={() =>
                            !isSubmitting && setShowAndHidePassword(false)
                          }
                        />
                      ) : (
                        <Entypo
                          name="eye-with-line"
                          size={30}
                          color="black"
                          style={styles.showAndHidePasswordIcon}
                          onPress={() =>
                            !isSubmitting && setShowAndHidePassword(true)
                          }
                        />
                      )}
                    </View>
                    {touched.password && errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                    {touched.password &&
                      !errors.password &&
                      values.password !== "" && (
                        <Text style={styles.successText}>✓ Valid password</Text>
                      )}
                  </View>

                  {/* Password Requirements (shown when password field is focused or has errors) */}
                  {(!touched.password || errors.password) &&
                    values.password !== "" && (
                      <View style={styles.passwordRequirements}>
                        <Text style={styles.passwordRequirementsTitle}>
                          Password must contain:
                        </Text>
                        <Text
                          style={[
                            styles.passwordRequirement,
                            values.password.length >= 8 &&
                              styles.requirementMet,
                          ]}
                        >
                          {values.password.length >= 8 ? "✓" : "•"} At least 8
                          characters
                        </Text>
                        <Text
                          style={[
                            styles.passwordRequirement,
                            /\d/.test(values.password) && styles.requirementMet,
                          ]}
                        >
                          {/\d/.test(values.password) ? "✓" : "•"} At least one
                          number
                        </Text>
                      </View>
                    )}
                </View>

                {/* Forgot Password */}
                <View style={styles.forgetPasswordNavBtnBlock}>
                  <Pressable
                    style={styles.forgetPasswordNavBtn}
                    onPress={handleForgotPassword}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.forgetPasswordNavBtnText}>
                      Forgot your password?
                    </Text>
                  </Pressable>
                </View>

                {/* Sign In Button */}
                <View style={styles.btnSignInBlock}>
                  <Pressable
                    style={[
                      styles.btnSignIn,
                      (!isValid || !dirty || isSubmitting) &&
                        styles.btnSignInDisabled,
                    ]}
                    onPress={() => handleSubmit()}
                    disabled={!isValid || !dirty || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.btnTextSignIn}>Sign In</Text>
                    )}
                  </Pressable>
                </View>

                {/* Divider */}
                {/* <View style={styles.anotherWaysToSignUpBlock}>
                  <View style={styles.lineWithTextBlock}>
                    <View style={[styles.line, styles.line1]}></View>
                    <Text style={styles.textInTheMiddleOfLines}>Or</Text>
                    <View style={[styles.line, styles.line2]}></View>
                  </View>
                  <View
                    style={styles.signUpWithSocialMediasAndCorporationsBlock}
                  >
                    <Pressable
                      style={[
                        styles.socialMediasAndCorporations,
                        styles.google,
                      ]}
                      disabled={isSubmitting}
                    >
                      <Image
                        source={require("../../assets/peshraft-library/auth/google.png")}
                        style={[
                          styles.imgsSocialMediasAndCorporations,
                          styles.googleImg,
                        ]}
                      />
                    </Pressable>
                    <Pressable
                      style={[
                        styles.socialMediasAndCorporations,
                        styles.facebook,
                      ]}
                      disabled={isSubmitting}
                    >
                      <Image
                        source={require("../../assets/peshraft-library/auth/facebook.png")}
                        style={[
                          styles.imgsSocialMediasAndCorporations,
                          styles.facebookImg,
                        ]}
                      />
                    </Pressable>
                    <Pressable
                      style={[
                        styles.socialMediasAndCorporations,
                        styles.microsoft,
                      ]}
                      disabled={isSubmitting}
                    >
                      <Image
                        source={require("../../assets/peshraft-library/auth/microsoft.png")}
                        style={[
                          styles.imgsSocialMediasAndCorporations,
                          styles.microsoftImg,
                        ]}
                      />
                    </Pressable>
                  </View>
                </View> */}

                {/* Sign Up Navigation */}
                <View style={styles.btnSignUpNavBtnBlock}>
                  <View style={styles.blockTitleAndBtnNavSignUp}>
                    <Text style={styles.titleAndBtnNavSignUp}>
                      Don't have an account?
                    </Text>
                    <Pressable
                      style={styles.btnNavSignUp}
                      onPress={() => {
                        navigation.navigate("SignUp");
                      }}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.btnTextNavSignUp}> Sign Up</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </Formik>
        </View>
      </View>
    </View>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  signInComponent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  signInComponentBlock: {},
  headerSignInComponent: {
    height: 283,
  },
  imgHeaderSignInComponent: {
    width: "100%",
    height: "100%",
  },
  sectionSignInComponent: {},
  formSignIn: {
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  titleFormSignin: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },
  blockLabelsAndInputs: {
    justifyContent: "space-between",
    gap: 8,
  },
  labelAndInputEmailBlock: {},
  inputPassword: {
    paddingRight: 50,
  },
  labelAndInputPasswordBlock: {},
  iconAndInputPasswordBlock: {
    position: "relative",
  },

  // Error and Success Styles
  inputError: {
    borderBottomColor: "#FF3B30",
  },
  inputSuccess: {
    borderBottomColor: "#34C759",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  successText: {
    color: "#34C759",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },

  // Password Requirements
  passwordRequirements: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  passwordRequirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#495057",
  },
  passwordRequirement: {
    fontSize: 12,
    color: "#6C757D",
    marginLeft: 8,
    marginBottom: 4,
  },
  requirementMet: {
    color: "#34C759",
    fontWeight: "600",
  },

  forgetPasswordNavBtnBlock: {
    marginTop: 15,
  },
  forgetPasswordNavBtn: {},
  forgetPasswordNavBtnText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#007AFF",
  },

  btnSignInBlock: {
    marginTop: 10,
  },
  btnSignIn: {
    backgroundColor: "#00A9FF",
    borderRadius: 30,
    paddingVertical: 12,
    marginTop: 5,
  },
  btnSignInDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  btnTextSignIn: {
    textAlign: "center",
    color: "#fff",
    fontSize: 19,
    fontWeight: "600",
  },
  attemptsText: {
    textAlign: "center",
    fontSize: 12,
    color: "#FF9500",
    marginTop: 6,
    fontWeight: "500",
  },

  anotherWaysToSignUpBlock: {},
  lineWithTextBlock: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    height: 2,
    backgroundColor: "#D5D5D5",
    width: `42%`,
  },
  line1: {},
  textInTheMiddleOfLines: {
    fontSize: 28,
    fontWeight: "700",
    paddingHorizontal: 10,
    color: "#747272",
  },
  line2: {},

  signUpWithSocialMediasAndCorporationsBlock: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
  google: {},
  googleImg: {},
  facebook: {},
  facebookImg: {},
  microsoft: {},
  microsoftImg: {},
  btnSignUpNavBtnBlock: {
    marginTop: 16,
  },
  blockTitleAndBtnNavSignUp: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  titleAndBtnNavSignUp: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
    color: "#8E8E8E",
  },
  btnNavSignUp: {},
  btnTextNavSignUp: {
    fontSize: 18,
    fontWeight: "400",
    color: "#3A65FF",
  },

  // Original Styles
  labelAndInputBlock: {},
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 3,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: "#E0E0E0",
    fontSize: 18,
    paddingVertical: 8,
    paddingBottom: 5,
    height: 35,
  },
  showAndHidePasswordIcon: {
    position: "absolute",
    top: 3.5,
    right: 12,
  },
  socialMediasAndCorporations: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D5D5D5",
  },
  imgsSocialMediasAndCorporations: {
    width: 36,
    height: 36,
  },
});
