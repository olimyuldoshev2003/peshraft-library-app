import { MaterialCommunityIcons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import * as ImagePicker from "expo-image-picker";
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
import { useTranslation } from "react-i18next";

import { updateUserProfile } from "@/firebase/mobile.services";
import { useAuth } from "@/context/AuthContext";

const EditUser = () => {
  const navigation: any = useNavigation();
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const [userImage, setUserImage] = useState<string | null>(
    userProfile?.member_image_url || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showAndHidePassword, setShowAndHidePassword] = useState(false);
  const [showAndHideConfirmPassword, setShowAndHideConfirmPassword] =
    useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [detectedOperator, setDetectedOperator] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("tj");
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  ////////////////////////////////////////////////////////////////////////
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

  // Date formatting function
  const formatDateOfBirth = (text: string): string => {
    const cleaned = text.replace(/\D/g, "");
    const limited = cleaned.slice(0, 8);

    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}-${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)}-${limited.slice(2, 4)}-${limited.slice(4)}`;
    }
  };

  // Validate date of birth
  const validateDateOfBirth = (date: string): boolean => {
    if (!date) return false;

    // DD-MM-YYYY
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    if (!regex.test(date)) return false;

    const [day, month, year] = date.split("-").map(Number);

    // Validate month
    if (month < 1 || month > 12) return false;

    // Validate days
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;

    // Validate year
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) return false;

    // Create proper JS date
    const inputDate = new Date(year, month - 1, day);

    // Prevent future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inputDate > today) return false;

    return true;
  };

  // Enhanced password validation
  const validatePasswordStrength = (
    password: string,
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!password || password.length < 8) {
      errors.push(t("editProfile.t18"));
      return { isValid: false, errors };
    }

    if (password.length > 128) {
      errors.push(t("editProfile.t19"));
      return { isValid: false, errors };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(
      password,
    );

    if (!hasUpperCase) errors.push(t("editProfile.t20"));
    if (!hasLowerCase) errors.push(t("editProfile.t21"));
    if (!hasNumbers) errors.push(t("editProfile.t22"));
    if (!hasSpecialChar) errors.push(t("editProfile.t23"));

    const sequentialPatterns = [
      "12345678",
      "87654321",
      "23456789",
      "98765432",
      "qwertyui",
      "iuytrewq",
      "asdfghjk",
      "kjhgfdsa",
      "zxcvbnm",
      "mnbvcxz",
      "password",
      "admin123",
      "letmein1",
      "welcome1",
      "monkey12",
      "dragon12",
    ];

    const lowerPassword = password.toLowerCase();
    for (const pattern of sequentialPatterns) {
      if (lowerPassword.includes(pattern)) {
        errors.push(t("editProfile.t24"));
        break;
      }
    }

    const hasRepeatedChars = /(.)\1{3,}/.test(password);
    if (hasRepeatedChars) errors.push(t("editProfile.t25"));

    const commonSequences = [
      "12345678",
      "87654321",
      "11111111",
      "22222222",
      "33333333",
      "44444444",
      "55555555",
      "66666666",
      "77777777",
      "88888888",
      "99999999",
      "00000000",
    ];

    if (commonSequences.includes(password)) {
      errors.push(t("editProfile.t26"));
    }

    const dictionaryWords = [
      "password",
      "admin",
      "welcome",
      "qwerty",
      "letmein",
      "monkey",
      "dragon",
      "sunshine",
      "princess",
      "football",
      "baseball",
      "mustang",
      "superman",
      "trustno1",
      "master",
      "hello123",
      "secret",
      "abcd1234",
      "passw0rd",
      "admin123",
    ];

    const normalizedPass = password.toLowerCase();
    for (const word of dictionaryWords) {
      if (normalizedPass.includes(word)) {
        errors.push(t("editProfile.t27"));
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.slice(0, 3),
    };
  };

  // Validation schema for edit user
  const EditUserSchema = Yup.object().shape({
    fullName: Yup.string()
      .required(t("editProfile.t28"))
      .min(3, t("editProfile.t29"))
      .max(50, t("editProfile.t30"))
      .test("no-special-chars", t("editProfile.t31"), (value) => {
        if (!value) return true;
        return /^[a-zA-Z\s\-'.]*$/.test(value);
      }),
    dateOfBirth: Yup.string()
      .required(t("editProfile.t32"))
      .test(
        "is-valid-date",
        t("editProfile.t33"),

        function (value) {
          if (!value) return false;
          return validateDateOfBirth(value);
        },
      )
      .test("is-adult", t("editProfile.t34"), function (value) {
        if (!value) return false;

        const [day, month, year] = value.split("-").map(Number);

        const birthDate = new Date(year, month - 1, day);

        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();

        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        return age >= 13;
      }),
    jobTitle: Yup.string()
      .max(100, t("editProfile.t35"))
      .test("job-title-format", t("editProfile.t36"), (value) => {
        if (!value) return true;
        return /^[a-zA-Z\s\-'.&,()]*$/.test(value);
      }),
    phoneNumber: Yup.string()
      .required(t("editProfile.t37"))
      .test("is-valid-phone", t("editProfile.t38"), function (value) {
        if (!value) return false;

        const cleanNumber = value.replace(/[^\d+]/g, "");

        if (!cleanNumber.startsWith("+")) return false;

        try {
          const phoneNumber = parsePhoneNumberFromString(cleanNumber);
          if (!phoneNumber || !phoneNumber.isValid()) return false;

          if (phoneNumber.country === "TJ") {
            const nationalNumber = phoneNumber.nationalNumber;

            const threeDigitPrefix = nationalNumber.substring(0, 3);
            if (
              TAJIK_PREFIXES[threeDigitPrefix as keyof typeof TAJIK_PREFIXES]
            ) {
              return true;
            }

            const twoDigitPrefix = nationalNumber.substring(0, 2);
            if (TAJIK_PREFIXES[twoDigitPrefix as keyof typeof TAJIK_PREFIXES]) {
              return true;
            }

            return false;
          }

          return true;
        } catch (error) {
          return false;
        }
      }),
    email: Yup.string()
      .required(t("editProfile.t39"))
      .email(t("editProfile.t40"))
      .max(254, t("editProfile.t41"))
      .test("email-domain", t("editProfile.t42"), (value) => {
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
      .min(8, t("editProfile.t43"))
      .max(128, t("editProfile.t44"))
      .test("password-strength", t("editProfile.t45"), function (value) {
        if (!value) return true;
        const validation = validatePasswordStrength(value);
        if (!validation.isValid) {
          return this.createError({
            message: validation.errors[0] || t("editProfile.t46"),
          });
        }
        return true;
      }),
    confirmPassword: Yup.string().oneOf(
      [Yup.ref("password")],
      t("editProfile.t47"),
    ),
  });
  ////////////////////////////////////////////////////////////////////////

  // Real user data from Firebase
  const initialUserData = {
    fullName: userProfile?.fullName || "",
    dateOfBirth: userProfile?.dateOfBirth || "",
    jobTitle: "",
    phoneNumber: userProfile?.phoneNumber || "",
    email: userProfile?.email || currentUser?.email || "",
    password: "",
    confirmPassword: "",
  };

  // Detect Tajik mobile operator
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

  // Country detection
  const detectCountryFromPhoneNumber = (phoneNumber: string): string | null => {
    if (!phoneNumber || !phoneNumber.startsWith("+")) {
      return null;
    }

    if (phoneNumber.startsWith("+992")) {
      const operator = detectTajikOperator(phoneNumber);
      setDetectedOperator(operator);
      return "tj";
    }

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
      console.log(`${t("editProfile.t48")}:`, error);
    }

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

  // Phone number handling
  const handlePhoneChange = (text: string, setFieldValue: any) => {
    const cleaned = text.replace(/[^\d+()\s-]/g, "");
    setFieldValue("phoneNumber", cleaned);

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

  // Phone validation
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
              setError(t("editProfile.t49"));
            }
          }
        }
      } else {
        const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
        if (cleanNumber.length >= 8) {
          setError(t("editProfile.t50"));
        }
      }
    } catch (error) {
      const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
      if (cleanNumber.length >= 8) {
        setError(t("editProfile.t50"));
      }
    }
  };

  // Country selection
  const handleCountrySelect = (countryCode: string, setFieldValue: any) => {
    setSelectedCountry(countryCode);
    setPhoneError("");
    setDetectedOperator("");

    const country = COUNTRIES_DATA.find((c: any) => c.value === countryCode);
    if (country) {
      setFieldValue("phoneNumber", `+${country.dialCode} `);
    }
  };

  // Date of birth handling
  const handleDateOfBirthChange = (text: string, setFieldValue: any) => {
    const formatted = formatDateOfBirth(text);
    setFieldValue("dateOfBirth", formatted);
  };

  // Password strength analysis
  const analyzePasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength({ score: 0, feedback: [] });
      return;
    }

    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 12) score += 3;
    else if (password.length >= 10) score += 2;
    else if (password.length >= 8) score += 1;
    else feedback.push(`❌ ${t("editProfile.t51")}`);

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(
      password,
    );

    const typeCount = [
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length;

    if (typeCount === 4) score += 3;
    else if (typeCount === 3) score += 2;
    else if (typeCount === 2) score += 1;
    else feedback.push(`❌ ${t("editProfile.t52")}`);

    if (!hasUpperCase) feedback.push(`⚠️ ${t("editProfile.t53")}`);
    if (!hasLowerCase) feedback.push(`⚠️ ${t("editProfile.t54")}`);
    if (!hasNumbers) feedback.push(`⚠️ ${t("editProfile.t55")}`);
    if (!hasSpecialChar) feedback.push(`⚠️ ${t("editProfile.t56")}`);

    const commonPatterns = [
      "12345678",
      "87654321",
      "password",
      "qwertyui",
      "admin123",
      "letmein1",
      "11111111",
      "22222222",
    ];

    const lowerPassword = password.toLowerCase();
    let hasCommonPattern = false;
    for (const pattern of commonPatterns) {
      if (lowerPassword.includes(pattern)) {
        hasCommonPattern = true;
        feedback.push(`⚠️ ${t("editProfile.t57")}`);
        break;
      }
    }

    if (!hasCommonPattern) score += 2;

    const charSetSize =
      (hasUpperCase ? 26 : 0) +
      (hasLowerCase ? 26 : 0) +
      (hasNumbers ? 10 : 0) +
      (hasSpecialChar ? 32 : 0);

    const entropy = Math.log2(Math.pow(charSetSize, password.length));
    if (entropy > 60) score += 3;
    else if (entropy > 45) score += 2;
    else if (entropy > 30) score += 1;
    else if (password.length > 0) feedback.push(`⚠️ ${t("editProfile.t58")}`);

    const maxScore = 9;
    const strengthPercentage = Math.min(
      100,
      Math.round((score / maxScore) * 100),
    );

    const uniqueFeedback = [...new Set(feedback)];

    setPasswordStrength({
      score: strengthPercentage,
      feedback: uniqueFeedback.slice(0, 3),
    });
  };

  const handlePasswordChange = (text: string, setFieldValue: any) => {
    setFieldValue("password", text);
    analyzePasswordStrength(text);
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const userData = {
        fullName: values.fullName.trim(),
        dateOfBirth: values.dateOfBirth,
        jobTitle: values.jobTitle?.trim(),
        phoneNumber: values.phoneNumber.trim(),
        email: values.email.trim().toLowerCase(),
        ...(values.password ? { password: values.password } : {}),
      };

      // 🔥 Real Firebase update
      if (!userProfile?.id) throw new Error("No user profile found");
      await updateUserProfile(
        userProfile.id,
        {
          fullName: userData.fullName,
          dateOfBirth: userData.dateOfBirth,
          phoneNumber: userData.phoneNumber,
          email: userData.email,
        },
        userImage && typeof userImage === "string" && userImage.startsWith("file") ? userImage : undefined
      );
      await refreshProfile();

      Alert.alert(`${t("editProfile.t59")}`, `${t("editProfile.t60")}`, [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert(`${t("editProfile.t61")}`, `${t("editProfile.t62")}`, [
        { text: "OK" },
      ]);
      console.error("Update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image picker functions
  const pickImage = async () => {
    try {
      setIsLoading(true);

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(`${t("editProfile.t63")}`, `${t("editProfile.t64")}`);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        const fileExtension = selectedImage.uri.split(".").pop()?.toLowerCase();
        const allowedTypes = ["jpg", "jpeg", "png", "heic", "heif"];

        if (!fileExtension || !allowedTypes.includes(fileExtension)) {
          Alert.alert(`${t("editProfile.t65")}`, `${t("editProfile.t66")}`);
          return;
        }

        if (
          selectedImage.fileSize &&
          selectedImage.fileSize > 10 * 1024 * 1024
        ) {
          Alert.alert(`${t("editProfile.t67")}`, `${t("editProfile.t68")}`);
          return;
        }

        setUserImage(selectedImage.uri);
        Alert.alert(`${t("editProfile.t69")}`, `${t("editProfile.t70")}`, [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.error(`${t("editProfile.t71")}`, error);
      Alert.alert(`${t("editProfile.t72")}`, `${t("editProfile.t73")}`, [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsLoading(true);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(`${t("editProfile.t74")}`, `${t("editProfile.t75")}`);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const takenPhoto = result.assets[0];
        setUserImage(takenPhoto.uri);
        Alert.alert(`${t("editProfile.t69")}`, `${t("editProfile.t70")}`, [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.error(`${t("editProfile.t76")}`, error);
      Alert.alert(`${t("editProfile.t77")}`, `${t("editProfile.t78")}`, [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(`${t("editProfile.t79")}`, `${t("editProfile.t80")}`, [
      {
        text: `${t("editProfile.t81")}`,
        onPress: pickImage,
      },
      {
        text: `${t("editProfile.t82")}`,
        onPress: takePhoto,
      },
      {
        text: `${t("editProfile.t83")}`,
        style: "cancel",
      },
    ]);
  };

  const removeImage = () => {
    if (userImage && typeof userImage === "string") {
      Alert.alert(`${t("editProfile.t84")}`, `${t("editProfile.t85")}`, [
        {
          text: `${t("editProfile.t83")}`,
          style: "cancel",
        },
        {
          text: `${t("editProfile.t86")}`,
          style: "destructive",
          onPress: () => {
            setUserImage(
              require("../../assets/peshraft-library/profile/profile-img.jpg"),
            );

            Alert.alert(`${t("editProfile.t69")}`, `${t("editProfile.t87")}`);
          },
        },
      ]);
    }
  };

  const dynamicStyles = StyleSheet.create({
    titleEditUserComponent: {
      fontSize: i18n.language === "ru" ? 18 : 23,
    },
    btnTextImgUserChange: {
      fontSize: i18n.language === "tj" ? 14 : 16,
    },
  });

  return (
    <View style={styles.editUserComponent}>
      <View style={styles.editUserComponentBlock}>
        <View style={styles.headerEditUserComponent}>
          <MaterialCommunityIcons
            name="arrow-left-thin-circle-outline"
            size={45}
            color="black"
            onPress={() => {
              navigation.goBack();
            }}
          />
          <Text
            style={[
              styles.titleEditUserComponent,
              dynamicStyles.titleEditUserComponent,
            ]}
          >
            {t("editProfile.t1")}
          </Text>
          <View></View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.sectionEditUserComponentScrollView}
              style={styles.sectionEditUserComponent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.editUserImgBlock}>
                <View style={styles.imageContainer}>
                  <Image
                    source={
                      userImage
                        ? typeof userImage === "string"
                          ? { uri: userImage }
                          : userImage
                        : require("../../assets/peshraft-library/profile/profile-img.jpg")
                    }
                    style={styles.userImg}
                    onError={() => {
                      Alert.alert(
                        `${t("editProfile.t88")}`,
                        `${t("editProfile.t89")}`,
                      );
                      setUserImage(
                        require("../../assets/peshraft-library/profile/profile-img.jpg"),
                      );
                    }}
                  />
                  {isLoading && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color="#2623D2" />
                    </View>
                  )}
                </View>

                <View style={styles.buttonContainer}>
                  <Pressable
                    style={[
                      styles.btnImgUserChange,
                      isLoading && styles.btnDisabled,
                    ]}
                    onPress={showImagePickerOptions}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text
                        style={[
                          styles.btnTextImgUserChange,
                          dynamicStyles.btnTextImgUserChange,
                        ]}
                      >
                        {t("editProfile.t2")}
                      </Text>
                    )}
                  </Pressable>

                  {userImage && typeof userImage === "string" && (
                    <Pressable
                      style={[
                        styles.btnRemoveImage,
                        isLoading && styles.btnDisabled,
                      ]}
                      onPress={removeImage}
                      disabled={isLoading}
                    >
                      <Text style={styles.btnTextRemoveImage}>
                        {t("editProfile.t90")}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <Formik
                initialValues={initialUserData}
                validationSchema={EditUserSchema}
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
                  <View style={styles.labelsAndInputsBlock}>
                    {/* Full Name */}
                    <View
                      style={[
                        styles.labelAndInputBlock,
                        styles.labelAndInputFullnameBlock,
                      ]}
                    >
                      <Text style={[styles.label, styles.labelFullname]}>
                        {t("editProfile.t3")}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputFullname,
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
                        placeholder={t("editProfile.t4")}
                        returnKeyType="next"
                        editable={!isSubmitting}
                      />
                      {errors.fullName && touched.fullName && (
                        <Text style={styles.errorText}>{String(errors.fullName)}</Text>
                      )}
                    </View>

                    {/* Date of Birth */}
                    <View
                      style={[
                        styles.labelAndInputBlock,
                        styles.labelAndInputBirthDateBlock,
                      ]}
                    >
                      <Text style={[styles.label, styles.labelBirthDate]}>
                        {t("editProfile.t5")}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputBirthDate,
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
                        placeholder={t("editProfile.t6")}
                        keyboardType="numeric"
                        returnKeyType="next"
                        editable={!isSubmitting}
                      />
                      {errors.dateOfBirth && touched.dateOfBirth && (
                        <Text style={styles.errorText}>
                          {String(errors.dateOfBirth)}
                        </Text>
                      )}
                    </View>

                    {/* Job Title */}
                    {/* <View
                      style={[
                        styles.labelAndInputBlock,
                        styles.labelAndInputJobTitleBlock,
                      ]}
                    >
                      <Text style={[styles.label, styles.labelJobTitle]}>
                        {t("editProfile.t7")}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputJobTitle,
                          errors.jobTitle &&
                            touched.jobTitle &&
                            styles.inputError,
                          touched.jobTitle &&
                            !errors.jobTitle &&
                            styles.inputSuccess,
                        ]}
                        onChangeText={handleChange("jobTitle")}
                        onBlur={handleBlur("jobTitle")}
                        value={values.jobTitle}
                        placeholder={t("editProfile.t8")}
                        returnKeyType="next"
                        editable={!isSubmitting}
                      />
                      {errors.jobTitle && touched.jobTitle && (
                        <Text style={styles.errorText}>{String(errors.jobTitle)}</Text>
                      )}
                    </View> */}

                    {/* Phone Number */}
                    <View
                      style={[
                        styles.labelAndInputBlock,
                        styles.labelAndInputPhoneNumberBlock,
                      ]}
                    >
                      <Text style={[styles.label, styles.labelPhoneNumber]}>
                        {t("editProfile.t9")}
                      </Text>

                      {/* Country Selector */}
                      {/* <View style={styles.countrySelectorContainer}>
                        <Selector
                          options={COUNTRIES_DATA}
                          selectedValue={selectedCountry}
                          onValueChange={(countryCode) =>
                            handleCountrySelect(countryCode, setFieldValue)
                          }
                          placeholder={t("editProfile.t91")}
                          searchable={true}
                          primaryColor="#007AFF"
                          customArrow={
                            <Entypo
                              name="chevron-thin-down"
                              size={16}
                              color="#666"
                            />
                          }
                          searchPlaceholder={t("editProfile.t92")}
                          textStyle={{ color: "#000", fontSize: 14 }}
                          style={styles.selectorStyle}
                          optionStyle={styles.optionStyle}
                          dropdownStyle={styles.dropdownStyle}
                          searchInputStyle={styles.searchInputStyle}
                          disabled={isSubmitting}
                        />
                      </View> */}

                      <View style={styles.phoneInputContainer}>
                        {/* <FontAwesome
                      name="phone"
                      size={20}
                      color="black"
                      style={styles.phoneIcon}
                    /> */}
                        <TextInput
                          style={[
                            styles.input,
                            styles.inputPhoneNumber,
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
                          {String(errors.phoneNumber)}
                        </Text>
                      ) : phoneError ? (
                        <Text style={styles.errorText}>{phoneError}</Text>
                      ) : null}

                      {/* {detectedOperator && (
                        <Text style={styles.operatorText}>
                          {t("editProfile.t93")}: {detectedOperator}
                        </Text>
                      )} */}

                      {/* <Text style={styles.phoneHint}>
                        {selectedCountry === "tj"
                          ? `${t("editProfile.t94")}`
                          : `${t("editProfile.t95")}`
                        }
                      </Text> */}
                    </View>

                    {/* Email */}
                    <View
                      style={[
                        styles.labelAndInputBlock,
                        styles.labelAndInputEmailBlock,
                      ]}
                    >
                      <Text style={[styles.label, styles.labelEmail]}>
                        {t("editProfile.t11")}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputEmail,
                          errors.email && touched.email && styles.inputError,
                          touched.email && !errors.email && styles.inputSuccess,
                        ]}
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        value={values.email}
                        placeholder={t("editProfile.t12")}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        returnKeyType="next"
                        editable={!isSubmitting}
                      />
                      {errors.email && touched.email && (
                        <Text style={styles.errorText}>{String(errors.email)}</Text>
                      )}
                    </View>

                    {/* Password */}
                    <View
                      style={[
                        styles.labelAndInputBlock,
                        styles.labelAndInputPasswordBlock,
                      ]}
                    >
                      {/* <Text style={[styles.label, styles.labelPassword]}>
                        {t("editProfile.t13")}
                      </Text>
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
                          onChangeText={(text) =>
                            handlePasswordChange(text, setFieldValue)
                          }
                          onBlur={handleBlur("password")}
                          value={values.password}
                          secureTextEntry={!showAndHidePassword}
                          autoComplete="password-new"
                          placeholder={t("editProfile.t14")}
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
                      </View> */}

                      {/* Password Strength Indicator */}
                      {values.password.length > 0 && (
                        <View style={styles.passwordStrengthContainer}>
                          <View style={styles.strengthBarContainer}>
                            <View
                              style={[
                                styles.strengthBar,
                                {
                                  width: `${passwordStrength.score}%`,
                                  backgroundColor:
                                    passwordStrength.score >= 80
                                      ? "#34C759"
                                      : passwordStrength.score >= 60
                                        ? "#FF9500"
                                        : passwordStrength.score >= 40
                                          ? "#FFCC00"
                                          : "#FF3B30",
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.strengthText}>
                            {t("editProfile.t96")}: {passwordStrength.score}%
                            {passwordStrength.score >= 80
                              ? ` (${t("editProfile.t97")})`
                              : passwordStrength.score >= 60
                                ? ` (${t("editProfile.t98")})`
                                : passwordStrength.score >= 40
                                  ? ` (${t("editProfile.t99")})`
                                  : ` (${t("editProfile.t100")})`}
                          </Text>

                          {/* Password Requirements */}
                          <View style={styles.passwordRequirements}>
                            <Text style={styles.requirementsTitle}>
                              {t("editProfile.t101")}:
                            </Text>
                            <View style={styles.requirementItem}>
                              <Text
                                style={[
                                  styles.requirementText,
                                  values.password.length >= 8 &&
                                    styles.requirementMet,
                                ]}
                              >
                                {values.password.length >= 8 ? "✓" : "•"}{" "}
                                {t("editProfile.t102")}
                              </Text>
                            </View>
                            <View style={styles.requirementItem}>
                              <Text
                                style={[
                                  styles.requirementText,
                                  /[A-Z]/.test(values.password) &&
                                    styles.requirementMet,
                                ]}
                              >
                                {/[A-Z]/.test(values.password) ? "✓" : "•"}{" "}
                                {t("editProfile.t103")}
                              </Text>
                            </View>
                            <View style={styles.requirementItem}>
                              <Text
                                style={[
                                  styles.requirementText,
                                  /[a-z]/.test(values.password) &&
                                    styles.requirementMet,
                                ]}
                              >
                                {/[a-z]/.test(values.password) ? "✓" : "•"}{" "}
                                {t("editProfile.t104")}
                              </Text>
                            </View>
                            <View style={styles.requirementItem}>
                              <Text
                                style={[
                                  styles.requirementText,
                                  /\d/.test(values.password) &&
                                    styles.requirementMet,
                                ]}
                              >
                                {/\d/.test(values.password) ? "✓" : "•"}{" "}
                                {t("editProfile.t105")}
                              </Text>
                            </View>
                            <View style={styles.requirementItem}>
                              <Text
                                style={[
                                  styles.requirementText,
                                  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(
                                    values.password,
                                  ) && styles.requirementMet,
                                ]}
                              >
                                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(
                                  values.password,
                                )
                                  ? "✓"
                                  : "•"}{" "}
                                {t("editProfile.t106")}
                              </Text>
                            </View>

                            {/* Advanced feedback */}
                            {passwordStrength.feedback.length > 0 && (
                              <View style={styles.feedbackContainer}>
                                <Text style={styles.feedbackTitle}>
                                  {t("editProfile.t107")}:
                                </Text>
                                {passwordStrength.feedback.map(
                                  (item, index) => (
                                    <Text
                                      key={index}
                                      style={styles.feedbackItem}
                                    >
                                      {item}
                                    </Text>
                                  ),
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {errors.password && touched.password && (
                        <Text style={styles.errorText}>{String(errors.password)}</Text>
                      )}
                    </View>

                    {/* Confirm Password */}
                    {/* <View
                      style={[
                        styles.labelAndInputBlock,
                        styles.labelAndInputPasswordBlock,
                      ]}
                    >
                      <Text style={[styles.label, styles.labelPassword]}>
                        {t("editProfile.t15")}
                      </Text>
                      <View style={styles.iconAndInputConfirmPasswordBlock}>
                        <TextInput
                          style={[
                            styles.input,
                            styles.inputPassword,
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
                          placeholder={t("editProfile.t16")}
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
                        values.confirmPassword === values.password &&
                        values.password.length > 0 && (
                          <Text style={styles.successText}>
                            ✓ {t("editProfile.t108")}
                          </Text>
                        )}
                    </View> */}

                    {/* Save Button */}
                    <View style={styles.saveButtonContainer}>
                      <Pressable
                        style={[
                          styles.btnSave,
                          (!isValid || !dirty || isSubmitting) &&
                            styles.btnSaveDisabled,
                        ]}
                        onPress={() => handleSubmit()}
                        disabled={!isValid || !dirty || isSubmitting}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.btnTextSave}>
                            {t("editProfile.t17")}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}
              </Formik>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default EditUser;

const styles = StyleSheet.create({
  editUserComponent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  editUserComponentBlock: {
    flex: 1,
    padding: 10,
    paddingTop: 30,
  },
  headerEditUserComponent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleEditUserComponent: {
    fontSize: 23,
    fontWeight: "400",
  },

  keyboardAvoidingView: {
    flex: 1,
  },

  sectionEditUserComponentScrollView: {
    // flex: 1,
    paddingBottom: 70,
  },

  sectionEditUserComponent: {
    marginTop: 10,
    flex: 1,
  },
  editUserImgBlock: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 30,
  },

  imageContainer: {
    position: "relative",
  },
  userImg: {
    width: 117,
    height: 117,
    borderRadius: 100,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    gap: 12,
  },
  btnImgUserChange: {
    backgroundColor: "#FBF9F9",
    padding: 10,
    elevation: 8,
    borderRadius: 20,
  },
  btnRemoveImage: {
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 16,
    elevation: 4,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnTextImgUserChange: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  btnTextRemoveImage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  labelsAndInputsBlock: {
    marginTop: 20,
    paddingHorizontal: 10,
    gap: 10,
  },

  labelAndInputFullnameBlock: {},
  labelAndInputBirthDateBlock: {},
  labelAndInputJobTitleBlock: {},
  labelAndInputPhoneNumberBlock: {},
  labelAndInputEmailBlock: {},
  labelAndInputPasswordBlock: {},

  labelFullname: {},
  labelBirthDate: {},
  labelJobTitle: {},
  labelPhoneNumber: {},
  labelEmail: {},
  labelPassword: {},

  inputFullname: {},
  inputBirthDate: {},
  inputJobTitle: {},
  inputPhoneNumber: {},
  inputEmail: {},
  inputPassword: {
    paddingRight: 50,
  },

  // Styles with the same properties
  labelAndInputBlock: {
    gap: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 18,
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 15,
    color: "#6C6C6C",
    backgroundColor: "#F9F9F9",
  },
  inputError: {
    borderColor: "#FF0000",
  },
  inputSuccess: {
    borderColor: "#34C759",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginTop: 2,
  },
  successText: {
    color: "#34C759",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },

  // Country selector styles
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
    left: 10,
    zIndex: 1,
  },
  phoneInput: {},
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

  // Password styles
  iconAndInputPasswordBlock: {
    position: "relative",
  },
  iconAndInputConfirmPasswordBlock: {
    position: "relative",
  },
  showAndHidePasswordIcon: {
    position: "absolute",
    top: 10,
    right: 12,
  },
  showAndHideConfirmPasswordIcon: {
    position: "absolute",
    top: 10,
    right: 12,
  },

  // Password Strength Styles
  passwordStrengthContainer: {
    marginTop: 10,
  },
  strengthBarContainer: {
    height: 6,
    backgroundColor: "#E9ECEF",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  strengthBar: {
    height: "100%",
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  passwordRequirements: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#495057",
  },
  requirementItem: {
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: "#6C757D",
  },
  requirementMet: {
    color: "#34C759",
    fontWeight: "500",
  },
  feedbackContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#DEE2E6",
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: "#6C757D",
  },
  feedbackItem: {
    fontSize: 11,
    color: "#FF9500",
    marginBottom: 3,
    fontStyle: "italic",
  },

  // Save button
  saveButtonContainer: {
    paddingVertical: 20,
  },
  btnSave: {
    backgroundColor: "#00A9FF",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  btnSaveDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  btnTextSave: {
    textAlign: "center",
    color: "#fff",
    fontSize: 19,
    fontWeight: "600",
  },
});