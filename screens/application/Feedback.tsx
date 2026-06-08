import { MaterialCommunityIcons } from "@expo/vector-icons";
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

import { submitFeedback } from "@/firebase/mobile.services";
import { useAuth } from "@/context/AuthContext";

const Feedback = () => {
  const navigation: any = useNavigation();
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const [phoneError, setPhoneError] = useState("");
  const [detectedOperator, setDetectedOperator] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("tj");
  const [isSubmitting, setIsSubmitting] = useState(false);

  ////////////////////////////////////////////////////////////////////
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

  // Validation schema for feedback
  const FeedbackSchema = Yup.object().shape({
    phoneNumber: Yup.string()
      .required(t("feedback.t9"))
      .test("is-valid-phone", t("feedback.t10"), function (value) {
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

            return this.createError({
              message: t("feedback.t11"),
            });
          }

          return true;
        } catch (error) {
          return false;
        }
      })
      .test("min-length", t("feedback.t12"), function (value) {
        if (!value) return false;
        const digits = value.replace(/\D/g, "");
        return digits.length >= 8;
      }),
    email: Yup.string()
      .required(t("feedback.t13"))
      .email(t("feedback.t14"))
      .max(254, t("feedback.t15"))
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        t("feedback.t16"),
      )
      .test("email-domain", t("feedback.t17"), (value) => {
        if (!value) return true;
        const domain = value.split("@")[1];
        const invalidDomains = [
          "tempmail.com",
          "temp-mail.org",
          "guerrillamail.com",
          "mailinator.com",
          "yopmail.com",
          "10minutemail.com",
          "throwaway.com",
          "fakeinbox.com",
          "maildrop.cc",
          "getnada.com",
        ];
        return !invalidDomains.includes(domain?.toLowerCase() || "");
      }),
    review: Yup.string()
      .required(t("feedback.t18"))
      .min(20, t("feedback.t19"))
      .max(1000, t("feedback.t20"))
      .test("no-excessive-capitals", t("feedback.t21"), (value) => {
        if (!value) return true;
        const capitalCount = (value.match(/[A-Z]/g) || []).length;
        const capitalRatio = capitalCount / value.length;
        return capitalRatio <= 0.5;
      })
      .test("no-excessive-spaces", t("feedback.t22"), (value) => {
        if (!value) return true;
        return !/\s{4,}/.test(value);
      })
      .test("no-excessive-punctuation", t("feedback.t23"), (value) => {
        if (!value) return true;
        return !/[!?.,]{4,}/.test(value);
      })
      .test("no-html", t("feedback.t24"), (value) => {
        if (!value) return true;
        return !/<[^>]*>/.test(value);
      }),
  });
  ////////////////////////////////////////////////////////////////////

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
      console.log(`${t("feedback.t25")}:`, error);
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
              setError(t("feedback.t26"));
            }
          }
        }
      } else {
        const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
        if (cleanNumber.length >= 8) {
          setError(t("feedback.t27"));
        }
      }
    } catch (error) {
      const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
      if (cleanNumber.length >= 8) {
        setError(t("feedback.t27"));
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

  // Handle form submission
  const handleSubmit = async (values: any, { resetForm }: any) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const feedbackData = {
        phoneNumber: values.phoneNumber.trim(),
        email: values.email.trim().toLowerCase(),
        review: values.review.trim(),
      };

      // 🔥 Real Firebase submit
      await submitFeedback({
        phone: feedbackData.phoneNumber,
        email: feedbackData.email,
        feedback: feedbackData.review,
      });

      Alert.alert(`${t("feedback.t28")}!`, `${t("feedback.t29")}!`, [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            setSelectedCountry("tj");
            setDetectedOperator("");
            setPhoneError("");
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert(t("feedback.t30"), `${t("feedback.t31")}.`, [{ text: "OK" }]);
      console.error(`Submission error:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.feedbackComponent}>
      <View style={styles.feedbackComponentBlock}>
        <View style={styles.headerFeedbackComponent}>
          <MaterialCommunityIcons
            name="arrow-left-thin-circle-outline"
            size={45}
            color="black"
            onPress={() => {
              navigation.goBack();
            }}
          />
          <Text style={styles.titleFeedbackComponent}>{t("feedback.t1")}</Text>
        </View>
        <View style={styles.sectionFeedbackComponent}>
          <View style={styles.userImgFullnameAndEmailBlock}>
            <Image
              source={require("../../assets/peshraft-library/profile/profile-img.jpg")}
              style={styles.userImg}
            />
            <View style={styles.userFullnameAndEmailBlock}>
              <Text style={styles.userFullname}>Olim Yuldoshev</Text>
              <Text style={styles.userEmail}>oyuldoshev39@gmail.com</Text>
            </View>
          </View>

          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView
                contentContainerStyle={styles.formFeedbackScrollView}
                style={styles.formFeedback}
                showsVerticalScrollIndicator={false}
              >
                <Formik
                  initialValues={{
                    phoneNumber: "",
                    email: "",
                    review: "",
                  }}
                  validationSchema={FeedbackSchema}
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
                    <View style={styles.labelsAndInputs}>
                      {/* Phone Number */}
                      <View
                        style={[
                          styles.labelAndInput,
                          styles.labelAndInputNumberPhone,
                        ]}
                      >
                        <Text style={[styles.label, styles.labelNumberPhone]}>
                          {t("feedback.t2")}
                        </Text>

                        {/* Country Selector */}
                        {/* <View style={styles.countrySelectorContainer}>
                          <Selector
                            options={COUNTRIES_DATA}
                            selectedValue={selectedCountry}
                            onValueChange={(countryCode) =>
                              handleCountrySelect(countryCode, setFieldValue)
                            }
                            placeholder={t("feedback.t33")}
                            searchable={true}
                            primaryColor="#007AFF"
                            customArrow={
                              <Entypo
                                name="chevron-thin-down"
                                size={16}
                                color="#666"
                              />
                            }
                            searchPlaceholder=`${t("feedback.t34")}...`
                            textStyle={{ color: "#000", fontSize: 14 }}
                            style={styles.selectorStyle}
                            optionStyle={styles.optionStyle}
                            dropdownStyle={styles.dropdownStyle}
                            searchInputStyle={styles.searchInputStyle}
                            disabled={isSubmitting}
                          />
                        </View> */}

                        <View style={styles.phoneInputContainer}>
                          <TextInput
                            style={[
                              styles.input,
                              styles.inputNumberPhone,
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
                            placeholder="(+992) 90 123 45 67"
                            placeholderTextColor={"#6C6C6C"}
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
                        ) : null}

                        {/* {detectedOperator && (
                          <Text style={styles.operatorText}>
                            {t("feedback.t35")}: {detectedOperator}
                          </Text>
                        )} */}

                        {/* <Text style={styles.phoneHint}>
                          {selectedCountry === "tj"
                            ? t("feedback.t36")
                            : `${t("feedback.t37")}.`}
                        </Text> */}
                      </View>

                      {/* Email */}
                      <View
                        style={[
                          styles.labelAndInput,
                          styles.labelAndInputEmail,
                        ]}
                      >
                        <Text style={[styles.label, styles.labelEmail]}>
                          {t("feedback.t4")}
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            styles.inputEmail,
                            errors.email && touched.email && styles.inputError,
                            touched.email &&
                              !errors.email &&
                              styles.inputSuccess,
                          ]}
                          onChangeText={handleChange("email")}
                          onBlur={handleBlur("email")}
                          value={values.email}
                          placeholder={t("feedback.t5")}
                          placeholderTextColor={"#6C6C6C"}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          returnKeyType="next"
                          editable={!isSubmitting}
                        />
                        {errors.email && touched.email && (
                          <Text style={styles.errorText}>{errors.email}</Text>
                        )}
                      </View>

                      {/* Review */}
                      <View
                        style={[
                          styles.labelAndInput,
                          styles.labelAndInputReview,
                        ]}
                      >
                        <Text style={[styles.label, styles.labelReview]}>
                          {t("feedback.t6")}
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            styles.inputReview,
                            errors.review &&
                              touched.review &&
                              styles.inputError,
                            touched.review &&
                              !errors.review &&
                              styles.inputSuccess,
                          ]}
                          onChangeText={handleChange("review")}
                          onBlur={handleBlur("review")}
                          value={values.review}
                          placeholder={t("feedback.t7")}
                          multiline
                          numberOfLines={7}
                          textAlignVertical="top"
                          placeholderTextColor={"#CFCFCF"}
                          editable={!isSubmitting}
                        />

                        {/* Character counter */}
                        {values.review.length > 0 && (
                          <Text style={styles.charCounter}>
                            {values.review.length}/1000 t("feedback.t38")
                          </Text>
                        )}

                        {errors.review && touched.review ? (
                          <Text style={styles.errorText}>{errors.review}</Text>
                        ) : values.review.length > 0 &&
                          values.review.length < 20 ? (
                          <Text style={styles.warningText}>
                            {20 - values.review.length} t("feedback.t39")
                          </Text>
                        ) : null}
                      </View>

                      {/* Submit Button */}
                      <View style={styles.btnSubmitBlock}>
                        <Pressable
                          style={[
                            styles.btnSubmit,
                            (!isValid || !dirty || isSubmitting) &&
                              styles.btnSubmitDisabled,
                          ]}
                          onPress={() => handleSubmit()}
                          disabled={!isValid || !dirty || isSubmitting}
                        >
                          {isSubmitting ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.btnTextSubmit}>
                              {t("feedback.t8")}
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
    </View>
  );
};

export default Feedback;

const styles = StyleSheet.create({
  feedbackComponent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  feedbackComponentBlock: {
    flex: 1,
    padding: 10,
    paddingTop: 30,
  },
  headerFeedbackComponent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 81,
  },
  titleFeedbackComponent: {
    fontSize: 23,
    fontWeight: "400",
  },
  sectionFeedbackComponent: {
    flex: 1,
  },
  userImgFullnameAndEmailBlock: {
    justifyContent: "center",
    alignItems: "center",
  },
  userImg: {
    width: 120,
    height: 120,
    borderRadius: 100,
  },
  userFullnameAndEmailBlock: {
    marginTop: 10,
  },
  userFullname: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "500",
  },
  userEmail: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
    color: "#939393",
  },

  keyboardAvoidingView: {
    flex: 1,
  },

  formFeedbackScrollView: {
    // flex:1,
    paddingBottom: 50,
  },

  formFeedback: {
    marginTop: 18,
  },
  labelsAndInputs: {
    gap: 20,
  },
  labelAndInputNumberPhone: {},
  labelNumberPhone: {},
  inputNumberPhone: {},

  labelAndInputEmail: {},
  labelEmail: {},
  inputEmail: {
    backgroundColor: "#F9F9F9",
  },

  labelAndInputReview: {},
  labelReview: {},
  inputReview: {
    minHeight: 210,
    textAlignVertical: "top",
    paddingTop: 15,
  },

  // Styles with the same properties
  //////////////////////////////////////////////////////
  labelAndInput: {
    gap: 10,
  },
  label: {
    color: "#939393",
    fontSize: 18,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: "600",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: "#FF0000",
  },
  inputSuccess: {
    borderColor: "#34C759",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 14,
    marginTop: 2,
  },
  warningText: {
    color: "#FF9500",
    fontSize: 14,
    marginTop: 2,
    fontStyle: "italic",
  },
  //////////////////////////////////////////////////////

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
  charCounter: {
    textAlign: "right",
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  btnSubmitBlock: {
    marginTop: 20,
  },
  btnSubmit: {
    backgroundColor: "#00A9FF",
    borderRadius: 17,
    paddingVertical: 10,
  },
  btnSubmitDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  btnTextSubmit: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});