import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useNavigation } from "expo-router";
import React from "react";
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
} from "react-native";

import { getFavoriteBooks, getAllBooks } from "@/firebase/mobile.services";
import { useAuth } from "@/context/AuthContext";

const FavoriteBooks = () => {
  const navigation: any = useNavigation();
  const { currentUser } = useAuth();
  const [favoriteBooks, setFavoriteBooks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [refreshing, setRefreshing] = React.useState(false);

  async function loadData() {
    if (!currentUser) return;
    setLoading(true);
    const favs = await getFavoriteBooks(currentUser!.uid);
    const allBooks = await getAllBooks();
    const favBookIds = favs.map((f: any) => f.bookId);
    const favBookData = allBooks.filter((b: any) => favBookIds.includes(b.id));
    setFavoriteBooks(favBookData);
    setLoading(false);
  }

  React.useEffect(() => { loadData(); }, [currentUser]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try { await loadData(); } catch (e) {}
    setRefreshing(false);
  }, [currentUser]);
  const {t} = useTranslation()

  return (
    <View style={styles.favoriteBooksComponent}>
      <View style={styles.favoriteBooksComponentBlock}>
        <View style={styles.headerFavoriteBooksComponent}>
          <Text style={styles.titleHeaderFavoriteBooksComponent}>
            {t("favoriteBooks.t1")}
          </Text>
        </View>
        <ScrollView
refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00A9FF"]} />}
                    contentContainerStyle={styles.favoriteBooksScrollView}
          style={styles.favoriteBooks}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <ActivityIndicator size="large" color="#00A9FF" style={{ marginTop: 40 }} />
          )}
          {!loading && favoriteBooks.length === 0 && (
            <Text style={{ textAlign: "center", color: "#999", marginTop: 40 }}>No favorite books yet</Text>
          )}
          {favoriteBooks.map((book: any) => (
            <Pressable key={book.id} onPress={() => { navigation.navigate("Book", { id: book.id }); }} style={styles.favoriteBookContainer}>
              <View style={styles.favoriteBookContainerBlock1}>
                <Image
                  style={styles.favoriteBookImg}
                  source={book.image_url ? { uri: book.image_url } : require("../../assets/peshraft-library/home/tojikon.jpg")}
                />
              </View>
              <View style={styles.favoriteBookContainerBlock2}>
                <View style={styles.nameAuthorOfBookAndHeartIcon}>
                  <View style={styles.nameAndAuthorOfBook}>
                    <Text style={styles.nameOfBook}>{book.title}</Text>
                    <Text style={styles.authorOfBook}>{book.author}</Text>
                  </View>
                  <FontAwesome name="heart" size={20} color="red" style={styles.heartIcon} />
                </View>
                <View style={styles.rateOfBookContainer}>
                  <View style={styles.rateOfBookBlock}>
                    <Entypo name="star" size={13} color="orange" style={styles.rateStarIcon} />
                    <Text style={styles.rateInNumber}>{book.rating || "0"}</Text>
                  </View>
                </View>
                <View style={styles.numberOfReadersAndForwardIconBlock}>
                  <View style={styles.userIconNumberOfReadersAndTextBlock}>
                    <Feather name="users" size={24} color="#939393" style={styles.userIcon} />
                    <View style={styles.numberAndTextReadersBlock}>
                      <Text style={styles.numberOfReaders}>{book.readers || "0"}</Text>
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
  },
  favoriteBookContainerBlock1: {
    backgroundColor: "#F5EABD",
    padding: 20,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  favoriteBookImg: {
    width: 82,
    height: 118,
    resizeMode: "contain",
  },
  favoriteBookContainerBlock2: {
    padding: 10,
  },
  nameAuthorOfBookAndHeartIcon: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "79%",
  },
  nameAndAuthorOfBook: {
    justifyContent: "space-between",
  },
  nameOfBook: {
    fontSize: 22,
    fontWeight: "500",
  },
  authorOfBook: {
    color: "#515151",
    fontSize: 16,
    fontWeight: "400",
  },
  heartIcon: {},
  rateOfBookContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 20,
  },
  rateOfBookBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF8E0",
    padding: 2,
    borderRadius: 8,
  },
  rateStarIcon: {},
  rateInNumber: {
    fontSize: 10,
    fontWeight: "400",
  },

  numberOfReadersAndForwardIconBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "79%",
  },
  userIconNumberOfReadersAndTextBlock: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  userIcon: {},
  numberAndTextReadersBlock: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
  },
  numberOfReaders: {
    fontSize: 18,
    fontWeight: "600",
  },
  titleOfReaders: {
    fontSize: 14,
    fontWeight: "600",
  },
  forwardIconBlock: {
    borderWidth: 1,
    borderRadius: 50,
    padding: 6,
  },
  forwardIcon: {},
  ////////////////////////////////////////////
});