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

  // Helper function to parse "DD.MM.YYYY" format
  const parseDateFromDDMMYYYY = (dateStr: string): Date | null => {
    if (!dateStr || typeof dateStr !== "string") return null;

    const parts = dateStr.split(".");
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
    }
    return null;
  };

  // Calculate days left from due date
  const calculateDaysLeft = (dueDateStr: any): number | null => {
    if (!dueDateStr) return null;

    let dueDate: Date | null = null;

    // Check if it's a Date object
    if (dueDateStr instanceof Date) {
      dueDate = dueDateStr;
    }
    // Check if it's a Firestore Timestamp
    else if (dueDateStr?.toDate && typeof dueDateStr.toDate === "function") {
      dueDate = dueDateStr.toDate();
    }
    // Check if it's a timestamp with seconds
    else if (dueDateStr?.seconds) {
      dueDate = new Date(dueDateStr.seconds * 1000);
    }
    // Check if it's a string in DD.MM.YYYY format
    else if (typeof dueDateStr === "string") {
      dueDate = parseDateFromDDMMYYYY(dueDateStr);

      // If that fails, try standard Date parsing
      if (!dueDate) {
        const standardDate = new Date(dueDateStr);
        if (!isNaN(standardDate.getTime())) {
          dueDate = standardDate;
        }
      }
    }

    if (!dueDate || isNaN(dueDate.getTime())) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Get days left text with proper formatting
  const getDaysLeftText = (dueDate: string): string => {
    const daysLeft = calculateDaysLeft(dueDate);

    if (daysLeft === null) {
      return dueDate || "-";
    }

    if (daysLeft < 0) {
      return `Overdue by ${Math.abs(daysLeft)} days`;
    }

    if (daysLeft === 0) {
      return "Due today";
    }

    return `${daysLeft} days left`;
  };

  async function loadData() {
    if (!currentUser) return;
    setLoading(true);
    getUserBookshelf(currentUser.uid)
      .then(async (borrows: any[]) => {
        const withImagesAndDays = await Promise.all(
          borrows.map(async (borrow: any) => {
            let image_url = null;
            if (borrow.bookId) {
              const book = (await getBookById(borrow.bookId).catch(
                () => null,
              )) as any;
              image_url = book?.image_url || null;
            }

            // Calculate days left
            const daysLeft = calculateDaysLeft(borrow.dueDate);

            return {
              ...borrow,
              image_url,
              daysLeft,
            };
          }),
        );
        setReceivedBooksData(withImagesAndDays);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  console.log(receivedBooksData);
  

  React.useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const navigation: any = useNavigation();
  const { t } = useTranslation();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (e) {}
    setRefreshing(false);
  }, [currentUser]);

  if (loading && receivedBooksData.length === 0) {
    return (
      <View
        style={[
          styles.bookshelfComponent,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#00A9FF" />
      </View>
    );
  }

  return (
    <View style={styles.bookshelfComponent}>
      <View style={styles.bookshelfComponentBlock}>
        <View style={styles.headerBookshelfComponent}>
          <View style={styles.titleAndIconNotifications}>
            <Text style={styles.titleOfComponent}>{t("bookshelf.t1")}</Text>
            <MaterialIcons
              name="notifications-none"
              size={35}
              color="black"
              onPress={() => {
                navigation.navigate("Duetime");
              }}
            />
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
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#00A9FF"]}
            />
          }
          contentContainerStyle={styles.bookshelfReceivedBooksScrollView}
          style={styles.bookshelfReceivedBooks}
          showsVerticalScrollIndicator={false}
        >
          {receivedBooksData.length === 0 && !loading && (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Text style={{ color: "#939393", fontSize: 16 }}>
                No borrowed books
              </Text>
            </View>
          )}
          {receivedBooksData.map((receivedBook) => {
            const isOverdue =
              receivedBook.daysLeft !== null && receivedBook.daysLeft < 0;
            const daysLeftText = getDaysLeftText(receivedBook.dueDate);

            return (
              <Pressable
                onPress={() => {
                  navigation.navigate("ReceivedBook", {
                    borrowData: receivedBook,
                  });
                }}
                style={styles.receivedBookContainer}
                key={receivedBook.id}
              >
                <View style={styles.receivedBookContainerBlock1}>
                  <Image
                    style={styles.receivedBookImg}
                    source={
                      receivedBook.image_url
                        ? { uri: receivedBook.image_url }
                        : require("../../assets/peshraft-library/home/tojikon.jpg")
                    }
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
                  </View>
                  <View style={styles.alertIconAndDaysLeftBlock}>
                    <Feather
                      name="alert-octagon"
                      size={24}
                      color={isOverdue ? "#FF383C" : "#00A9FF"}
                      style={styles.alertIcon}
                    />
                    <Text
                      style={[
                        styles.daysLeft,
                        { color: isOverdue ? "#FF383C" : "#00A9FF" },
                      ]}
                    >
                      {daysLeftText}
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
    flex: 1,
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
    flex: 1,
  },
  nameAuthorOfBookAndHeartIcon: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  nameAndAuthorOfBook: {
    justifyContent: "space-between",
    flex: 1,
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
  heartIcon: {
    marginLeft: 10,
  },
  alertIconAndDaysLeftBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  alertIcon: {},
  daysLeft: {
    fontSize: 12,
    fontWeight: "600",
  },
  btnReturnBookBlock: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  btnReturnBook: {
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
