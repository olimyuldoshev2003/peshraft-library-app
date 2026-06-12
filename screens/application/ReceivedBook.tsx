import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import {
  getUserBookshelf,
  getAllBooks,
  getBookById,
} from "@/firebase/mobile.services";

const ReceivedBook = ({ route }: { route?: any }) => {
  const navigation: any = useNavigation();
  const { currentUser, userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const [borrowData, setBorrowData] = useState<any>(null);
  const [bookImage, setBookImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [otherBooks, setOtherBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOtherBooks, setLoadingOtherBooks] = useState(true);

  const passedBorrowData = route?.params?.borrowData;
  const borrowId = route?.params?.borrowId;

  // Helper function to parse "DD.MM.YYYY" format
  const parseDateFromDDMMYYYY = (dateStr: string): Date | null => {
    if (!dateStr || typeof dateStr !== "string") return null;

    // Check if format is DD.MM.YYYY
    const parts = dateStr.split(".");
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      // Validate numbers
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      // Create date (month is 0-indexed in JavaScript)
      const date = new Date(year, month - 1, day);
      // Validate if date is valid
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

    // Try to parse the date
    let dueDate: Date | null = null;

    // Check if it's already a Date object
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadingOtherBooks(true);

      try {
        if (passedBorrowData) {
          setBorrowData(passedBorrowData);
          if (passedBorrowData.bookId) {
            try {
              const book:any = await getBookById(passedBorrowData.bookId);
              if (book?.image_url) setBookImage(book.image_url);
            } catch (error) {
              console.error("Error loading book image:", error);
            }
          }

          try {
            const books = await getAllBooks();
            setOtherBooks(books.slice(0, 6));
          } catch (error) {
            console.error("Error loading other books:", error);
          } finally {
            setLoadingOtherBooks(false);
          }
          setLoading(false);
          return;
        }

        if (!currentUser) {
          setLoading(false);
          setLoadingOtherBooks(false);
          return;
        }

        const shelf = await getUserBookshelf(currentUser.uid);
        const borrow = borrowId
          ? shelf.find((b: any) => b.id === borrowId) || shelf[0]
          : shelf[0];
        setBorrowData(borrow || null);

        const books = await getAllBooks();
        setOtherBooks(books.slice(0, 6));
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
        setLoadingOtherBooks(false);
      }
    };

    loadData();
  }, [currentUser, borrowId, passedBorrowData]);

  const dynamicStyles = StyleSheet.create({
    daysLeft: {
      fontSize: i18n.language === "ru" || i18n.language === "tj" ? 15 : 20,
    },
    btnTextReturnTheBook: {
      fontSize: i18n.language === "ru" || i18n.language === "tj" ? 13 : 18,
    },
  });

  if (loading) {
    return (
      <View
        style={[
          styles.receivedBookComponent,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#00A9FF" />
      </View>
    );
  }

  if (!borrowData) {
    return (
      <View style={styles.receivedBookComponent}>
        <View style={styles.receivedBookComponentBlock}>
          <MaterialCommunityIcons
            name="arrow-left-thin-circle-outline"
            size={45}
            color="black"
            onPress={() => navigation.goBack()}
          />
          <Text
            style={{
              textAlign: "center",
              color: "#999",
              marginTop: 40,
              fontSize: 18,
            }}
          >
            {t("receivedBook.t8")}
          </Text>
        </View>
      </View>
    );
  }

  // Calculate days left using the helper function
  const daysLeft = calculateDaysLeft(borrowData.dueDate);

  // Get the formatted due date for display
  const getFormattedDueDate = (): string => {
    if (!borrowData.dueDate) return "-";

    // If it's already a formatted string, return it
    if (
      typeof borrowData.dueDate === "string" &&
      borrowData.dueDate.includes(".")
    ) {
      return borrowData.dueDate;
    }

    // Try to parse and format
    let date: Date | null = null;

    if (borrowData.dueDate?.toDate) {
      date = borrowData.dueDate.toDate();
    } else if (borrowData.dueDate?.seconds) {
      date = new Date(borrowData.dueDate.seconds * 1000);
    } else if (typeof borrowData.dueDate === "string") {
      date = parseDateFromDDMMYYYY(borrowData.dueDate);
      if (!date) date = new Date(borrowData.dueDate);
    }

    if (date && !isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }

    return String(borrowData.dueDate);
  };

  const getDaysLeftText = (): string => {
    if (daysLeft === null) {
      return getFormattedDueDate();
    }

    if (daysLeft < 0) {
      return `${t("receivedBook.t9")} ${Math.abs(daysLeft)} ${t("receivedBook.t9") === "Overdue by" ? "days" : t("receivedBook.days") || "days"}`;
    }

    if (daysLeft === 0) {
      return t("receivedBook.t10");
    }

    return `${daysLeft} ${daysLeft === 1 ? t("receivedBook.t4") : t("receivedBook.t5")}`;
  };

  const isOverdue = daysLeft !== null && daysLeft < 0;

  return (
    <View style={styles.receivedBookComponent}>
      <View style={styles.receivedBookComponentBlock}>
        <View style={styles.headerReceivedBookComponent}>
          <MaterialCommunityIcons
            name="arrow-left-thin-circle-outline"
            size={45}
            color="black"
            onPress={() => navigation.goBack()}
          />
        </View>
        <ScrollView
          contentContainerStyle={styles.sectionReceivedBookComponentScrollView}
          style={styles.sectionReceivedBookComponent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.greetingsAndNameOfUser}>
            {t("receivedBook.t1")} {userProfile?.fullName || ""}
          </Text>

          {bookImage && !imageError && (
            <View style={styles.imgOfBookBlock}>
              <Image
                source={{ uri: bookImage }}
                style={styles.imgOfBook}
                onError={() => setImageError(true)}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.blockForText}>
            <Text style={styles.textNumber1}>
              {borrowData.bookTitle || "-"}
            </Text>
            <Text style={styles.textNumber2}>{borrowData.author || ""}</Text>
          </View>

          <View style={styles.daysLeftAndBtnReturnBlock}>
            <View style={styles.iconAndDaysLeftBlock}>
              <Feather
                name="alert-octagon"
                size={40}
                color={isOverdue ? "#FF383C" : "#00A9FF"}
                style={styles.alertIcon}
              />
              <Text
                style={[
                  styles.daysLeft,
                  dynamicStyles.daysLeft,
                  { color: isOverdue ? "#FF383C" : "#00A9FF" },
                ]}
              >
                {getDaysLeftText()}
              </Text>
            </View>
            <Pressable
              style={styles.btnReturnTheBook}
              onPress={() => navigation.navigate("ReturnBook", { borrowData })}
            >
              <Text
                style={[
                  styles.btnTextReturnTheBook,
                  dynamicStyles.btnTextReturnTheBook,
                ]}
              >
                {t("receivedBook.t6")}
              </Text>
            </Pressable>
          </View>

          {/* Other Books */}
          <View style={styles.otherBooksContainer}>
            <Text style={styles.titleOtherBooks}>{t("receivedBook.t7")}</Text>
            {loadingOtherBooks ? (
              <View style={styles.otherBooksLoadingContainer}>
                <ActivityIndicator size="small" color="#00A9FF" />
                <Text style={styles.otherBooksLoadingText}>
                  Loading recommendations...
                </Text>
              </View>
            ) : otherBooks.length > 0 ? (
              <ScrollView
                showsHorizontalScrollIndicator={false}
                horizontal
                contentContainerStyle={styles.otherBooksBlockScrollView}
                style={styles.otherBooksBlock}
              >
                {otherBooks.map((book: any) => (
                  <Pressable
                    key={book.id}
                    style={styles.otherBookImgAndName}
                    onPress={() => navigation.navigate("Book", { id: book.id })}
                  >
                    <Image
                      source={
                        book.image_url ? { uri: book.image_url } : undefined
                      }
                      style={styles.otherBookImg}
                      onError={(e) => {
                        // If image fails to load, it will show nothing
                        e.currentTarget.setNativeProps({ source: undefined });
                      }}
                    />
                    <Text style={styles.otherBookName} numberOfLines={1}>
                      {book.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noOtherBooksText}>
                No other books available
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default ReceivedBook;

const styles = StyleSheet.create({
  receivedBookComponent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  receivedBookComponentBlock: {
    padding: 18,
    paddingTop: Platform.OS === "ios" ? 26 : 20,
  },
  headerReceivedBookComponent: {},
  sectionReceivedBookComponentScrollView: {
    marginTop: 20,
    gap: 20,
    paddingBottom: 100,
  },
  sectionReceivedBookComponent: {},
  greetingsAndNameOfUser: {
    color: "#636363",
    fontSize: 25,
    fontWeight: "600",
  },
  imgOfBookBlock: {
    justifyContent: "center",
    alignItems: "center",
  },
  imgOfBook: {
    width: 200,
    height: 300,
    transform: [{ rotate: "-10deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
    backgroundColor: "transparent",
  },
  blockForText: {},
  textNumber1: {
    fontSize: 25,
    fontWeight: "500",
    textAlign: "center",
    color: "#000",
  },
  textNumber2: {
    fontSize: 25,
    fontWeight: "400",
    textAlign: "center",
    color: "#939393",
  },
  daysLeftAndBtnReturnBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  iconAndDaysLeftBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  alertIcon: {},
  daysLeft: {
    fontSize: 20,
    fontWeight: "400",
    flexShrink: 1,
  },
  btnReturnTheBook: {
    backgroundColor: "#00A9FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#00A9FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btnTextReturnTheBook: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  otherBooksContainer: {
    marginTop: 10,
  },
  titleOtherBooks: {
    fontSize: 21,
    fontWeight: "500",
    color: "#000",
  },
  otherBooksLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    paddingVertical: 20,
  },
  otherBooksLoadingText: {
    fontSize: 14,
    color: "#666",
  },
  otherBooksBlockScrollView: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
    paddingBottom: 10,
  },
  otherBooksBlock: {},
  otherBookImgAndName: {
    gap: 5,
    width: 95,
  },
  otherBookImg: {
    width: 95,
    height: 145,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  otherBookName: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  noOtherBooksText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 20,
    paddingVertical: 20,
  },
});
