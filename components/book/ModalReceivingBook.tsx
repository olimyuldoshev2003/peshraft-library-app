import AntDesign from "@expo/vector-icons/AntDesign";
import { useNavigation } from "expo-router";
import React, { Dispatch, SetStateAction, useState, useEffect } from "react";
import { sendReceiveBookRequest } from "@/firebase/mobile.services";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  GestureResponderEvent,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";

interface FormData {
  fullName: string;
  jobTitle: string;
  bookName: string;
  author: string;
  receivingDate: string;
  returningDate: string;
}

interface FormErrors {
  fullName?: string;
  jobTitle?: string;
  bookName?: string;
  author?: string;
  receivingDate?: string;
  returningDate?: string;
}

const { width: screenWidth } = Dimensions.get("window");

const ModalReceivingBook = ({
  modalReceivingBook,
  setModalReceivingBook,
  book,
}: {
  modalReceivingBook: boolean;
  setModalReceivingBook: Dispatch<SetStateAction<boolean>>;
  book?: any;
  }) => {
  const navigation: any = useNavigation();
  const { t } = useTranslation();
  const { currentUser, userProfile } = useAuth();

  // loading state so the button shows a spinner while saving
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    jobTitle: "Member",
    bookName: "",
    author: "",
    receivingDate: "",
    returningDate: "",
  });

  // Helper to get today as DD.MM.YYYY
  const getTodayString = (): string => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    return `${d}.${m}.${y}`;
  };

  // Auto-fill form when modal opens - returning date is NOT auto-filled
  useEffect(() => {
    if (modalReceivingBook) {
      const today = getTodayString();

      setFormData((prev) => ({
        ...prev,
        fullName: userProfile?.fullName || currentUser?.displayName || "User",
        jobTitle: "Member",
        bookName: book?.title || prev.bookName,
        author: book?.author || prev.author,
        receivingDate: today,
        returningDate: "", // Empty - user must enter manually
      }));
    }
  }, [modalReceivingBook, currentUser, userProfile, book]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Helper function to format date input
  const formatDateInput = (text: string, previousText: string): string => {
    // Remove non-digits
    const cleaned = text.replace(/\D/g, "");

    // Format as DD.MM.YYYY
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    } else if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 4)}.${cleaned.slice(4)}`;
    }
    return previousText;
  };

  // Parse date string "DD.MM.YYYY" to Date object
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return null;
    const [day, month, year] = dateStr.split(".").map(Number);
    const date = new Date(year, month - 1, day);
    // Check if date is valid
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  };

  // Validate date format and that it's not in the past
  const isValidDate = (
    dateStr: string,
    allowPast: boolean = false,
  ): boolean => {
    const date = parseDate(dateStr);
    if (!date) return false;

    // Check if date is not in the past (unless allowed)
    if (!allowPast) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return false;
      }
    }

    return true;
  };

  // Compare two dates: returns true if date2 is after date1
  const isDateAfter = (date1: string, date2: string): boolean => {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);
    if (!d1 || !d2) return true;
    return d2 > d1;
  };

  // Check if dates are the same
  const isSameDate = (date1: string, date2: string): boolean => {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);
    if (!d1 || !d2) return false;
    return d1.getTime() === d2.getTime();
  };

  // Get difference in days between two dates
  const getDaysDifference = (date1: string, date2: string): number => {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);
    if (!d1 || !d2) return 0;
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  const validateField = (
    name: string,
    value: string,
    allData?: FormData,
  ): string => {
    const data = allData || formData;

    switch (name) {
      case "fullName":
        // Auto-filled, skip validation
        return "";

      case "jobTitle":
        // Auto-filled, skip validation
        return "";

      case "bookName":
        if (!value || !value.trim()) return t("modalReceivingBook.t22");
        return "";

      case "author":
        if (!value || !value.trim()) return t("modalReceivingBook.t25");
        return "";

      case "receivingDate":
        if (!value || !value.trim()) return t("modalReceivingBook.t28");
        if (!isValidDate(value, false))
          return t("modalReceivingBook.t37");
        return "";

      case "returningDate":
        if (!value || !value.trim()) return t("modalReceivingBook.t31");
        if (!isValidDate(value, false))
          return t("modalReceivingBook.t37");

        // Validate that returning date is after receiving date
        if (data.receivingDate) {
          if (!isValidDate(data.receivingDate, false)) {
            return t("modalReceivingBook.t38");
          }

          if (isSameDate(value, data.receivingDate)) {
            return t("modalReceivingBook.t39");
          }

          if (!isDateAfter(data.receivingDate, value)) {
            return t("modalReceivingBook.t39");
          }

          // Maximum borrow period validation (e.g., 30 days max)
          const daysDifference = getDaysDifference(data.receivingDate, value);
          if (daysDifference > 30) {
            return t("modalReceivingBook.t40");
          }
          if (daysDifference < 1) {
            return t("modalReceivingBook.t41");
          }
        }
        return "";

      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(
        key,
        formData[key as keyof FormData],
        formData,
      );
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (name: any, value: string) => {
    let formattedValue = value;

    // Apply formatting for date fields
    if (name === "receivingDate" || name === "returningDate") {
      formattedValue = formatDateInput(
        value,
        formData[name as keyof FormData] as string,
      );
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    // Validate field if it has been touched
    if (touched[name]) {
      const error = validateField(name, formattedValue, {
        ...formData,
        [name]: formattedValue,
      });
      setErrors((prev) => ({ ...prev, [name]: error }));

      // Revalidate related fields (for date comparisons)
      if (name === "receivingDate") {
        if (touched.returningDate) {
          const returningDateError = validateField(
            "returningDate",
            formData.returningDate,
            {
              ...formData,
              receivingDate: formattedValue,
              [name]: formattedValue,
            },
          );
          setErrors((prev) => ({ ...prev, returningDate: returningDateError }));
        }
      } else if (name === "returningDate") {
        if (touched.receivingDate) {
          const receivingDateError = validateField(
            "receivingDate",
            formData.receivingDate,
            {
              ...formData,
              returningDate: formattedValue,
              [name]: formattedValue,
            },
          );
          setErrors((prev) => ({ ...prev, receivingDate: receivingDateError }));
        }
      }
    }
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(
      name,
      formData[name as keyof FormData],
      formData,
    );
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      jobTitle: "",
      bookName: "",
      author: "",
      receivingDate: "",
      returningDate: "",
    });
    setErrors({});
    setTouched({});
  };

  const handleSubmit = async () => {
    // Double-check authentication before submitting
    if (!currentUser || !userProfile) {
      Alert.alert(
        t("modalReceivingBook.t42"),
        `${t("modalReceivingBook.t43")}.`,
        [
          {
            text: "OK",
            onPress: () => {
              setModalReceivingBook(false);
              navigation.navigate("Login");
            },
          },
        ],
      );
      return;
    }

    // Force fill hidden fields before validating
    const updatedData = {
      ...formData,
      fullName:
        formData.fullName ||
        userProfile?.fullName ||
        currentUser?.displayName ||
        "User",
      jobTitle: formData.jobTitle || "Member",
      bookName: formData.bookName || book?.title || "",
      author: formData.author || book?.author || "",
    };
    setFormData(updatedData);

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce(
      (acc, key) => {
        acc[key] = true;
        return acc;
      },
      {} as { [key: string]: boolean },
    );
    setTouched(allTouched);

    if (!validateForm()) {
      Alert.alert(t("modalReceivingBook.t35"), t("modalReceivingBook.t36"));
      return;
    }

    if (!book?.id) {
      Alert.alert(t("modalReceivingBook.t35"), `${t("modalReceivingBook.t44")}.`);
      return;
    }

    try {
      setIsSubmitting(true);

      await sendReceiveBookRequest({
        userId: userProfile.id,
        bookId: book.id,
        bookTitle: updatedData.bookName,
        author: updatedData.author,
        userName: updatedData.fullName,
        phoneNumber: userProfile.phoneNumber || "",
        email: userProfile.email || currentUser.email || "",
        member_image_url: userProfile.member_image_url || "",
        borrowUntil: updatedData.returningDate,
      });

      // Success! Show alert then close
      Alert.alert(t("modalReceivingBook.t33"), t("modalReceivingBook.t34"), [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            setModalReceivingBook(false);
            navigation.navigate("Home");
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        t("modalReceivingBook.t45"),
        error.message || `${t("modalReceivingBook.t46")}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setModalReceivingBook(false);
  };

  return (
    <Modal
      visible={modalReceivingBook}
      style={styles.modalReceivingBookComponent}
      animationType="slide"
      transparent={true}
    >
      <Pressable style={styles.overlayModalReceivingBook} onPress={handleClose}>
        <Pressable
          style={styles.modalReceivingBookMainBlock}
          onPress={(event: GestureResponderEvent) => {
            event.stopPropagation();
          }}
        >
          <View style={styles.headerModalReceivingBook}>
            <View
              style={styles.closeModalIconAndTitleModalReceivingBookComponent}
            >
              <AntDesign
                style={styles.closeModalReceivingBookIcon}
                name="close"
                size={25}
                color="black"
                onPress={handleClose}
              />
              <Text style={styles.titleModalReceivingBookComponent}>
                {t("modalReceivingBook.t1")}
              </Text>
              <View></View>
            </View>
            <View style={styles.imgNameAndAuthorOfThisBookBlock}>
              <Image
                source={
                  book?.image_url
                    ? { uri: book.image_url }
                    : require("../../assets/peshraft-library/home/tojikon.jpg")
                }
                style={styles.imgOfBook}
              />
              <View style={styles.nameAndAuthorOfBookBlock}>
                <Text style={styles.nameOfBook}>{book?.title || ""}</Text>
                <Text style={styles.authorOfBook}>{book?.author || ""}</Text>
              </View>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.sectionModalReceivingBookScrollView}
            style={styles.sectionModalReceivingBook}
            showsVerticalScrollIndicator={false}
          >
            {/* Book name */}
            <View
              style={[
                styles.labelAndInputBookNameBlock,
                styles.labelAndInputBlock,
              ]}
            >
              <Text style={[styles.label, styles.labelBookName]}>
                {t("modalReceivingBook.t6")}{" "}
                <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputBookName,
                  touched.bookName && errors.bookName && styles.inputError,
                ]}
                value={formData.bookName}
                onChangeText={(text) => handleInputChange("bookName", text)}
                onBlur={() => handleBlur("bookName")}
                editable={false}
                placeholder={t("modalReceivingBook.t7")}
                placeholderTextColor="#999"
                maxLength={100}
              />
              {touched.bookName && errors.bookName && (
                <Text style={styles.errorText}>{errors.bookName}</Text>
              )}
            </View>

            {/* Author */}
            <View
              style={[
                styles.labelAndInputAuthorBlock,
                styles.labelAndInputBlock,
              ]}
            >
              <Text style={[styles.label, styles.labelAuthor]}>
                {t("modalReceivingBook.t8")}{" "}
                <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputAuthor,
                  touched.author && errors.author && styles.inputError,
                ]}
                value={formData.author}
                onChangeText={(text) => handleInputChange("author", text)}
                onBlur={() => handleBlur("author")}
                editable={false}
                placeholder={t("modalReceivingBook.t9")}
                placeholderTextColor="#999"
                maxLength={50}
              />
              {touched.author && errors.author && (
                <Text style={styles.errorText}>{errors.author}</Text>
              )}
            </View>

            {/* Receiving Date - Auto-filled, read-only */}
            <View
              style={[
                styles.labelAndInputReceivingDateBlock,
                styles.labelAndInputBlock,
              ]}
            >
              <Text style={[styles.label, styles.labelReceivingDate]}>
                {t("modalReceivingBook.t10")}{" "}
                <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputReceivingDate,
                  touched.receivingDate &&
                    errors.receivingDate &&
                    styles.inputError,
                  { color: "#00A9FF" },
                ]}
                keyboardType="numeric"
                value={formData.receivingDate}
                editable={false}
                placeholder={t("modalReceivingBook.t11")}
                placeholderTextColor="#999"
                maxLength={10}
              />
              {touched.receivingDate && errors.receivingDate && (
                <Text style={styles.errorText}>{errors.receivingDate}</Text>
              )}
            </View>

            {/* Returning Date - User must enter manually */}
            <View
              style={[
                styles.labelAndInputReturningDateBlock,
                styles.labelAndInputBlock,
              ]}
            >
              <Text style={[styles.label, styles.labelReturningDate]}>
                {t("modalReceivingBook.t12")}{" "}
                <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputReturningDate,
                  touched.returningDate &&
                    errors.returningDate &&
                    styles.inputError,
                ]}
                keyboardType="numeric"
                value={formData.returningDate}
                onChangeText={(text) =>
                  handleInputChange("returningDate", text)
                }
                onBlur={() => handleBlur("returningDate")}
                placeholder="DD.MM.YYYY"
                placeholderTextColor="#999"
                maxLength={10}
              />
              {touched.returningDate && errors.returningDate && (
                <Text style={styles.errorText}>{errors.returningDate}</Text>
              )}
            </View>

            {/* Submit Button */}
            <Pressable
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("modalReceivingBook.t14")}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ModalReceivingBook;

const styles = StyleSheet.create({
  modalReceivingBookComponent: {},
  overlayModalReceivingBook: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalReceivingBookMainBlock: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#fff",
  },
  headerModalReceivingBook: {
    backgroundColor: "#DDEEFE",
    paddingVertical: 20,
  },
  closeModalIconAndTitleModalReceivingBookComponent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  closeModalReceivingBookIcon: {},
  titleModalReceivingBookComponent: {
    fontSize: 23,
    fontWeight: "600",
  },
  imgNameAndAuthorOfThisBookBlock: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 30,
    marginTop: 20,
  },
  imgOfBook: {
    width: 100,
    height: 160,
    resizeMode: "contain",
  },
  nameAndAuthorOfBookBlock: {},
  nameOfBook: {
    fontSize: 20,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: screenWidth - 120,
  },
  authorOfBook: {
    color: "#515151",
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    maxWidth: screenWidth - 120,
  },

  sectionModalReceivingBookScrollView: {
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 15,
    paddingBottom: 30,
  },
  sectionModalReceivingBook: {
    flex: 1,
  },

  labelAndInputFullNameBlock: {},
  labelFullName: {},
  inputFullName: {},

  labelAndInputJobTitleBlock: {},
  labelJobTitle: {},
  inputJobTitle: {},

  labelAndInputBookNameBlock: {},
  labelBookName: {},
  inputBookName: {},

  labelAndInputAuthorBlock: {},
  labelAuthor: {},
  inputAuthor: {},

  labelAndInputReceivingDateBlock: {},
  labelReceivingDate: {},
  inputReceivingDate: {},

  labelAndInputReturningDateBlock: {},
  labelReturningDate: {},
  inputReturningDate: {},

  labelAndInputBlock: {
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: 3,
    color: "#646464",
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    fontSize: 18,
    fontWeight: "500",
    paddingVertical: 8,
    paddingBottom: 5,
    height: 45,
    color: "#646464",
  },
  requiredStar: {
    color: "red",
    fontSize: 14,
  },
  inputError: {
    borderBottomColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: "#00A9FF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonDisabled: {
    backgroundColor: "#7fcfef",
  },
  submitButtonText: {
    fontSize: 23,
    fontWeight: "600",
    color: "#fff",
  },
});
