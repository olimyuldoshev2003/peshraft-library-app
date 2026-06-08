import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getUserBookshelf, getBookById } from "@/firebase/mobile.services";
import { useAuth } from "@/context/AuthContext";
import { ActivityIndicator } from "react-native";

const Bookshelf = () => {
  const { currentUser } = useAuth();
  const [receivedBooksData, setReceivedBooksData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  async function loadData() {
    if (!currentUser) return;
    setLoading(true);
    getUserBookshelf(currentUser.uid)
      .then(async (borrows: any[]) => {
        const withImages = await Promise.all(
          borrows.map(async (borrow: any) => {
            if (borrow.bookId) {
              const book = await getBookById(borrow.bookId).catch(() => null) as any;
              return { ...borrow, image_url: book?.image_url || null };
            }
            return borrow;
          })
        );
        setReceivedBooksData(withImages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  React.useEffect(() => {
    if (currentUser) { loadData(); }
  }, [currentUser]);



  const navigation: any = useNavigation();
  const {t} = useTranslation()

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try { await loadData() } catch (e) {}
    setRefreshing(false);
  }, [currentUser]);


  return (
    <View style={styles.bookshelfComponent}>
      <View style={styles.bookshelfComponentBlock}>
        <View style={styles.headerBookshelfComponent}>
          <View style={styles.titleAndIconNotifications}>
            <Text style={styles.titleOfComponent}>{t("bookshelf.t1")}</Text>
            <MaterialIcons name="notifications-none" size={35} color="black" onPress={() => {
              navigation.navigate("Duetime")
            }}/>
          </View>
          <View style={styles.searchBlock}>
            <Ionicons
              name="search"
              size={30}
              color="black"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.inputSearch}
              placeholder={t("bookshelf.t2")}
              placeholderTextColor={"#939393"}
            />
          </View>
        </View>
        {/* <View style={styles.sectionBookshelfComponent}> */}
          <ScrollView
refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00A9FF"]} />}
                        contentContainerStyle={styles.bookshelfReceivedBooksScrollView}
            style={styles.bookshelfReceivedBooks}
            showsVerticalScrollIndicator={false}
          >
            {receivedBooksData.map((receivedBook) => {
              return (
                <Pressable
                  onPress={() => {
                    navigation.navigate("ReceivedBook", { borrowData: receivedBook })
                  }}
                  style={styles.receivedBookContainer}
                  key={receivedBook.id}
                >
                  <View style={styles.receivedBookContainerBlock1}>
                    <Image
                      style={styles.receivedBookImg}
                      source={receivedBook.image_url ? { uri: receivedBook.image_url } : require("../../assets/peshraft-library/home/tojikon.jpg")}
                    />
                  </View>
                  <View style={styles.receivedBookContainerBlock2}>
                    <View style={styles.nameAuthorOfBookAndHeartIcon}>
                      <View style={styles.nameAndAuthorOfBook}>
                        <Text style={styles.nameOfBook}>
                          {receivedBook.bookTitle || receivedBook.name || ""}
                        </Text>
                        <Text style={styles.authorOfBook}>
                          {receivedBook.author}
                        </Text>
                      </View>
                      <FontAwesome
                        name="heart-o"
                        size={20}
                        color="#939393"
                        style={styles.heartIcon}
                      />
                    </View>
                    <View style={styles.alertIconAndDaysLeftBlock}>
                      <Feather
                        name="alert-octagon"
                        size={24}
                        color="#FF383C"
                        style={styles.alertIcon}
                      />
                      <Text style={styles.daysLeft}>
                        {receivedBook.dueDate || "-"}
                      </Text>
                    </View>
                    <View style={styles.btnReturnBookBlock}>
                      <View style={styles.btnReturnBook}>
                        <Text style={styles.btnTextReturnBook}>
                          {t("bookshelf.t5")}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        {/* </View> */}
      </View>
    </View>
  );
};

export default Bookshelf;

const styles = StyleSheet.create({
  bookshelfComponent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  bookshelfComponentBlock: {
    padding: 10,
    paddingTop: 25,
  },
  headerBookshelfComponent: {
    paddingBottom: 15,
  },
  titleAndIconNotifications: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleOfComponent: {
    fontSize: 25,
    fontWeight: "500",
  },
  searchBlock: {
    position: "relative",
    marginTop: 11,
  },
  searchIcon: {
    position: "absolute",
    zIndex: 5,
    top: 9.5,
    left: 9.5,
  },
  inputSearch: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
    backgroundColor: "#fff",
    fontSize: 20,
    fontWeight: "600",
    borderRadius: 24,
    paddingLeft: 55,
  },
  sectionBookshelfComponent: {},
  bookshelfReceivedBooksScrollView: {
    gap: 22,
    paddingBottom: 120,
  },
  bookshelfReceivedBooks: { 
    paddingHorizontal: 5,
    paddingVertical: 10,
  },

  // Styles with the same names and properties
  receivedBookContainer: {
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
  receivedBookContainerBlock1: {
    backgroundColor: "#767D7E",
    padding: 20,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  receivedBookImg: {
    width: 82,
    height: 118,
    resizeMode: "contain",
  },
  receivedBookContainerBlock2: {
    padding: 10,
  },
  nameAuthorOfBookAndHeartIcon: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
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
  alertIconAndDaysLeftBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  alertIcon: {},
  daysLeft: {
    color: "#FF383C",
    fontSize: 12,
    fontWeight: "600",
  },
  btnReturnBookBlock: {
    flexDirection: "row",
    width: "80%",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  btnReturnBook: {
    // backgroundColor: "#FF383C",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#404066",
  },
  btnTextReturnBook: {
    color: "#404066",
    fontSize: 11,
    fontWeight: "500",
  },
});