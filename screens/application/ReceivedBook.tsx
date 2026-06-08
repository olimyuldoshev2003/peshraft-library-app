import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator, Image, Pressable, ScrollView,
  StyleSheet, Text, View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { getUserBookshelf, getAllBooks, getBookById } from "@/firebase/mobile.services";

const ReceivedBook = ({ route }: { route?: any }) => {
  const navigation: any = useNavigation();
  const { currentUser, userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const [borrowData, setBorrowData] = useState<any>(null);
  const [bookImage, setBookImage] = useState<string | null>(null); // ✅ image from books collection
  const [otherBooks, setOtherBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ FIXED: Bookshelf now passes the full borrowData object directly
  const passedBorrowData = route?.params?.borrowData;
  const borrowId = route?.params?.borrowId;

  useEffect(() => {
    // If borrowData was passed directly from Bookshelf, use it immediately
    if (passedBorrowData) {
      setBorrowData(passedBorrowData);
      // Fetch the real book image using bookId (borrow doc doesn't store image_url)
      if (passedBorrowData.bookId) {
        getBookById(passedBorrowData.bookId)
          .then((book: any) => { if (book?.image_url) setBookImage(book.image_url); })
          .catch(console.error);
      }
      // Still load other books for recommendations
      getAllBooks().then((books: any[]) => setOtherBooks(books.slice(0, 6))).catch(console.error);
      return;
    }
    // Fallback: load from Firestore if no data was passed
    if (!currentUser) return;
    setLoading(true);
    async function load() {
      const shelf = await getUserBookshelf(currentUser!.uid);
      const borrow = borrowId
        ? shelf.find((b: any) => b.id === borrowId) || shelf[0]
        : shelf[0];
      setBorrowData(borrow || null);
      const books = await getAllBooks();
      setOtherBooks(books.slice(0, 6));
      setLoading(false);
    }
    load().catch(console.error);
  }, [currentUser, borrowId, passedBorrowData]);

  const dynamicStyles = StyleSheet.create({
    daysLeft: { fontSize: i18n.language === "ru" || i18n.language === "tj" ? 15 : 20 },
    btnTextReturnTheBook: { fontSize: i18n.language === "ru" || i18n.language === "tj" ? 13 : 18 },
  });

  if (loading) {
    return (
      <View style={[styles.receivedBookComponent, { justifyContent: "center", alignItems: "center" }]}>
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
            size={45} color="black"
            onPress={() => navigation.goBack()}
          />
          <Text style={{ textAlign: "center", color: "#999", marginTop: 40, fontSize: 18 }}>
            No borrowed books yet
          </Text>
        </View>
      </View>
    );
  }

  // Calculate days left
  const dueDate = borrowData.dueDate ? new Date(borrowData.dueDate) : null;
  const now = new Date();
  const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <View style={styles.receivedBookComponent}>
      <View style={styles.receivedBookComponentBlock}>
        <View style={styles.headerReceivedBookComponent}>
          <MaterialCommunityIcons
            name="arrow-left-thin-circle-outline"
            size={45} color="black"
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

          <View style={styles.imgOfBookBlock}>
            <Image
              source={bookImage
                ? { uri: bookImage }
                : require("../../assets/peshraft-library/home/tojikon.jpg")}
              style={styles.imgOfBook}
            />
          </View>

          <View style={styles.blockForText}>
            <Text style={styles.textNumber1}>{borrowData.bookTitle || "-"}</Text>
            <Text style={styles.textNumber2}>{borrowData.author || ""}</Text>
          </View>

          <View style={styles.daysLeftAndBtnReturnBlock}>
            <View style={styles.iconAndDaysLeftBlock}>
              <Feather name="alert-octagon" size={40} color="#FF383C" style={styles.alertIcon} />
              <Text style={[styles.daysLeft, dynamicStyles.daysLeft]}>
                {daysLeft !== null
                  ? daysLeft <= 0
                    ? `Overdue by ${Math.abs(daysLeft)} days`
                    : `${daysLeft} ${t("receivedBook.t5")}`
                  : borrowData.dueDate || "-"}
              </Text>
            </View>
            <Pressable
              style={styles.btnReturnTheBook}
              onPress={() => navigation.navigate("ReturnBook", { borrowData })}
            >
              <Text style={[styles.btnTextReturnTheBook, dynamicStyles.btnTextReturnTheBook]}>
                {t("receivedBook.t6")}
              </Text>
            </Pressable>
          </View>

          {/* Other Books */}
          {otherBooks.length > 0 && (
            <View style={styles.otherBooksContainer}>
              <Text style={styles.titleOtherBooks}>{t("receivedBook.t7")}</Text>
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
                      source={book.image_url
                        ? { uri: book.image_url }
                        : require("../../assets/peshraft-library/home/tojikon.jpg")}
                      style={styles.otherBookImg}
                    />
                    <Text style={styles.otherBookName}>{book.title}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default ReceivedBook;

const styles = StyleSheet.create({
  receivedBookComponent: { flex: 1, backgroundColor: "#fff" },
  receivedBookComponentBlock: { padding: 18, paddingTop: 26 },
  headerReceivedBookComponent: {},
  sectionReceivedBookComponentScrollView: { marginTop: 20, gap: 20, paddingBottom: 100 },
  sectionReceivedBookComponent: {},
  greetingsAndNameOfUser: { color: "#636363", fontSize: 25, fontWeight: "600" },
  imgOfBookBlock: { justifyContent: "center", alignItems: "center" },
  imgOfBook: {
    width: 200, height: 300,
    transform: [{ rotate: "-10deg" }],
    shadowColor: "#000", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 2, elevation: 5, backgroundColor: "#fff",
  },
  blockForText: {},
  textNumber1: { fontSize: 25, fontWeight: "500", textAlign: "center" },
  textNumber2: { fontSize: 25, fontWeight: "400", textAlign: "center", color: "#939393" },
  daysLeftAndBtnReturnBlock: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  iconAndDaysLeftBlock: { flexDirection: "row", alignItems: "center", gap: 10 },
  alertIcon: {},
  daysLeft: { color: "#FF383C", fontSize: 20, fontWeight: "400" },
  btnReturnTheBook: { backgroundColor: "#00A9FF", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  btnTextReturnTheBook: { color: "#fff", fontSize: 18, fontWeight: "500" },
  otherBooksContainer: { marginTop: 10 },
  titleOtherBooks: { fontSize: 21, fontWeight: "500" },
  otherBooksBlockScrollView: { marginTop: 10, flexDirection: "row", gap: 10 },
  otherBooksBlock: {},
  otherBookImgAndName: { gap: 5 },
  otherBookImg: { width: 95, height: 145, borderRadius: 8 },
  otherBookName: { textAlign: "center", fontSize: 15, fontWeight: "400" },
});