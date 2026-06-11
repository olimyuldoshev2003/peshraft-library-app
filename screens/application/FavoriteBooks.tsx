import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useNavigation, useFocusEffect } from "expo-router";
import React, { useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  RefreshControl,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useAppSelector } from "@/hooks/use-app-selector";
import { useAppDispatch } from "@/hooks/use-app-dispatch";
import { getAllBooks, getFavoriteBooks } from "@/api/api";

const { width: screenWidth } = Dimensions.get("window");

const FavoriteBooks = () => {
  const navigation: any = useNavigation();
  const dispatch = useAppDispatch();
  const { currentUser } = useAuth();

  // Get data from Redux store
  const favoriteBooksFromStore = useAppSelector(
    (state) => state.peshraftLibraryState.favoriteBooks,
  );
  const loadingFavoriteBooks = useAppSelector(
    (state) => state.peshraftLibraryState.loadingFavoriteBooks,
  );
  const allBooksFromStore = useAppSelector(
    (state) => state.peshraftLibraryState.allBooks,
  );
  const loadingAllBooks = useAppSelector(
    (state) => state.peshraftLibraryState.loadingAllBooks,
  );

  const [favoriteBooks, setFavoriteBooks] = React.useState<any[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  async function loadData() {
    if (!currentUser) return;
    try {
      // Dispatch Redux thunks
      await dispatch(getFavoriteBooks(currentUser.uid)).unwrap();
      await dispatch(getAllBooks({})).unwrap();
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  // Process favorite books whenever Redux data changes
  useEffect(() => {
    if (allBooksFromStore && favoriteBooksFromStore) {
      const favBookIds = favoriteBooksFromStore.map((f: any) => f.bookId);
      const favBookData = allBooksFromStore.filter((b: any) =>
        favBookIds.includes(b.id),
      );
      setFavoriteBooks(favBookData);
    }
  }, [allBooksFromStore, favoriteBooksFromStore]);

  // Load data when component mounts and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [currentUser]),
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [currentUser]);

  const { t } = useTranslation();

  // Determine if we should show loading indicator
  const isLoading = loadingFavoriteBooks || loadingAllBooks;

  return (
    <View style={styles.favoriteBooksComponent}>
      <View style={styles.favoriteBooksComponentBlock}>
        <View style={styles.headerFavoriteBooksComponent}>
          <Text style={styles.titleHeaderFavoriteBooksComponent}>
            {t("favoriteBooks.t1")}
          </Text>
        </View>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#00A9FF"]}
            />
          }
          contentContainerStyle={styles.favoriteBooksScrollView}
          style={styles.favoriteBooks}
          showsVerticalScrollIndicator={false}
        >
          {isLoading && (
            <ActivityIndicator
              size="large"
              color="#00A9FF"
              style={{ marginTop: 40 }}
            />
          )}
          {!isLoading && favoriteBooks.length === 0 && (
            <Text style={{ textAlign: "center", color: "#999", marginTop: 40 }}>
              {t("favoriteBooks.t4")}
            </Text>
          )}
          {!isLoading &&
            favoriteBooks.map((book: any) => (
              <Pressable
                key={book.id}
                onPress={() => {
                  navigation.navigate("Book", { id: book.id });
                }}
                style={styles.favoriteBookContainer}
              >
                <View style={styles.favoriteBookContainerBlock1}>
                  <Image
                    style={styles.favoriteBookImg}
                    source={
                      book.image_url
                        ? { uri: book.image_url }
                        : require("../../assets/peshraft-library/home/tojikon.jpg")
                    }
                  />
                </View>
                <View style={styles.favoriteBookContainerBlock2}>
                  <View style={styles.nameAuthorOfBookAndHeartIcon}>
                    <View style={styles.nameAndAuthorOfBook}>
                      <Text
                        style={styles.nameOfBook}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {book.title}
                      </Text>
                      <Text
                        style={styles.authorOfBook}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {book.author}
                      </Text>
                    </View>
                    <FontAwesome
                      name="heart"
                      size={20}
                      color="red"
                      style={styles.heartIcon}
                    />
                  </View>
                  <View style={styles.rateOfBookContainer}>
                    <View style={styles.rateOfBookBlock}>
                      <Entypo
                        name="star"
                        size={13}
                        color="orange"
                        style={styles.rateStarIcon}
                      />
                      <Text style={styles.rateInNumber}>
                        {book.rating || "0"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.numberOfReadersAndForwardIconBlock}>
                    <View style={styles.userIconNumberOfReadersAndTextBlock}>
                      <Feather
                        name="users"
                        size={24}
                        color="#939393"
                        style={styles.userIcon}
                      />
                      <View style={styles.numberAndTextReadersBlock}>
                        <Text style={styles.numberOfReaders}>
                          {book.readers || "0"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default FavoriteBooks;

const styles = StyleSheet.create({
  favoriteBooksComponent: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 30,
  },
  favoriteBooksComponentBlock: {},
  headerFavoriteBooksComponent: {},
  titleHeaderFavoriteBooksComponent: {
    fontSize: 25,
    fontWeight: "500",
  },
  sectionFavoriteBooksComponent: {},
  favoriteBooksScrollView: {
    gap: 22,
    paddingBottom: 50,
  },
  favoriteBooks: {
    paddingHorizontal: 5,
    paddingVertical: 10,
  },

  // Styles with the same names and properties
  ////////////////////////////////////////////
  favoriteBookContainer: {
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  favoriteBookContainerBlock1: {
    backgroundColor: "#F5EABD",
    padding: 20,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    width: 122,
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteBookImg: {
    width: 82,
    height: 118,
    resizeMode: "contain",
  },
  favoriteBookContainerBlock2: {
    padding: 10,
    flex: 1,
    justifyContent: "center",
  },
  nameAuthorOfBookAndHeartIcon: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  nameAndAuthorOfBook: {
    flex: 1,
    marginRight: 10,
  },
  nameOfBook: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  authorOfBook: {
    color: "#515151",
    fontSize: 14,
    fontWeight: "400",
  },
  heartIcon: {
    marginLeft: 10,
  },
  rateOfBookContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 12,
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
  rateInNumber: {
    fontSize: 12,
    fontWeight: "500",
  },

  numberOfReadersAndForwardIconBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    width: "100%",
  },
  userIconNumberOfReadersAndTextBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userIcon: {},
  numberAndTextReadersBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  numberOfReaders: {
    fontSize: 16,
    fontWeight: "700",
  },
  titleOfReaders: {
    fontSize: 12,
    fontWeight: "500",
    color: "#939393",
  },
  forwardIconBlock: {
    borderWidth: 1,
    borderRadius: 50,
    padding: 6,
  },
  forwardIcon: {},
  ////////////////////////////////////////////
});
