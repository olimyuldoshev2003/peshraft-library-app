import { Entypo, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { getUserHistory, getBookById } from "@/firebase/mobile.services";

const HistoryBook = () => {
  const navigation: any = useNavigation();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  async function loadData() {
    if (!currentUser) return;
    setLoading(true);
    getUserHistory(currentUser.uid)
      .then(async (borrows: any[]) => {
        const enriched = await Promise.all(
          borrows.map(async (borrow: any) => {
            if (borrow.bookId) {
              const book = await getBookById(borrow.bookId).catch(() => null) as any;
              return {
                ...borrow,
                image_url: book?.image_url || null,
                rating: book?.rating ?? 0,      // ✅ from books collection
                readers: book?.readers ?? 0,    // ✅ from books collection
              };
            }
            return borrow;
          })
        );
        setHistory(enriched);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, [currentUser]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try { await loadData() } catch (e) {}
    setRefreshing(false);
  }, [currentUser]);


  return (
    <View style={styles.historyBookComponent}>
      <View style={styles.historyBookComponentBlock}>
        <View style={styles.headerHistoryBookComponent}>
          <MaterialCommunityIcons
            name="arrow-left-thin-circle-outline"
            size={45}
            color="black"
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.titleHistoryBookComponent}>{t("historyBook.t1")}</Text>
        </View>

        <ScrollView
refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00A9FF"]} />}
                      contentContainerStyle={styles.sectionHistoryBookComponentScrollView}
          style={styles.sectionHistoryBookComponent}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <ActivityIndicator size="large" color="#00A9FF" style={{ marginTop: 40 }} />
          )}
          {!loading && history.length === 0 && (
            <Text style={{ textAlign: "center", color: "#999", marginTop: 40 }}>
              No history yet
            </Text>
          )}
          {!loading && history.length > 0 && (
            <View style={styles.historyBookContainer}>
              <View style={styles.historyBookOfThisDay}>
                {history.map((book: any) => (
                  <Pressable
                    key={book.id}
                    onPress={() => navigation.navigate("Book", { id: book.bookId })}
                    style={styles.historyBookMainBlock}
                  >
                    <View style={styles.historyBookContainerBlock1}>
                      <Image
                        style={styles.historyBookImg}
                        source={
                          book.image_url
                            ? { uri: book.image_url }
                            : require("../../assets/peshraft-library/home/tojikon.jpg")
                        }
                      />
                    </View>
                    <View style={styles.historyBookContainerBlock2}>
                      <View style={styles.nameAuthorOfBookAndHeartIcon}>
                        <View style={styles.nameAndAuthorOfBook}>
                          <Text style={styles.nameOfBook}>{book.bookTitle || "-"}</Text>
                          <Text style={styles.authorOfBook}>{book.author || "-"}</Text>
                        </View>
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
                            <Text style={styles.titleOfReaders}>{t("historyBook.t3")}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default HistoryBook;

const styles = StyleSheet.create({
  historyBookComponent: { flex: 1, backgroundColor: "#fff" },
  historyBookComponentBlock: { padding: 10, paddingTop: 30 },
  headerHistoryBookComponent: { flexDirection: "row", alignItems: "center", gap: 81 },
  titleHistoryBookComponent: { fontSize: 23, fontWeight: "400" },
  sectionHistoryBookComponentScrollView: { gap: 22, paddingBottom: 105 },
  sectionHistoryBookComponent: { paddingHorizontal: 5, paddingVertical: 10 },
  historyBookContainer: {},
  historyBookUploadedDay: { color: "#4D4D4D", fontSize: 18, fontWeight: "400", textAlign: "center" },
  historyBookOfThisDay: { marginTop: 10, gap: 20 },
  historyBookMainBlock: {
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  historyBookContainerBlock1: {
    backgroundColor: "#F5EABD",
    padding: 20,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  historyBookImg: { width: 82, height: 118, resizeMode: "contain" },
  historyBookContainerBlock2: { padding: 10 },
  nameAuthorOfBookAndHeartIcon: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  nameAndAuthorOfBook: { justifyContent: "space-between" },
  nameOfBook: { fontSize: 22, fontWeight: "500" },
  authorOfBook: { color: "#515151", fontSize: 16, fontWeight: "400" },
  heartIcon: {},
  rateOfBookContainer: { flexDirection: "row", justifyContent: "flex-start", marginTop: 20 },
  rateOfBookBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF8E0",
    padding: 2,
    borderRadius: 8,
  },
  rateStarIcon: {},
  rateInNumber: { fontSize: 10, fontWeight: "400" },
  numberOfReadersAndForwardIconBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "79%",
  },
  userIconNumberOfReadersAndTextBlock: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  userIcon: {},
  numberAndTextReadersBlock: { flexDirection: "row", alignItems: "flex-end", gap: 5 },
  numberOfReaders: { fontSize: 18, fontWeight: "600" },
  titleOfReaders: { fontSize: 14, fontWeight: "600" },
  forwardIconBlock: { borderWidth: 1, borderRadius: 50, padding: 6 },
  forwardIcon: {},
});