import ModalAddReview from "@/components/book/ModalAddReview";
import ModalReceivingBook from "@/components/book/ModalReceivingBook";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useNavigation, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  Dimensions,
} from "react-native";
import AboutBook from "./AboutBook";
import ReviewBook from "./ReviewBook";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useAppDispatch } from "@/hooks/use-app-dispatch";
import { useAppSelector } from "@/hooks/use-app-selector";
import {
  getBookById,
  toggleFavoriteBook,
  isBookFavorite,
  refreshFavoriteBooks,
} from "@/api/api";

const { width: screenWidth } = Dimensions.get("window");

const Book = ({ route }: { route: any }) => {
  const Tab = createMaterialTopTabNavigator();

  const dispatch = useAppDispatch();
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  // Get state from Redux
  const bookById = useAppSelector(
    (state: any) => state.peshraftLibraryState.bookById,
  );
  const loadingBookById = useAppSelector(
    (state: any) => state.peshraftLibraryState.loadingBookById,
  );

  const [isFavorite, setIsFavorite] = React.useState(false);

  // Support both 'id' and 'bookId' param names
  const bookId = route?.params?.id || route?.params?.bookId;

  // Load book data when component mounts or bookId changes
  useEffect(() => {
    if (bookId) {
      dispatch(getBookById(bookId));
    }
  }, [bookId, dispatch]);

  // Check favorite status when user or book changes
  const checkFavoriteStatus = useCallback(async () => {
    if (currentUser && bookId) {
      try {
        const favResult = await dispatch(
          isBookFavorite({ uid: currentUser.uid, bookId }),
        ).unwrap();
        setIsFavorite(favResult.isFavorite);
      } catch (error) {
        console.error("Error checking favorite:", error);
      }
    }
  }, [currentUser, bookId, dispatch]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  // Refresh favorite status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkFavoriteStatus();
    }, [checkFavoriteStatus]),
  );

  const handleToggleFavorite = async () => {
    if (!currentUser || !bookId) return;
    try {
      const result = await dispatch(
        toggleFavoriteBook({ uid: currentUser.uid, bookId }),
      ).unwrap();
      setIsFavorite(result.isFavorite);

      // Refresh favorite books list in the background
      if (currentUser?.uid) {
        await dispatch(refreshFavoriteBooks(currentUser.uid));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to toggle favorite");
      console.error(error);
    }
  };

  const navigation: any = useNavigation();
  const [modalAddReview, setModalAddReview] = useState<boolean>(false);
  const [modalReceivingBook, setModalReceivingBook] = useState<boolean>(false);

  if (loadingBookById) {
    return (
      <View
        style={[
          styles.bookComponent,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#00A9FF" />
      </View>
    );
  }

  // Truncate long text
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <View style={styles.bookComponent}>
      <View style={styles.bookComponentBlock}>
        <View style={styles.headerBookComponent}>
          <ImageBackground
            source={
              bookById?.bg_image_url
                ? { uri: bookById.bg_image_url }
                : require("../../assets/peshraft-library/book/imgBg.jpg")
            }
            blurRadius={10}
            style={styles.imgBgHeaderBookComponent}
          >
            <Pressable style={styles.btnBackIcon}>
              <Ionicons
                name="arrow-back-circle-outline"
                size={30}
                color="black"
                style={styles.backIcon}
                onPress={() => navigation.goBack()}
              />
            </Pressable>
            <Pressable
              style={styles.btnAddToFavorite}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={30}
                color={isFavorite ? "red" : "black"}
                style={styles.heartIcon}
              />
            </Pressable>
            <View style={styles.nameAuthorAndImgOfBook}>
              <Text
                style={styles.nameOfBook}
                numberOfLines={3}
                adjustsFontSizeToFit
              >
                {bookById?.title || ""}
              </Text>
              <Text
                style={styles.authorOfBook}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {bookById?.author || ""}
              </Text>
              <View style={styles.imgOfBookBlock}>
                <Image
                  source={
                    bookById?.image_url
                      ? { uri: bookById.image_url }
                      : require("../../assets/peshraft-library/home/tojikon.jpg")
                  }
                  style={styles.imgOfBook}
                />
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.sectionBookComponent}>
          <View style={styles.ratingGenreAndPageAmountOfBookContainer}>
            <View style={styles.ratingGenreAndPageAmountOfBookBlock}>
              <View style={styles.rateOfBookBlock}>
                <Entypo
                  name="star"
                  size={18}
                  color="orange"
                  style={styles.rateStarIcon}
                />
                <Text style={styles.rateInNumber}>
                  {bookById?.rating || "0"}
                </Text>
              </View>
              <Text
                style={styles.genreOfBook}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {bookById?.category || ""}
              </Text>
              <Text style={styles.pageAmountOfBook}>
                {bookById?.book_page || bookById?.bookPage || "0"}{" "}
                {t("book.t2")}
              </Text>
            </View>
          </View>

          <View style={styles.tabContainer}>
            <Tab.Navigator
              screenOptions={{
                tabBarActiveTintColor: "#00A9FF",
                tabBarInactiveTintColor: "#515151",
                tabBarIndicatorStyle: { backgroundColor: "#00A9FF", height: 3 },
                tabBarLabelStyle: { fontSize: 14, fontWeight: "600" },
                swipeEnabled: false,
              }}
            >
              <Tab.Screen
                name="AboutBook"
                options={{
                  title: t("book.t3"),
                }}
              >
                {(props) => <AboutBook {...props} bookId={bookId} />}
              </Tab.Screen>
              <Tab.Screen name="ReviewBook" options={{ title: t("book.t4") }}>
                {(props) => (
                  <ReviewBook
                    {...props}
                    bookId={bookId}
                    setModalAddReview={setModalAddReview}
                  />
                )}
              </Tab.Screen>
            </Tab.Navigator>
          </View>
        </View>

        <View style={styles.footerBookComponent}>
          <Pressable
            style={styles.btnOpenModalReceiveBook}
            onPress={() => setModalReceivingBook(true)}
          >
            <Text style={styles.btnTextOpenModalReceiveBook}>
              {t("book.t5")}
            </Text>
          </Pressable>
        </View>

        <ModalAddReview
          modalAddReview={modalAddReview}
          setModalAddReview={setModalAddReview}
          bookId={bookId}
          book={bookById}
          onReviewAdded={() => {
            dispatch(getBookById(bookId));
          }}
        />
        <ModalReceivingBook
          modalReceivingBook={modalReceivingBook}
          setModalReceivingBook={setModalReceivingBook}
          book={bookById}
        />
      </View>
    </View>
  );
};

export default Book;

const styles = StyleSheet.create({
  bookComponent: { flex: 1, backgroundColor: "#fff" },
  bookComponentBlock: { flex: 1, paddingBottom: 46 },
  headerBookComponent: {},
  imgBgHeaderBookComponent: {
    width: "100%",
    height: 380,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  btnBackIcon: {
    position: "absolute",
    top: 30,
    left: 20,
    backgroundColor: "white",
    borderRadius: 100,
    padding: 8,
  },
  backIcon: {},
  btnAddToFavorite: {
    position: "absolute",
    top: 30,
    right: 20,
    backgroundColor: "white",
    borderRadius: 100,
    padding: 8,
  },
  heartIcon: {},
  nameAuthorAndImgOfBook: {
    alignItems: "center",
    paddingHorizontal: 60,
  },
  nameOfBook: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    color: "#000",
    maxWidth: screenWidth - 120,
  },
  authorOfBook: {
    fontSize: 14,
    fontWeight: "400",
    color: "#515151",
    textAlign: "center",
    marginTop: 5,
    maxWidth: screenWidth - 120,
  },
  imgOfBookBlock: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  imgOfBook: { width: 100, height: 160, resizeMode: "contain" },
  sectionBookComponent: { flex: 1 },
  tabContainer: { flex: 1 },
  ratingGenreAndPageAmountOfBookContainer: {
    flexDirection: "row",
    justifyContent: "center",
    top: -20,
    paddingHorizontal: 10,
  },
  ratingGenreAndPageAmountOfBookBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
    backgroundColor: "#fff",
    borderRadius: 12,
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    width: "95%",
    flexWrap: "wrap",
  },
  rateOfBookBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF8E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rateStarIcon: {},
  rateInNumber: { fontSize: 16, fontWeight: "600" },
  genreOfBook: {
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#E2FCFB",
    borderRadius: 10,
    maxWidth: 130,
    textAlign: "center",
  },
  pageAmountOfBook: {
    fontSize: 14,
    fontWeight: "400",
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
  },
  footerBookComponent: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    alignItems: "center",
  },
  btnOpenModalReceiveBook: {
    borderRadius: 12,
    backgroundColor: "#00A9FF",
    paddingVertical: 9,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  btnTextOpenModalReceiveBook: {
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
});
