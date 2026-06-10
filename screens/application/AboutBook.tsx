import { useNavigation } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getAllBooks } from "@/firebase/mobile.services";
import { useAppSelector } from "@/hooks/use-app-selector";
import { useAppDispatch } from "@/hooks/use-app-dispatch";
import { getBookById } from "@/api/api";

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
  const [otherBooks, setOtherBooks] = React.useState<any[]>([]);

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
    if (bookId) {
      getAllBooks()
        .then((books: any[]) => {
          const others = books.filter((b: any) => b.id !== bookId).slice(0, 6);
          setOtherBooks(others);
        })
        .catch(console.error);
    }
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
        <Text style={{ color: "#999" }}>No book found</Text>
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
            {bookById?.description || "No description available."}
          </Text>
          {bookById && (
            <View style={{ marginTop: 12, gap: 4 }}>
              <Text style={styles.infoText}>
                📅 Year: {bookById.year || "-"}
              </Text>
              <Text style={styles.infoText}>
                🌐 Language: {bookById.language || "-"}
              </Text>
              <Text style={styles.infoText}>
                📚 Available copies: {bookById.available_copies ?? "-"}
              </Text>
            </View>
          )}
        </View>

        {otherBooks.length > 0 && (
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
                  <Text style={styles.otherBookName}>{b.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
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
  aboutBook: { fontSize: 16, fontWeight: "500" },
  infoText: { fontSize: 15, color: "#555", fontWeight: "400" },
  otherBooksContainer: { marginTop: 10 },
  titleOtherBooks: { fontSize: 21, fontWeight: "500" },
  otherBooksBlockScrollView: { marginTop: 10, flexDirection: "row", gap: 10 },
  otherBooksBlock: {},
  otherBookImgAndName: { gap: 5 },
  otherBookImg: { width: 95, height: 145, borderRadius: 8 },
  otherBookName: { textAlign: "center", fontSize: 15, fontWeight: "400" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
