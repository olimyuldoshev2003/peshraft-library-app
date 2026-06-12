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
  Dimensions,
} from "react-native";
import { getAllBooks } from "@/firebase/mobile.services";
import { useAppSelector } from "@/hooks/use-app-selector";
import { useAppDispatch } from "@/hooks/use-app-dispatch";

const { width: screenWidth } = Dimensions.get("window");

const AboutBook = ({
  route,
  bookId: propBookId,
}: {
  route?: any;
  bookId?: string;
}) => {
  const navigation: any = useNavigation();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [otherBooks, setOtherBooks] = useState<any[]>([]);
  const [loadingOtherBooks, setLoadingOtherBooks] = useState(false);

  // Get bookId from route params or prop
  const bookId = route?.params?.bookId || propBookId;

  // Get book data from Redux
  const bookById = useAppSelector(
    (state: any) => state.peshraftLibraryState.bookById,
  );
  const loadingBookById = useAppSelector(
    (state: any) => state.peshraftLibraryState.loadingBookById,
  );

  // Load other books for recommendations
  useEffect(() => {
    const loadOtherBooks = async () => {
      if (!bookId) {
        console.log("No bookId available");
        return;
      }

      setLoadingOtherBooks(true);
      try {
        const books = await getAllBooks();
        console.log("All books loaded:", books?.length);

        if (books && Array.isArray(books)) {
          const others = books.filter((b: any) => b.id !== bookId).slice(0, 6);
          console.log("Other books found:", others.length);
          setOtherBooks(others);
        } else {
          console.log("No books returned from getAllBooks");
          setOtherBooks([]);
        }
      } catch (error) {
        console.error("Error loading other books:", error);
        setOtherBooks([]);
      } finally {
        setLoadingOtherBooks(false);
      }
    };

    loadOtherBooks();
  }, [bookId]);

  // Show loading
  if (loadingBookById) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A9FF" />
      </View>
    );
  }

  // No book found
  if (!bookById || bookById.id !== bookId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#999" }}>{t("aboutBook.t2")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.aboutBookComponent}>
      <ScrollView
        contentContainerStyle={styles.aboutBookComponentBlockScrollView}
        style={styles.aboutBookComponentBlock}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.aboutBookBlock}>
          <Text style={styles.aboutBook}>
            {bookById?.description || `${t("aboutBook.t3")}.`}
          </Text>
          {bookById && (
            <View style={{ marginTop: 12, gap: 4 }}>
              <Text style={styles.infoText}>
                📅 {t("aboutBook.t4")}: {bookById.year || "-"}
              </Text>
              <Text style={styles.infoText}>
                🌐 {t("aboutBook.t5")}: {bookById.language || "-"}
              </Text>
              <Text style={styles.infoText}>
                📚 {t("aboutBook.t6")}: {bookById.available_copies ?? "-"}
              </Text>
            </View>
          )}
        </View>

        {loadingOtherBooks ? (
          <View style={styles.otherBooksLoadingContainer}>
            <ActivityIndicator size="small" color="#00A9FF" />
            <Text style={styles.otherBooksLoadingText}>
              {t("aboutBook.t7")}...
            </Text>
          </View>
        ) : otherBooks.length > 0 ? (
          <View style={styles.otherBooksContainer}>
            <Text style={styles.titleOtherBooks}>{t("aboutBook.t1")}</Text>
            <ScrollView
              showsHorizontalScrollIndicator={false}
              horizontal
              contentContainerStyle={styles.otherBooksBlockScrollView}
              style={styles.otherBooksBlock}
            >
              {otherBooks.map((b: any) => (
                <Pressable
                  key={b.id}
                  style={styles.otherBookImgAndName}
                  onPress={() => navigation.navigate("Book", { id: b.id })}
                >
                  <Image
                    source={
                      b.image_url
                        ? { uri: b.image_url }
                        : require("../../assets/peshraft-library/home/tojikon.jpg")
                    }
                    style={styles.otherBookImg}
                  />
                  <Text
                    style={styles.otherBookName}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {b.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default AboutBook;

const styles = StyleSheet.create({
  aboutBookComponent: { flex: 1, backgroundColor: "#fff" },
  aboutBookComponentBlockScrollView: { paddingBottom: 10 },
  aboutBookComponentBlock: { padding: 10 },
  aboutBookBlock: {},
  aboutBook: { fontSize: 16, fontWeight: "500", lineHeight: 24, color: "#333" },
  infoText: { fontSize: 15, color: "#555", fontWeight: "400", marginTop: 4 },
  otherBooksContainer: { marginTop: 20 },
  titleOtherBooks: {
    fontSize: 17,
    fontWeight: "600", color: "#000"
  },
  otherBooksLoadingContainer: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },
  otherBooksLoadingText: {
    fontSize: 14,
    color: "#666",
  },
  otherBooksBlockScrollView: {
    marginTop: 10,
    flexDirection: "row",
    gap: 12,
    paddingRight: 10,
  },
  otherBooksBlock: {},
  otherBookImgAndName: {
    gap: 8,
    width: 100,
    alignItems: "center",
  },
  otherBookImg: {
    width: 100,
    height: 150,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
  },
  otherBookName: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
    width: 100,
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
