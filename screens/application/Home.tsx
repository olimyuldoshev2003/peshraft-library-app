import ModalSearch from "@/components/home/ModalSearch";
import {
  getAllBooks,
  getCategories,
  getUserBookshelf,
  getBookById,
} from "@/firebase/mobile.services";
import { useAuth } from "@/context/AuthContext";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/hooks/use-app-selector";
import { refreshFavoriteBooks, toggleFavoriteBook } from "@/api/api";
import { useAppDispatch } from "@/hooks/use-app-dispatch";

const Home = () => {
  const navigation: any = useNavigation();

  const [modalSearch, setModalSearch] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);

  // Books
  const [books, setBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState<boolean>(false);
  const [booksError, setBooksError] = useState<string | null>(null);

  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { currentUser, userProfile } = useAuth();
  const [receivedBooks, setReceivedBooks] = useState<any[]>([]);
  const [receivedBooksLoading, setReceivedBooksLoading] =
    useState<boolean>(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchValue, setSearchValue] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  // Track favorite status for books
  const [favoriteStatusMap, setFavoriteStatusMap] = useState<
    Map<string, boolean>
  >(new Map());

  // Get favorite books from Redux store
  const favoriteBooksFromStore = useAppSelector(
    (state) => state.peshraftLibraryState.favoriteBooks,
  );

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchValue);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchValue]);

  // Update favorite status map whenever favorite books change
  useEffect(() => {
    if (favoriteBooksFromStore) {
      const newMap = new Map<string, boolean>();
      favoriteBooksFromStore.forEach((fav: any) => {
        newMap.set(fav.bookId, true);
      });
      setFavoriteStatusMap(newMap);
    }
  }, [favoriteBooksFromStore]);

  // Memoize filtered books for performance
  const filteredBooks = useMemo(() => {
    if (!searchDebounced) return books;
    return books.filter(
      (book: any) =>
        book.title?.toLowerCase().includes(searchDebounced.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchDebounced.toLowerCase()),
    );
  }, [books, searchDebounced]);

  // Load all books with error handling
  async function loadAllBooks() {
    try {
      setLoadingBooks(true);
      setBooksError(null);
      const data = await getAllBooks(activeCategory);
      setBooks(data || []);
    } catch (error: any) {
      console.error("Error loading books:", error);
      setBooksError(error.message || "Failed to load books");
      setBooks([]);
    } finally {
      setLoadingBooks(false);
    }
  }

  // Load categories with error handling
  async function loadCategories() {
    try {
      setCategoriesLoading(true);
      const data = await getCategories();
      setCategories([{ id: "all", filterName: "All" }, ...(data || [])]);
    } catch (err: any) {
      console.error("Error loading categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  }

  // Load received books with enrichment and error handling
  async function loadReceivedBooks() {
    if (!currentUser?.uid) {
      setReceivedBooks([]);
      return;
    }

    try {
      setReceivedBooksLoading(true);
      const borrows = await getUserBookshelf(currentUser.uid);

      // Enrich each borrow with the book's image and compute days left
      const enriched = await Promise.all(
        (borrows || []).map(async (borrow: any) => {
          let image_url = null;
          if (borrow.bookId) {
            try {
              const book = (await getBookById(borrow.bookId)) as any;
              image_url = book?.image_url || null;
            } catch (err) {
              console.error(`Error fetching book ${borrow.bookId}:`, err);
            }
          }

          // Compute days left from dueDate string "DD.MM.YYYY"
          let daysLeft: number | null = null;
          let daysTotal: number | null = null;

          if (borrow.dueDate && typeof borrow.dueDate === "string") {
            const [d, m, y] = borrow.dueDate.split(".").map(Number);
            const due = new Date(y, m - 1, d);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            daysLeft = Math.ceil(
              (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );
          }

          // Compute total borrow period from dateBorrowed to dueDate
          if (
            borrow.dateBorrowed &&
            borrow.dueDate &&
            typeof borrow.dueDate === "string"
          ) {
            let borrowedDate: Date | null = null;
            if (borrow.dateBorrowed?.toDate) {
              borrowedDate = borrow.dateBorrowed.toDate();
            } else if (borrow.dateBorrowed?.seconds) {
              borrowedDate = new Date(borrow.dateBorrowed.seconds * 1000);
            }

            if (borrowedDate) {
              const [d, m, y] = borrow.dueDate.split(".").map(Number);
              const due = new Date(y, m - 1, d);
              daysTotal = Math.ceil(
                (due.getTime() - borrowedDate.getTime()) /
                  (1000 * 60 * 60 * 24),
              );
            }
          }

          return { ...borrow, image_url, daysLeft, daysTotal };
        }),
      );

      // Sort received books: overdue first, then by days left ascending
      const sorted = enriched.sort((a, b) => {
        if (a.daysLeft === null) return 1;
        if (b.daysLeft === null) return -1;
        if (a.daysLeft <= 0 && b.daysLeft > 0) return -1;
        if (a.daysLeft > 0 && b.daysLeft <= 0) return 1;
        return a.daysLeft - b.daysLeft;
      });

      setReceivedBooks(sorted);
    } catch (err: any) {
      console.error("Error loading received books:", err);
      setReceivedBooks([]);
    } finally {
      setReceivedBooksLoading(false);
    }
  }

  // Handle toggle favorite from home screen
  const handleToggleFavorite = async (bookId: string) => {
    if (!currentUser?.uid) {
      Alert.alert("Error", "Please login to add favorites");
      return;
    }

    try {
      const result = await dispatch(
        toggleFavoriteBook({ uid: currentUser.uid, bookId }),
      ).unwrap();

      // Update local favorite status map immediately for UI feedback
      setFavoriteStatusMap((prev) => {
        const newMap = new Map(prev);
        if (result.isFavorite) {
          newMap.set(bookId, true);
        } else {
          newMap.delete(bookId);
        }
        return newMap;
      });

      // Refresh favorite books list in the background
      await dispatch(refreshFavoriteBooks(currentUser.uid));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Initial load
  useEffect(() => {
    loadAllBooks();
    loadCategories();
  }, []);

  // Reload books when category changes
  useEffect(() => {
    loadAllBooks();
  }, [activeCategory]);

  // Load received books when user changes and on focus
  useFocusEffect(
    useCallback(() => {
      loadReceivedBooks();
    }, [currentUser?.uid]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadAllBooks(),
        loadCategories(),
        loadReceivedBooks(),
      ]);
      // Refresh favorites as well
      if (currentUser?.uid) {
        await dispatch(refreshFavoriteBooks(currentUser.uid));
      }
    } catch (e) {
      console.error("Refresh error:", e);
    }
    setRefreshing(false);
  }, [activeCategory, currentUser?.uid]);

  // Refresh favorite books when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser?.uid) {
        dispatch(refreshFavoriteBooks(currentUser.uid));
      }
    }, [currentUser?.uid]),
  );

  // Memoize render for received book item
  const renderReceivedBook = useCallback(
    (book: any) => {
      const isOverdue = book.daysLeft !== null && book.daysLeft <= 0;
      const progressPct =
        book.daysTotal && book.daysLeft !== null
          ? Math.max(
              0,
              Math.min(
                100,
                ((book.daysTotal - Math.max(0, book.daysLeft)) /
                  book.daysTotal) *
                  100,
              ),
            )
          : 0;
      const barColor = isOverdue
        ? "#FF383C"
        : book.daysLeft !== null && book.daysLeft <= 3
          ? "#FFA500"
          : "#00A9FF";

      const daysLabel =
        book.daysLeft === null
          ? book.dueDate || "-"
          : isOverdue
            ? "Overdue!"
            : book.daysLeft === 1
              ? `1 ${t("home.t4")}`
              : `${book.daysLeft} ${t("home.t5")}`;

      return (
        <Pressable
          key={book.id}
          style={styles.receivedBookContainer}
          onPress={() =>
            navigation.navigate("ReceivedBook", { borrowData: book })
          }
        >
          <View style={styles.receivedBookContainerBlock1}>
            <Image
              source={
                book.image_url
                  ? { uri: book.image_url }
                  : require("../../assets/peshraft-library/home/tojikon.jpg")
              }
              style={styles.imgReceivedBook}
            />
          </View>

          <View style={styles.receivedBookContainerBlock2}>
            <Text style={styles.receivedBookName} numberOfLines={2}>
              {book.bookTitle || "-"}
            </Text>
            <Text style={styles.receivedBookAuthor} numberOfLines={1}>
              {book.author || ""}
            </Text>

            <View style={styles.receivedBookLeftDaysWithRangeAndText}>
              <View style={styles.receivedBookLeftDaysWithRangeFullDaysBlock}>
                <View
                  style={[
                    styles.receivedBookLeftDaysWithRangeLeftDaysBlock,
                    {
                      width: `${progressPct}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.receivedBookLeftDays}>{daysLabel}</Text>
            </View>

            <View style={styles.receivedBookStatus}>
              <Text style={styles.receivedBookStatusText}>
                {isOverdue ? "Overdue" : "Active"}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [navigation, t],
  );

  // Memoize render for book item with favorite indicator
  const renderBookItem = useCallback(
    (book: any) => {
      const isFavorite = favoriteStatusMap.get(book.id) || false;

      return (
        <Pressable
          key={book.id}
          style={styles.bookContainer}
          onPress={() => navigation.navigate("Book", { id: book.id })}
        >
          <View style={styles.bookContainerBlock1}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleToggleFavorite(book.id);
              }}
              style={styles.heartIconButton}
            >
              <FontAwesome
                name={isFavorite ? "heart" : "heart-o"}
                size={20}
                color={isFavorite ? "red" : "#939393"}
                style={styles.heartIcon}
              />
            </Pressable>
            <Image
              source={
                book.image_url
                  ? { uri: book.image_url }
                  : require("../../assets/peshraft-library/home/tojikon.jpg")
              }
              style={styles.bookImg}
            />
          </View>
          <View style={styles.bookContainerBlock2}>
            <View style={styles.nameAndAuthorAndRateOfBookBlock}>
              <View style={styles.nameAndAuthorOfBookBlock}>
                <Text style={styles.nameOfBook} numberOfLines={1}>
                  {book.title || "-"}
                </Text>
                <Text style={styles.authorOfBook} numberOfLines={1}>
                  {book.author || ""}
                </Text>
              </View>
              <View style={styles.rateOfBookBlock}>
                <Entypo
                  name="star"
                  size={13}
                  color="orange"
                  style={styles.rateStarIcon}
                />
                <Text style={styles.rateInNumber}>{book.rating || "0"}</Text>
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
                  <Text style={styles.titleOfReaders}>{t("home.t8")}</Text>
                </View>
              </View>
              <View style={styles.forwardIconBlock}>
                <FontAwesome6
                  name="arrow-right-long"
                  size={13}
                  color="black"
                  style={styles.forwardIcon}
                />
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [navigation, t, favoriteStatusMap],
  );

  return (
    <View style={styles.homeComponent}>
      <View style={styles.homeComponentBlock}>
        <View style={styles.headerHomeComponent}>
          <View style={styles.headerBlock1}>
            <View style={styles.logoAndAppNameBlock}>
              <Image
                source={require("../../assets/peshraft-library/introduction/Logo.png")}
                style={styles.logo}
              />
              <Text style={styles.nameOfApp}>{t("home.t1")}</Text>
            </View>
            <MaterialIcons
              name="notifications-none"
              size={35}
              color="black"
              onPress={() => navigation.navigate("Notifications")}
            />
          </View>

          <View style={styles.headerBlock2}>
            <Pressable
              style={styles.btnOpenModalSearchWithInput}
              onPress={() => setModalSearch(true)}
            >
              <Ionicons
                name="search"
                size={30}
                color="black"
                style={styles.searchIconOpenModal}
              />
              <TextInput
                style={styles.inputOpenModalSearch}
                placeholder={t("home.t2")}
                value={searchValue}
                onChangeText={setSearchValue}
                placeholderTextColor={"#939393"}
              />
            </Pressable>
          </View>

          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#00A9FF"]}
              />
            }
            contentContainerStyle={styles.headerBlock3ScrollView}
            style={styles.headerBlock3}
            horizontal
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {categoriesLoading ? (
              <View
                style={{ flexDirection: "row", gap: 10, paddingHorizontal: 10 }}
              >
                {[1, 2, 3, 4].map((item) => (
                  <View
                    key={item}
                    style={{
                      width: 80,
                      height: 35,
                      backgroundColor: "#F0F0F0",
                      borderRadius: 12,
                    }}
                  />
                ))}
              </View>
            ) : (
              categories.map((filter: any) => (
                <Pressable
                  key={filter.id || filter.filterName}
                  onPress={() => setActiveCategory(filter.filterName)}
                  style={[
                    styles.filterBtn,
                    filter.filterName === activeCategory
                      ? styles.filterBtnActive
                      : styles.filterBtnInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      filter.filterName === activeCategory
                        ? styles.filterBtnTextActive
                        : styles.filterBtnTextInactive,
                    ]}
                  >
                    {filter.filterName}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>

        <ScrollView
          contentContainerStyle={styles.sectionHomeComponentScrollView}
          style={styles.sectionHomeComponent}
          showsVerticalScrollIndicator={false}
        >
          {/* Received Books Section */}
          <View style={styles.receivedBooks}>
            <Text style={styles.receivedBookTitle}>{t("home.t3")}</Text>
            {receivedBooksLoading ? (
              <ScrollView
                contentContainerStyle={styles.receivedBooksBlockScrollView}
                style={styles.receivedBooksBlock}
                horizontal
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                <View style={{ flexDirection: "row", gap: 14 }}>
                  {[1, 2].map((item) => (
                    <View
                      key={item}
                      style={[
                        styles.receivedBookContainer,
                        { backgroundColor: "#F9F9F9" },
                      ]}
                    >
                      <View
                        style={[
                          styles.receivedBookContainerBlock1,
                          {
                            justifyContent: "center",
                            alignItems: "center",
                          },
                        ]}
                      >
                        <ActivityIndicator size="small" color="#00A9FF" />
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : receivedBooks.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Text style={{ color: "#939393", fontSize: 14 }}>
                  No borrowed books
                </Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.receivedBooksBlockScrollView}
                style={styles.receivedBooksBlock}
                horizontal
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                {receivedBooks.map(renderReceivedBook)}
              </ScrollView>
            )}
          </View>

          {/* All Books Section */}
          <View style={styles.allBooks}>
            <Text style={styles.allBooksTitle}>{t("home.t6")}</Text>
            <View style={styles.allBooksBlock}>
              {booksError && (
                <View
                  style={{
                    paddingVertical: 20,
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      color: "#FF383C",
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  >
                    {booksError}
                  </Text>
                  <Pressable onPress={loadAllBooks} style={{ marginTop: 10 }}>
                    <Text style={{ color: "#00A9FF", fontSize: 14 }}>
                      Try Again
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Loading Spinner for All Books */}
              {!booksError && loadingBooks && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#00A9FF" />
                  <Text style={styles.loadingText}>Loading books...</Text>
                </View>
              )}

              {!booksError &&
                !loadingBooks &&
                filteredBooks.length === 0 &&
                searchDebounced && (
                  <View
                    style={{
                      paddingVertical: 20,
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <Text style={styles.noBooksText}>
                      No books found for "{searchDebounced}"
                    </Text>
                  </View>
                )}

              {!booksError &&
                !loadingBooks &&
                filteredBooks.length === 0 &&
                !searchDebounced && (
                  <View style={styles.noBooksContainer}>
                    <Text style={styles.noBooksText}>Books not found</Text>
                  </View>
                )}

              {!loadingBooks &&
                !booksError &&
                filteredBooks.map(renderBookItem)}
            </View>
          </View>
        </ScrollView>

        <ModalSearch
          modalSearch={modalSearch}
          setModalSearch={setModalSearch}
        />
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  homeComponent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  homeComponentBlock: {
    flex: 1,
  },
  headerHomeComponent: {
    paddingTop: Platform.OS === "ios" ? 45 : 20,
    paddingBottom: 5,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  headerBlock1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoAndAppNameBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  nameOfApp: {
    color: "#7EC7EC",
    fontSize: 26,
    fontWeight: "400",
  },
  headerBlock2: {
    marginTop: 10,
  },
  btnOpenModalSearchWithInput: {
    position: "relative",
  },
  searchIconOpenModal: {
    position: "absolute",
    zIndex: 5,
    top: 9.5,
    left: 9.5,
  },
  inputOpenModalSearch: {
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
    height: 48,
  },
  headerBlock3ScrollView: {
    marginTop: 10,
    gap: 10,
    paddingHorizontal: 4,
  },
  headerBlock3: {
    maxHeight: 60,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  filterBtnText: {
    fontSize: 16,
    fontWeight: "500",
  },
  filterBtnActive: {
    backgroundColor: "#7EC7EC",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  filterBtnTextActive: {
    color: "#fff",
  },
  filterBtnInactive: {
    borderWidth: 1,
    borderColor: "#939393",
  },
  filterBtnTextInactive: {
    color: "#939393",
  },
  sectionHomeComponent: {
    flex: 1,
  },
  sectionHomeComponentScrollView: {
    paddingBottom: Platform.OS === "ios" ? 250 : 200,
  },
  receivedBooks: {
    marginTop: 20,
    paddingHorizontal: 5,
  },
  receivedBookTitle: {
    fontSize: 21,
    fontWeight: "500",
    color: "#000",
    marginBottom: 15,
  },
  receivedBooksBlockScrollView: {
    gap: 15,
    paddingRight: 5,
    paddingVertical: 10,
  },
  receivedBooksBlock: {},

  receivedBookContainer: {
    width: 280,
    height: 170,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
    flexDirection: "row",
  },
  receivedBookContainerBlock1: {
    width: "40%",
    backgroundColor: "#F5EABD",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  imgReceivedBook: {
    width: "77%",
    height: "77%",
    resizeMode: "contain",
  },
  receivedBookContainerBlock2: {
    padding: 10,
    width: "60%",
  },
  receivedBookTextBlock: {},
  receivedBookName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  receivedBookAuthor: {
    fontSize: 12,
    fontWeight: "400",
    color: "#515151",
  },
  receivedBookLeftDaysWithRangeAndText: {
    marginTop: 15,
  },
  receivedBookLeftDaysWithRangeFullDaysBlock: {
    height: 10,
    backgroundColor: "#D9D9D9",
    borderRadius: 5,
  },
  receivedBookLeftDaysWithRangeLeftDaysBlock: {
    height: 10,
    backgroundColor: "#7EC7EC",
    borderRadius: 5,
  },
  receivedBookLeftDays: {
    fontSize: 12,
    fontWeight: "400",
    color: "#515151",
    marginTop: 4,
    textAlign: "right",
  },
  receivedBookStatus: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginTop: 22,
    borderWidth: 1,
    borderColor: "#404066",
  },
  receivedBookStatusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#404066",
  },
  allBooks: {
    marginTop: 30,
    paddingHorizontal: 10,
  },
  allBooksTitle: {
    fontSize: 21,
    fontWeight: "600",
    color: "#000",
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  allBooksBlock: {
    borderRadius: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 20,
  },
  bookContainer: {
    width: "47%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
  },
  bookContainerBlock1: {
    backgroundColor: "#F5EABD",
    padding: 20,
    position: "relative",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: "center",
    minHeight: 200,
  },
  heartIconButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 5,
  },
  heartIcon: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  bookImg: {
    width: 100,
    height: 140,
    resizeMode: "contain",
  },
  bookContainerBlock2: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  nameAndAuthorAndRateOfBookBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 5,
  },
  nameAndAuthorOfBookBlock: {
    flex: 1,
  },
  nameOfBook: {
    fontSize: 14,
    fontWeight: "600",
  },
  authorOfBook: {
    fontSize: 11,
    fontWeight: "400",
    color: "#515151",
    marginTop: 2,
  },
  rateOfBookBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF8E0",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rateStarIcon: {},
  rateInNumber: {
    fontSize: 10,
    fontWeight: "500",
  },
  numberOfReadersAndForwardIconBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  userIconNumberOfReadersAndTextBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userIcon: {},
  numberAndTextReadersBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
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
    borderColor: "#E0E0E0",
    borderRadius: 50,
    padding: 6,
  },
  forwardIcon: {},
  noBooksText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#939393",
    textAlign: "center",
    marginTop: 40,
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    width: "100%",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#515151",
    textAlign: "center",
    marginTop: 12,
  },
  noBooksContainer: {
    paddingVertical: 20,
    alignItems: "center",
    width: "100%",
  },
});
