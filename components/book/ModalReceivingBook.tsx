import AntDesign from "@expo/vector-icons/AntDesign";
import { useNavigation } from "expo-router";
import React, { Dispatch, SetStateAction, useState } from "react";
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

  // ✅ NEW: loading state so the button shows a spinner while saving
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

  // Auto-fill form when modal opens
  React.useEffect(() => {
    if (modalReceivingBook) {
      setFormData(prev => ({
        ...prev,
        fullName: userProfile?.fullName || "User",
        jobTitle: "Member",
        bookName: book?.title || prev.bookName,
        author: book?.author || prev.author,
        receivingDate: getTodayString(), // ✅ auto-fill today
      }));
    }
  }, [modalReceivingBook]);

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

  // Validate date
  const isValidDate = (dateStr: string): boolean => {
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return false;

    const [day, month, year] = dateStr.split(".").map(Number);

    // Check if date is valid
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return false;
    }

    // Check if date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return false;
    }

    return true;
  };

  // Compare two dates
  const isDateAfter = (date1: string, date2: string): boolean => {
    if (!date1 || !date2) return true;

    const [day1, month1, year1] = date1.split(".").map(Number);
    const [day2, month2, year2] = date2.split(".").map(Number);

    const dateObj1 = new Date(year1, month1 - 1, day1);
    const dateObj2 = new Date(year2, month2 - 1, day2);

    return dateObj2 > dateObj1;
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
        return "";

      case "returningDate":
        if (!value || !value.trim()) return t("modalReceivingBook.t31");
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

  const handleInputChange = (name: string, value: string) => {
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
            { ...formData, [name]: formattedValue },
          );
          setErrors((prev) => ({ ...prev, returningDate: returningDateError }));
        }
      } else if (name === "returningDate") {
        if (touched.receivingDate) {
          const receivingDateError = validateField(
            "receivingDate",
            formData.receivingDate,
            { ...formData, [name]: formattedValue },
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
    // Force fill hidden fields before validating
    const updatedData = {
      ...formData,
      fullName: formData.fullName || userProfile?.fullName || "User",
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

    // ✅ FIXED: Actually send the request to Firebase!
    // Before this fix, the form just showed an alert and did nothing.
    // Now it saves to the "bookRequests" collection in Firestore.
    if (!currentUser || !userProfile) {
      Alert.alert("Error", "You must be logged in to request a book.");
      return;
    }

    if (!book?.id) {
      Alert.alert("Error", "Book information is missing. Please try again.");
      return;
    }

    try {
      setIsSubmitting(true); // show loading spinner on button

      await sendReceiveBookRequest({
        userId: userProfile.id,           // Firestore document ID of the user
        bookId: book.id,                  // Firestore document ID of the book
        bookTitle: updatedData.bookName,
        author: updatedData.author,
        userName: updatedData.fullName,
        phoneNumber: userProfile.phoneNumber || "",
        email: userProfile.email || currentUser.email || "",
        member_image_url: userProfile.member_image_url || "",
        borrowUntil: updatedData.returningDate,
      });

      // ✅ Success! Show alert then close
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
      // ✅ Show the real error message (e.g. "already has pending request")
      Alert.alert(
        "Request Failed",
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false); // always hide spinner
    }
  };

  const handleClose = () => {
    // Reset form when closing
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
                source={book?.image_url ? { uri: book.image_url } : require("../../assets/peshraft-library/home/tojikon.jpg")}
                style={styles.imgOfBook}
              />
              <View style={styles.nameAndAuthorOfBookBlock}>
                <Text style={styles.nameOfBook}>{book?.title || "Book"}</Text>
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
                {t("modalReceivingBook.t6")} <Text style={styles.requiredStar}>*</Text>
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
                {t("modalReceivingBook.t8")} <Text style={styles.requiredStar}>*</Text>
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
                placeholder={t("modalReceivingBook.t9")}
                placeholderTextColor="#999"
                maxLength={50}
              />
              {touched.author && errors.author && (
                <Text style={styles.errorText}>{errors.author}</Text>
              )}
            </View>

            {/* Receiving Date */}
            <View
              style={[
                styles.labelAndInputReceivingDateBlock,
                styles.labelAndInputBlock,
              ]}
            >
              <Text style={[styles.label, styles.labelReceivingDate]}>
                {t("modalReceivingBook.t10")} <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputReceivingDate,
                  { color: "#00A9FF" }, // blue = auto-filled, read-only
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

            {/* Returning Date */}
            <View
              style={[
                styles.labelAndInputReturningDateBlock,
                styles.labelAndInputBlock,
              ]}
            >
              <Text style={[styles.label, styles.labelReturningDate]}>
                {t("modalReceivingBook.t12")} <Text style={styles.requiredStar}>*</Text>
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
                placeholder={t("modalReceivingBook.t13")}
                placeholderTextColor="#999"
                maxLength={10}
              />
              {touched.returningDate && errors.returningDate && (
                <Text style={styles.errorText}>{errors.returningDate}</Text>
              )}
            </View>

            {/* Submit Button — shows spinner while saving */}
            <Pressable
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{t("modalReceivingBook.t14")}</Text>
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
    marginTop: 5,
  },
  imgOfBook: {
    width: 112,
    height: 200,
    resizeMode: "contain",
  },
  nameAndAuthorOfBookBlock: {},
  nameOfBook: {
    fontSize: 30,
    fontWeight: "500",
    textAlign: "center",
  },
  authorOfBook: {
    color: "#515151",
    fontSize: 20,
    fontWeight: "400",
    textAlign: "center",
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

  // Styles with the same properties and names
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