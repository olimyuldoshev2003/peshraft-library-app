import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { Dispatch, SetStateAction, useState } from "react";
import { Alert, Dimensions } from "react-native";
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
} from "react-native";

// @ts-ignore
import Stars from "react-native-stars";
import { addBookReview } from "@/api/api";
import { useAppDispatch } from "@/hooks/use-app-dispatch";


const { width: screenWidth } = Dimensions.get("window");

const ModalAddReview = ({
  modalAddReview,
  setModalAddReview,
  bookId,
  book,
  onReviewAdded,
}: {
  modalAddReview: boolean;
  setModalAddReview: Dispatch<SetStateAction<boolean>>;
  bookId?: string;
  book?: any;
  onReviewAdded?: () => void;
}) => {
  const dispatch = useAppDispatch();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewCategory, setReviewCategory] = useState("Interesting");
  const [submitting, setSubmitting] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const { t } = useTranslation();

  const validateReviewData = () => {
    // Validate rating
    if (rating === 0) {
      Alert.alert(t("modalAddReview.t9"), t("modalAddReview.t10"));
      return false;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert(t("modalAddReview.t9"), t("modalAddReview.t13"));
      return false;
    }

    // Validate review text
    if (!reviewText.trim()) {
      Alert.alert(t("modalAddReview.t9"), t("modalAddReview.t11"));
      return false;
    }

    if (reviewText.trim().length < 10) {
      Alert.alert(t("modalAddReview.t9"), t("modalAddReview.t14"));
      return false;
    }

    if (reviewText.trim().length > 1000) {
      Alert.alert(t("modalAddReview.t9"), t("modalAddReview.t15"));
      return false;
    }

    // Validate bookId
    if (!bookId || bookId.trim() === "") {
      Alert.alert(t("modalAddReview.t9"), t("modalAddReview.t12"));
      return false;
    }

    // Validate currentUser
    if (!currentUser) {
      Alert.alert(t("modalAddReview.t9"), t("modalAddReview.t16"));
      return false;
    }

    if (!currentUser.uid || currentUser.uid.trim() === "") {
      Alert.alert(t("modalAddReview.t9"), `${t("modalAddReview.t17")}.`);
      return false;
    }

    // Validate userName
    const userName =
      userProfile?.fullName?.trim() || currentUser.email?.trim() || "";
    if (!userName) {
      Alert.alert(t("modalAddReview.t9"), `${t("modalAddReview.t18")}.`);
      return false;
    }

    if (userName.length < 2) {
      Alert.alert(
        t("modalAddReview.t9"),
        t("modalAddReview.t19"),
      );
      return false;
    }
    
    if (userName.length > 100) {
      Alert.alert(
        t("modalAddReview.t9"),
        t("modalAddReview.t20"),
      );
      return false;
    }

    // Validate review_category
    const validCategories = [
      "Interesting",
      "Helpful",
      "Critical",
      "Amazing",
      "Boring",
    ];
    if (!reviewCategory || !validCategories.includes(reviewCategory)) {
      Alert.alert(
        t("modalAddReview.t9"),
        t("modalAddReview.t21"),
      );
      return false;
    }

    return true;
  };

  const sanitizeReviewText = (text: string) => {
    return text
      .trim()
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .slice(0, 1000); // Limit length
  };

  const handleSubmit = async () => {
    // Run all validations
    if (!validateReviewData()) {
      return;
    }

    setSubmitting(true);

    try {
      // Sanitize the review text
      const sanitizedReview = sanitizeReviewText(reviewText);
      const userName = (
        userProfile?.fullName?.trim() ||
        currentUser?.email?.trim() ||
        "User"
      ).slice(0, 100);
      const memberImageUrl = userProfile?.member_image_url?.trim() || "";

      const reviewData = {
        bookId: bookId!.trim(),
        uid: currentUser!.uid.trim(),
        userName: userName,
        member_image_url: memberImageUrl,
        rating: Math.floor(rating), // Ensure integer
        review: sanitizedReview,
        review_category: reviewCategory,
      };

      // Additional data validation before sending
      if (!reviewData.bookId || !reviewData.uid || !reviewData.userName) {
        throw new Error(t("modalAddReview.t22"));
      }

      await dispatch(addBookReview(reviewData));

      Alert.alert(t("modalAddReview.t23"), `${t("modalAddReview.t24")}!`);

      // Reset form
      setReviewText("");
      setRating(0);
      setReviewCategory("Interesting");
      setModalAddReview(false);
      onReviewAdded?.();
    } catch (err: any) {
      console.error("Review submission error:", err);
      Alert.alert(
        t("modalAddReview.t9"),
        err?.message || `${t("modalAddReview.t25")}.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingChange = (val: number) => {
    // Ensure rating is between 0 and 5
    const newRating = Math.min(5, Math.max(0, val));
    setRating(newRating);
  };

  const handleReviewTextChange = (text: string) => {
    // Limit text length in real-time
    if (text.length <= 1000) {
      setReviewText(text);
    } else {
      Alert.alert(t("modalAddReview.t26"), t("modalAddReview.t27"));
    }
  };

  return (
    <Modal
      visible={modalAddReview}
      style={styles.modalAddReviewComponent}
      animationType="slide"
      transparent={true}
    >
      <Pressable
        style={styles.overlayModalAddReview}
        onPress={() => {
          if (!submitting) {
            setModalAddReview(false);
          }
        }}
      >
        <Pressable
          style={styles.modalAddReviewMainBlock}
          onPress={(event: GestureResponderEvent) => {
            event.stopPropagation();
          }}
        >
          <View style={styles.headerModalAddReview}>
            <AntDesign
              style={styles.closeModalAddReviewIcon}
              name="close"
              size={30}
              color="black"
              onPress={() => {
                if (!submitting) {
                  setModalAddReview(false);
                }
              }}
            />
            <Text style={styles.titleModalAddReviewComponent}>
              {t("modalAddReview.t1")}
            </Text>
            <View></View>
          </View>
          <ScrollView
            contentContainerStyle={styles.sectionModalAddReviewScrollView}
            style={styles.sectionModalAddReview}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.imgNameAndAuthorOfThisBookAndBtnNovelBlock}>
              <Image
                source={
                  book?.image_url
                    ? { uri: book.image_url }
                    : require("../../assets/peshraft-library/home/tojikon.jpg")
                }
                style={styles.imgOfBook}
              />
              <View style={styles.nameAndAuthorOfBookAndBtnNovelBlock}>
                <Text style={styles.nameOfBook}>{book?.title || ""}</Text>
                <Text style={styles.authorOfBook}>{book?.author || ""}</Text>
              </View>
            </View>
            <View style={styles.ratingAndLabelInpReviewBlock}>
              <View style={styles.ratingBlock}>
                <Text style={styles.ratingTitle}>{t("modalAddReview.t2")}</Text>
                <Stars
                  default={rating}
                  count={5}
                  starSize={50}
                  fullStar={<Entypo name="star" size={43} color="#FCC400" />}
                  emptyStar={<Entypo name="star" size={43} color="#D9D9D9" />}
                  halfStar={
                    <Ionicons name="star-half" size={43} color="#FCC400" />
                  }
                  update={handleRatingChange}
                />
              </View>
              <View style={styles.labelAndInpReviewBlock}>
                <Text style={styles.labelReview}>{t("modalAddReview.t3")}</Text>
                <TextInput
                  style={styles.inpReview}
                  placeholder={t("modalAddReview.t4")}
                  placeholderTextColor={"#CFCFCF"}
                  textAlignVertical="top"
                  numberOfLines={8}
                  multiline
                  value={reviewText}
                  onChangeText={handleReviewTextChange}
                  maxLength={1000}
                  editable={!submitting}
                />
                <Text style={styles.characterCount}>
                  {reviewText.length}/1000 characters
                </Text>
              </View>
            </View>
            <View style={styles.btnSubmitBlock}>
              <Pressable
                style={[
                  styles.btnSubmit,
                  submitting && styles.btnSubmitDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.btnTextSubmit}>
                  {submitting ? "Sending..." : t("modalAddReview.t5")}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ModalAddReview;

const styles = StyleSheet.create({
  modalAddReviewComponent: {},
  overlayModalAddReview: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalAddReviewMainBlock: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#fff",
    padding: 15,
    paddingTop: 20,
  },
  headerModalAddReview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
  },
  closeModalAddReviewIcon: {},
  titleModalAddReviewComponent: {
    fontSize: 26,
    fontWeight: "600",
  },
  deleteIconModalAddReviewComponent: {},
  sectionModalAddReviewScrollView: {
    paddingHorizontal: 6,
    paddingTop: 20,
    paddingBottom: 15,
  },
  sectionModalAddReview: {},
  imgNameAndAuthorOfThisBookAndBtnNovelBlock: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 30,
  },
  imgOfBook: {
    width: 100,
    height: 160,
    resizeMode: "contain",
  },
  nameAndAuthorOfBookAndBtnNovelBlock: {},
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
  btnNovel: {
    backgroundColor: "#D9D9D9",
    borderRadius: 9,
    paddingVertical: 10,
    marginTop: 10,
  },
  btnTextNovel: {
    textAlign: "center",
    color: "#fff",
    fontSize: 22,
  },
  ratingAndLabelInpReviewBlock: {
    marginTop: 25,
  },
  ratingBlock: {},
  ratingTitle: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "500",
    color: "#939393",
  },
  labelAndInpReviewBlock: {
    marginTop: 25,
  },
  labelReview: {
    color: "#939393",
    fontSize: 22,
    fontWeight: "500",
  },
  inpReview: {
    fontSize: 22,
    fontWeight: "400",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
    backgroundColor: "#fff",
    marginTop: 10,
    width: "100%",
    height: 230,
    textAlignVertical: "top",
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  characterCount: {
    textAlign: "right",
    fontSize: 14,
    color: "#939393",
    marginTop: 5,
  },
  btnSubmitBlock: {
    marginTop: 30,
  },
  btnSubmit: {
    backgroundColor: "#00A9FF",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnSubmitDisabled: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },
  btnTextSubmit: {
    color: "#fff",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
  },
});
