import { useAuth } from "@/context/AuthContext";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { mobileSignUp } from "@/firebase/mobile.services";
import { useNavigation } from "expo-router";
import { Formik } from "formik";
import {
  AsYouType,
  CountryCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as Yup from "yup";

// @ts-ignore: Module 'country-telephone-data' has no type declarations
import { allCountries } from "country-telephone-data";


// Tajik SIM card prefixes and operators data
const TAJIK_PREFIXES = {
  "90": "MegaFon Tajikistan",
  "55": "MegaFon Tajikistan",
  "41": "MegaFon Tajikistan",
  "88": "MegaFon Tajikistan",
  "00": "MegaFon Tajikistan",
  "01": "MegaFon Tajikistan",
  "02": "MegaFon Tajikistan",
  "07": "MegaFon Tajikistan",
  "97": "MegaFon Tajikistan",
  "12": "MegaFon Tajikistan",
  "21": "MegaFon Tajikistan",
  "27": "MegaFon Tajikistan",
  "91": "ZET-Mobile",
  "40": "ZET-Mobile",
  "80": "ZET-Mobile",
  "33": "ZET-Mobile",
  "81": "ZET-Mobile",
  "03": "ZET-Mobile",
  "04": "ZET-Mobile",
  "08": "ZET-Mobile",
  "05": "ZET-Mobile",
  "09": "ZET-Mobile",
  "06": "ZET-Mobile",
  "18": "ZET-Mobile",
  "19": "ZET-Mobile",
  "66": "ZET-Mobile",
  "38": "ZET-Mobile",
  "92": "Tcell",
  "93": "Tcell",
  "50": "Tcell",
  "77": "Tcell",
  "70": "Tcell",
  "99": "Tcell",
  "11": "Tcell",
  "10": "O-Mobile",
  "20": "O-Mobile",
  "22": "O-Mobile",
  "30": "O-Mobile",
  "78": "Anor",
  "87": "Anor",
  "98": "Babilon-Mobile",
  "94": "Babilon-Mobile",
  "71": "Babilon-Mobile",
  "17": "Babilon-Mobile",
  "75": "Babilon-Mobile",
  "440": "ZET-Mobile",
  "444": "ZET-Mobile",
  "030": "ZET-Mobile",
  "040": "ZET-Mobile",
  "080": "ZET-Mobile",
  "442": "ZET-Mobile",
  "443": "ZET-Mobile",
  "447": "ZET-Mobile",
  "449": "ZET-Mobile",
  "918": "Babilon-Mobile",
};

// Get all countries from the library and format for rn-selector
const COUNTRIES_DATA = allCountries.map((country: any) => ({
  value: country.iso2,
  label: `${country.name} (+${country.dialCode})`,
  emoji: country.emoji,
  dialCode: country.dialCode,
  name: country.name,
}));

// Date formatting function (DD-MM-YYYY)
const formatDateOfBirth = (text: string): string => {
  // Remove all non-digit characters
  const cleaned = text.replace(/\D/g, "");

  // Limit to 8 digits (DDMMYYYY)
  const limited = cleaned.slice(0, 8);

  // Apply formatting
  if (limited.length <= 2) {
    return limited; // DD
  } else if (limited.length <= 4) {
    return `${limited.slice(0, 2)}-${limited.slice(2, 4)}`; // DD-MM
  } else {
    return `${limited.slice(0, 2)}-${limited.slice(2, 4)}-${limited.slice(
      4,
      8,
    )}`; // DD-MM-YYYY
  }
};

// Validate date of birth (DD-MM-YYYY)
const validateDateOfBirth = (date: string): boolean => {
  if (!date || date.length !== 10) return false;

  const regex = /^\d{2}-\d{2}-\d{4}$/;
  if (!regex.test(date)) return false;

  const [day, month, year] = date.split("-").map(Number);

  // Check month
  if (month < 1 || month > 12) return false;

  // Check day
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;

  // Check year (must be between 1900 and current year)
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return false;

  // Check if date is not in the future
  const inputDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate <= today;
};

// Simplified password validation for signup (minimum 8 characters with at least one number)
const validatePasswordStrength = (
  password: string,
): { isValid: boolean; error: string | null } => {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters" };
  }

  if (password.length > 50) {
    return { isValid: false, error: "Password must not exceed 50 characters" };
  }

  const hasNumbers = /\d/.test(password);
  if (!hasNumbers) {
    return {
      isValid: false,
      error: "Password must contain at least one number",
    };
  }

  return { isValid: true, error: null };
};

// Validation schema
const SignUpSchema = Yup.object().shape({
  fullName: Yup.string()
    .required("Full Name is required")
    .min(3, "Full Name must be at least 3 characters")
    .max(50, "Full Name must be at most 50 characters")
    .test(
      "no-special-chars",
      "Full Name can only contain letters, spaces, and basic punctuation",
      (value) => {
        if (!value) return true;
        return /^[a-zA-Z\s\-'.]*$/.test(value);
      },
    ),
  dateOfBirth: Yup.string()
    .required("Date of Birth is required")
    .test(
      "is-valid-date",
      "Invalid date format (DD-MM-YYYY)",
      function (value) {
        if (!value) return false;
        return validateDateOfBirth(value);
      },
    )
    .test(
      "is-adult",
      "You must be at least 13 years old to sign up",
      function (value) {
        if (!value) return false;
        const [day, month, year] = value.split("-").map(Number);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          return age - 1 >= 13;
        }
        return age >= 13;
      },
    ),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .test("is-valid-phone", "Invalid phone number", function (value) {
      if (!value) return false;

      // Clean the phone number
      const cleanNumber = value.replace(/[^\d+]/g, "");

      // Check if it starts with +
      if (!cleanNumber.startsWith("+")) return false;

      // Try to parse the phone number
      try {
        const phoneNumber = parsePhoneNumberFromString(cleanNumber);
        if (!phoneNumber || !phoneNumber.isValid()) return false;

        // Additional validation for Tajik numbers
        if (phoneNumber.country === "TJ") {
          const nationalNumber = phoneNumber.nationalNumber;

          // Check 3-digit prefixes first
          const threeDigitPrefix = nationalNumber.substring(0, 3);
          if (TAJIK_PREFIXES[threeDigitPrefix as keyof typeof TAJIK_PREFIXES]) {
            return true;
          }

          // Check 2-digit prefixes
          const twoDigitPrefix = nationalNumber.substring(0, 2);
          if (TAJIK_PREFIXES[twoDigitPrefix as keyof typeof TAJIK_PREFIXES]) {
            return true;
          }

          return false; // Invalid Tajik prefix
        }

        return true; // Valid non-Tajik number
      } catch (error) {
        return false;
      }
    }),
  email: Yup.string()
    .required("Email is required")
    .email("Invalid email format")
    .max(254, "Email must not exceed 254 characters")
    .test("email-domain", "Please use a valid email domain", (value) => {
      if (!value) return true;
      const domain = value.split("@")[1];
      const invalidDomains = [
        "tempmail.com",
        "temp-mail.org",
        "guerrillamail.com",
        "mailinator.com",
        "yopmail.com",
        "10minutemail.com",
      ];
      return !invalidDomains.includes(domain?.toLowerCase() || "");
    }),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must not exceed 50 characters")
    .test(
      "password-strength",
      "Password must contain at least one number",
      function (value) {
        if (!value) return false;
        const hasNumbers = /\d/.test(value);
        return hasNumbers;
      },
    ),
  confirmPassword: Yup.string()
    .required("Confirm Password is required")
    .oneOf([Yup.ref("password")], "Passwords must match"),
  isVolunteer: Yup.boolean(),
});

const SignUp = () => {
  const navigation: any = useNavigation();

  const [showAndHidePassword, setShowAndHidePassword] = useState(false);
  const [showAndHideConfirmPassword, setShowAndHideConfirmPassword] =
    useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [detectedOperator, setDetectedOperator] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("tj");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentUser } = useAuth();

  // Detect Tajik mobile operator from phone number
  const detectTajikOperator = (phoneNumber: string): string => {
    if (!phoneNumber || !phoneNumber.includes("+992")) {
      return "";
    }

    const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
    const nationalNumber = cleanNumber.startsWith("992")
      ? cleanNumber.substring(3)
      : cleanNumber;

    if (!nationalNumber) return "";

    const threeDigitPrefix = nationalNumber.substring(0, 3);
    if (TAJIK_PREFIXES[threeDigitPrefix as keyof typeof TAJIK_PREFIXES]) {
      return TAJIK_PREFIXES[threeDigitPrefix as keyof typeof TAJIK_PREFIXES];
    }

    const twoDigitPrefix = nationalNumber.substring(0, 2);
    if (TAJIK_PREFIXES[twoDigitPrefix as keyof typeof TAJIK_PREFIXES]) {
      return TAJIK_PREFIXES[twoDigitPrefix as keyof typeof TAJIK_PREFIXES];
    }

    return "";
  };

  // Enhanced country detection with Tajik prefix support
  const detectCountryFromPhoneNumber = (phoneNumber: string): string | null => {
    if (!phoneNumber || !phoneNumber.startsWith("+")) {
      return null;
    }

    // Special case: Check for Tajikistan number with specific prefixes
    if (phoneNumber.startsWith("+992")) {
      const operator = detectTajikOperator(phoneNumber);
      setDetectedOperator(operator);
      return "tj";
    }

    // Try to parse with libphonenumber
    try {
      const phoneNumberObj = parsePhoneNumberFromString(phoneNumber);
      if (phoneNumberObj && phoneNumberObj.country) {
        const detectedCountry = phoneNumberObj.country.toLowerCase();

        if (detectedCountry !== "tj") {
          setDetectedOperator("");
        }
        return detectedCountry;
      }
    } catch (error) {
      console.log("Error parsing phone number:", error);
    }

    // Fallback: Check against our countries data by dial code
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    const sortedCountries = [...COUNTRIES_DATA].sort(
      (a: any, b: any) =>
        b.dialCode.replace("+", "").length - a.dialCode.replace("+", "").length,
    );

    for (const country of sortedCountries) {
      const countryDialCode = country.dialCode.replace("+", "");
      if (cleanPhone.startsWith(countryDialCode)) {
        if (country.value !== "tj") {
          setDetectedOperator("");
        }
        return country.value;
      }
    }

    setDetectedOperator("");
    return null;
  };

  // Phone number formatting and validation
  const handlePhoneChange = (text: string, setFieldValue: any) => {
    // Allow only digits, plus, spaces, and parentheses
    const cleaned = text.replace(/[^\d+()\s-]/g, "");
    setFieldValue("phoneNumber", cleaned);

    // Auto-detect country from input when number starts with +
    if (cleaned.startsWith("+") && cleaned.length >= 3) {
      const detectedCountry = detectCountryFromPhoneNumber(cleaned);

      if (detectedCountry && detectedCountry !== selectedCountry) {
        setSelectedCountry(detectedCountry);
        setPhoneError("");
        setDetectedOperator("");

        try {
          const formatter = new AsYouType(
            detectedCountry.toUpperCase() as CountryCode,
          );
          const formatted = formatter.input(cleaned);
          setFieldValue("phoneNumber", formatted);

          if (detectedCountry === "tj" && formatted.startsWith("+992")) {
            const operator = detectTajikOperator(formatted);
            setDetectedOperator(operator);
          }
        } catch (error) {
          setFieldValue("phoneNumber", cleaned);
        }

        validatePhoneNumber(cleaned, detectedCountry, setPhoneError);
        return;
      }
    }

    if (!cleaned || !cleaned.startsWith("+") || cleaned.length < 3) {
      if (selectedCountry !== "") {
        setSelectedCountry("");
      }
      setPhoneError("");
      setDetectedOperator("");
      return;
    }

    if (selectedCountry) {
      try {
        const formatter = new AsYouType(
          selectedCountry.toUpperCase() as CountryCode,
        );
        const formatted = formatter.input(cleaned);
        setFieldValue("phoneNumber", formatted);

        if (selectedCountry === "tj" && formatted.startsWith("+992")) {
          const operator = detectTajikOperator(formatted);
          setDetectedOperator(operator);
        }
      } catch (error) {
        setFieldValue("phoneNumber", cleaned);
      }

      validatePhoneNumber(cleaned, selectedCountry, setPhoneError);
    }
  };

  // Phone number validation function
  const validatePhoneNumber = (
    phoneNumber: string,
    countryCode: string,
    setError: any,
  ) => {
    if (phoneNumber.replace("+", "").length < 4) {
      setError("");
      return;
    }

    try {
      const phoneNumberObj = parsePhoneNumberFromString(
        phoneNumber,
        countryCode.toUpperCase() as CountryCode,
      );

      if (phoneNumberObj && phoneNumberObj.isValid()) {
        setError("");

        if (countryCode === "tj" && phoneNumber.startsWith("+992")) {
          const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
          if (cleanNumber.length >= 11) {
            const operator = detectTajikOperator(phoneNumber);
            if (!operator) {
              setError("Invalid Tajik mobile prefix");
            }
          }
        }
      } else {
        const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
        if (cleanNumber.length < 8) {
          setError("");
        } else {
          setError("Please enter a valid phone number");
        }
      }
    } catch (error) {
      const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
      if (cleanNumber.length < 8) {
        setError("");
      } else {
        setError("Please enter a valid phone number");
      }
    }
  };

  // Handle country selection
  const handleCountrySelect = (countryCode: string, setFieldValue: any) => {
    setSelectedCountry(countryCode);
    setPhoneError("");
    setDetectedOperator("");

    const country = COUNTRIES_DATA.find((c: any) => c.value === countryCode);
    if (country) {
      setFieldValue("phoneNumber", `+${country.dialCode} `);
    }
  };

  // Handle date of birth change with formatting (DD-MM-YYYY)
  const handleDateOfBirthChange = (text: string, setFieldValue: any) => {
    const formatted = formatDateOfBirth(text);
    setFieldValue("dateOfBirth", formatted);
  };

  const handleSubmit = async (values: any) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Convert date from DD-MM-YYYY to YYYY-MM-DD for API
      const [day, month, year] = values.dateOfBirth.split("-");
      const formattedDateForApi = `${year}-${month}-${day}`;

      const userData = {
        name: values.fullName.trim(),
        date_of_birth: formattedDateForApi,
        phone: values.phoneNumber.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        confirm_password: values.confirmPassword,
      };

      await mobileSignUp(
        values.email.trim().toLowerCase(),
        values.password,
        values.fullName.trim(),
        values.phoneNumber.trim(),
        formattedDateForApi,
      );
      Alert.alert("Success", "Registered successfully! You can now sign in.");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Error", "This email is already registered.");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("Error", "Password is too weak.");
      } else {
        Alert.alert("Error", "Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.containerSignUpComponent}>
      {/* Header - Fixed at top */}
      <View style={styles.headerSignUpComponent}>
        <Image
          source={require("../../assets/peshraft-library/auth/signUpImg.jpg")}
          style={styles.imgHeaderSignUpComponent}
        />
      </View>

      {/* Scrollable Section - Only this part scrolls */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.sectionSignUpComponent}
            contentContainerStyle={styles.sectionSignUpComponentScrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formSignUp}>
              <Text style={styles.titleFormSignUp}>Create account</Text>

              <Formik
                initialValues={{
                  fullName: "",
                  dateOfBirth: "",
                  phoneNumber: "+992 ",
                  email: "",
                  password: "",
                  confirmPassword: "",
                  isVolunteer: false,
                }}
                validationSchema={SignUpSchema}
                onSubmit={handleSubmit}
                validateOnChange={true}
                validateOnBlur={true}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  setFieldValue,
                  values,
                  errors,
                  touched,
                  isValid,
                  dirty,
                }) => (
                  <View style={styles.blockLabelsAndInputs}>
                    {/* Full Name */}
                    <View
                      style={[
                        styles.labelAndInputFullNameBlock,
                        styles.labelAndInputBlock,
                      ]}
                    >
                      <Text style={styles.label}>Full Name</Text>
                      <TextInput
                        style={[
                          styles.input,
                          errors.fullName &&
                            touched.fullName &&
                            styles.inputError,
                          touched.fullName &&
                            !errors.fullName &&
                            styles.inputSuccess,
                        ]}
                        onChangeText={handleChange("fullName")}
                        onBlur={handleBlur("fullName")}
                        value={values.fullName}
                        placeholder="Enter your full name"
                        returnKeyType="next"
                        editable={!isSubmitting}
                      />
                      {errors.fullName && touched.fullName && (
                        <Text style={styles.errorText}>{errors.fullName}</Text>
                      )}
                      {touched.fullName && !errors.fullName && (
                        <Text style={styles.successText}>✓ Valid name</Text>
                      )}
                    </View>

                    {/* Date of Birth */}
                    <View
                      style={[
                        styles.labelAndInputAgeBlock,
                        styles.labelAndInputBlock,
                      ]}
                    >
                      <Text style={styles.label}>Date of Birth</Text>
                      <TextInput
                        style={[
                          styles.input,
                          errors.dateOfBirth &&
                            touched.dateOfBirth &&
                            styles.inputError,
                          touched.dateOfBirth &&
                            !errors.dateOfBirth &&
                            styles.inputSuccess,
                        ]}
                        onChangeText={(text) =>
                          handleDateOfBirthChange(text, setFieldValue)
                        }
                        onBlur={handleBlur("dateOfBirth")}
                        value={values.dateOfBirth}
                        placeholder="DD-MM-YYYY"
                        keyboardType="numeric"
                        returnKeyType="next"
                        editable={!isSubmitting}
                      />
                      {errors.dateOfBirth && touched.dateOfBirth && (
                        <Text style={styles.errorText}>
                          {errors.dateOfBirth}
                        </Text>
                      )}
                      {touched.dateOfBirth && !errors.dateOfBirth && (
                        <Text style={styles.successText}>✓ Valid date</Text>
                      )}
                    </View>

                    {/* Phone Number */}
                    <View
                      style={[
                        styles.labelAndInputPhoneNumberBlock,
                        styles.labelAndInputBlock,
                      ]}
                    >
                      <Text style={styles.label}>Phone number</Text>

                      <View style={styles.phoneInputContainer}>
                        <FontAwesome
                          name="phone"
                          size={20}
                          color="black"
                          style={styles.phoneIcon}
                        />
                        <TextInput
                          style={[
                            styles.input,
                            styles.phoneInput,
                            (errors.phoneNumber && touched.phoneNumber) ||
                            phoneError
                              ? styles.inputError
                              : null,
                            touched.phoneNumber &&
                              !errors.phoneNumber &&
                              !phoneError &&
                              styles.inputSuccess,
                          ]}
                          onChangeText={(text) =>
                            handlePhoneChange(text, setFieldValue)
                          }
                          onBlur={handleBlur("phoneNumber")}
                          value={values.phoneNumber}
                          placeholder="+992 93 123 4567"
                          keyboardType="phone-pad"
                          returnKeyType="next"
                          editable={!isSubmitting}
                        />
                      </View>

                      {errors.phoneNumber && touched.phoneNumber ? (
                        <Text style={styles.errorText}>
                          {errors.phoneNumber}
                        </Text>
                      ) : phoneError ? (
                        <Text style={styles.errorText}>{phoneError}</Text>
                      ) : (
                        touched.phoneNumber &&
                        !errors.phoneNumber &&
                        !phoneError && (
                          <Text style={styles.successText}>
                            ✓ Valid phone number
                          </Text>
                        )
                      )}

                      {detectedOperator && (
                        <Text style={styles.operatorText}>
                          Operator: {detectedOperator}
                        </Text>
                      )}

                      <Text style={styles.phoneHint}>
                        {selectedCountry === "tj"
                          ? "Start with +992. Supported prefixes: 90, 91, 92, 93, 94, 98, 99, etc."
                          : "Start with + or select country."}
                      </Text>
                    </View>

                    {/* Email */}
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
                          errors.email && touched.email && styles.inputError,
                          touched.email && !errors.email && styles.inputSuccess,
                        ]}
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        value={values.email}
                        placeholder="example@gmail.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        returnKeyType="next"
                        editable={!isSubmitting}
                      />
                      {errors.email && touched.email && (
                        <Text style={styles.errorText}>{errors.email}</Text>
                      )}
                      {touched.email && !errors.email && (
                        <Text style={styles.successText}>✓ Valid email</Text>
                      )}
                    </View>

                    {/* Password */}
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
                            errors.password &&
                              touched.password &&
                              styles.inputError,
                            touched.password &&
                              !errors.password &&
                              styles.inputSuccess,
                          ]}
                          onChangeText={handleChange("password")}
                          onBlur={handleBlur("password")}
                          value={values.password}
                          secureTextEntry={!showAndHidePassword}
                          autoComplete="password-new"
                          placeholder="At least 8 characters with at least one number"
                          returnKeyType="next"
                          editable={!isSubmitting}
                        />
                        {showAndHidePassword ? (
                          <Entypo
                            name="eye-with-line"
                            size={30}
                            color="black"
                            style={styles.showAndHidePasswordIcon}
                            onPress={() =>
                              !isSubmitting && setShowAndHidePassword(false)
                            }
                          />
                        ) : (
                          <Entypo
                            name="eye"
                            size={30}
                            color="black"
                            style={styles.showAndHidePasswordIcon}
                            onPress={() =>
                              !isSubmitting && setShowAndHidePassword(true)
                            }
                          />
                        )}
                      </View>

                      {/* Password Requirements (shown when password field is touched or has errors) */}
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
                              {values.password.length >= 8 ? "✓" : "•"} At least
                              8 characters
                            </Text>
                            <Text
                              style={[
                                styles.passwordRequirement,
                                /\d/.test(values.password) &&
                                  styles.requirementMet,
                              ]}
                            >
                              {/\d/.test(values.password) ? "✓" : "•"} At least
                              one number
                            </Text>
                          </View>
                        )}

                      {errors.password && touched.password && (
                        <Text style={styles.errorText}>{errors.password}</Text>
                      )}
                    </View>

                    {/* Confirm Password */}
                    <View
                      style={[
                        styles.labelAndInputConfirmPasswordBlock,
                        styles.labelAndInputBlock,
                      ]}
                    >
                      <Text style={styles.label}>Confirm Password</Text>
                      <View style={styles.iconAndInputConfirmPasswordBlock}>
                        <TextInput
                          style={[
                            styles.input,
                            styles.inputConfirmPassword,
                            errors.confirmPassword &&
                              touched.confirmPassword &&
                              styles.inputError,
                            touched.confirmPassword &&
                              !errors.confirmPassword &&
                              styles.inputSuccess,
                          ]}
                          onChangeText={handleChange("confirmPassword")}
                          onBlur={handleBlur("confirmPassword")}
                          value={values.confirmPassword}
                          secureTextEntry={!showAndHideConfirmPassword}
                          autoComplete="password-new"
                          placeholder="Re-enter your password"
                          returnKeyType="done"
                          editable={!isSubmitting}
                        />
                        {showAndHideConfirmPassword ? (
                          <Entypo
                            name="eye-with-line"
                            size={30}
                            color="black"
                            style={styles.showAndHideConfirmPasswordIcon}
                            onPress={() =>
                              !isSubmitting &&
                              setShowAndHideConfirmPassword(false)
                            }
                          />
                        ) : (
                          <Entypo
                            name="eye"
                            size={30}
                            color="black"
                            style={styles.showAndHideConfirmPasswordIcon}
                            onPress={() =>
                              !isSubmitting &&
                              setShowAndHideConfirmPassword(true)
                            }
                          />
                        )}
                      </View>
                      {errors.confirmPassword && touched.confirmPassword && (
                        <Text style={styles.errorText}>
                          {errors.confirmPassword}
                        </Text>
                      )}
                      {touched.confirmPassword &&
                        !errors.confirmPassword &&
                        values.confirmPassword === values.password && (
                          <Text style={styles.successText}>
                            ✓ Passwords match
                          </Text>
                        )}
                    </View>

                    {/* Submit Button */}
                    <View style={styles.btnSignUpAndSignInNavBlock}>
                      <Pressable
                        style={[
                          styles.btnSignUp,
                          (!isValid || !dirty || isSubmitting) &&
                            styles.btnSignUpDisabled,
                        ]}
                        onPress={() => handleSubmit()}
                        disabled={!isValid || !dirty || isSubmitting}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.btnTextSignUp}>Sign up</Text>
                        )}
                      </Pressable>

                      <View style={styles.blockTitleAndBtnNavSignIn}>
                        <Text style={styles.titleAndBtnNavSignIn}>
                          Already have an account?
                        </Text>
                        <Pressable
                          style={styles.btnNavSignIn}
                          onPress={() => {
                            if (!isSubmitting) {
                              navigation.navigate("SignIn");
                            }
                          }}
                          disabled={isSubmitting}
                        >
                          <Text
                            style={[
                              styles.btnTextNavSignIn,
                              isSubmitting && styles.disabledNavText,
                            ]}
                          >
                            {" "}
                            Sign in
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}
              </Formik>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  containerSignUpComponent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerSignUpComponent: {
    height: 283,
  },
  imgHeaderSignUpComponent: {
    width: "100%",
    height: "100%",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  sectionSignUpComponent: {
    flex: 1,
  },
  sectionSignUpComponentScrollView: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  formSignUp: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  titleFormSignUp: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },
  blockLabelsAndInputs: {
    flex: 1,
    gap: 8,
  },
  labelAndInputFullNameBlock: {},
  labelAndInputAgeBlock: {},
  labelAndInputPhoneNumberBlock: {},
  labelAndInputEmailBlock: {},
  labelAndInputPasswordBlock: {},
  labelAndInputConfirmPasswordBlock: {},
  iconAndInputPasswordBlock: {
    position: "relative",
  },
  iconAndInputConfirmPasswordBlock: {
    position: "relative",
  },
  inputPassword: {
    paddingRight: 50,
  },
  inputConfirmPassword: {
    paddingRight: 50,
  },
  checkboxOfIsPeshraftVolunteer: {
    marginTop: 5,
    marginBottom: 10,
  },
  btnSignUp: {
    backgroundColor: "#00A9FF",
    borderRadius: 30,
    paddingVertical: 12,
    marginTop: 5,
  },
  btnSignUpDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  btnTextSignUp: {
    textAlign: "center",
    color: "#fff",
    fontSize: 19,
    fontWeight: "600",
  },
  blockTitleAndBtnNavSignIn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  titleAndBtnNavSignIn: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
    color: "#8E8E8E",
  },
  btnNavSignIn: {},
  btnTextNavSignIn: {
    fontSize: 18,
    fontWeight: "400",
    color: "#3A65FF",
  },
  disabledNavText: {
    color: "#CCCCCC",
  },
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
  inputError: {
    borderBottomColor: "#FF3B30",
  },
  inputSuccess: {
    borderBottomColor: "#34C759",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  successText: {
    color: "#34C759",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  showAndHidePasswordIcon: {
    position: "absolute",
    top: 3.5,
    right: 12,
  },
  showAndHideConfirmPasswordIcon: {
    position: "absolute",
    top: 3.5,
    right: 12,
  },
  btnSignUpAndSignInNavBlock: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  operatorText: {
    color: "#4C4ADA",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    fontStyle: "italic",
  },
  phoneHint: {
    color: "#666",
    fontSize: 10,
    fontStyle: "italic",
    marginTop: 2,
  },
  countrySelectorContainer: {
    marginBottom: 8,
    zIndex: 1000,
  },
  selectorStyle: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    marginTop: 5,
  },
  optionStyle: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    color: "#000",
  },
  dropdownStyle: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 5,
    maxHeight: 200,
    backgroundColor: "#fff",
  },
  searchInputStyle: {
    backgroundColor: "#f0f0f0",
    color: "#000",
  },
  phoneInputContainer: {
    position: "relative",
  },
  phoneIcon: {
    position: "absolute",
    top: 10,
    left: 0,
    zIndex: 1,
  },
  phoneInput: {
    paddingLeft: 30,
  },
  // Password Requirements Styles (from SignIn)
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
});

export default SignUp;