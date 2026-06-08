import React, { Dispatch, SetStateAction, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
// @ts-ignore
import Stars from "react-native-stars";
import { useTranslation } from "react-i18next";
import { getBookReviews } from "@/firebase/mobile.services";
import { useAuth } from "@/context/AuthContext";

const ReviewBook = ({
  route,
  setModalAddReview,
}: {
  route: any;
  setModalAddReview?: Dispatch<SetStateAction<boolean>>;
  book?: any;
}) => {
  const filterButtons = [
    { id: 1, title: "All", active: true },
    { id: 2, title: "Interesting", active: false },
    { id: 3, title: "Complain", active: false },
    { id: 4, title: "Feedback", active: false },
  ];

  const [rating] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All");
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchTempValue, setSearchTempValue] = useState("");

  const bookId = route?.params?.id || route?.params?.bookId;

  async function loadData() {
    if (!bookId) return;
    setLoadingReviews(true);
    getBookReviews(bookId)
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoadingReviews(false));
  }

  useEffect(() => {
    loadData();
  }, [bookId]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (e) {}
    setRefreshing(false);
  }, [bookId]);

  // Filter reviews based on search value and active filter
  const filteredReviews = reviews.filter((rev: any) => {
    const matchesFilter =
      activeFilter === "All" || rev.review_category === activeFilter;
    const matchesSearch =
      searchValue === "" ||
      rev.review?.toLowerCase().includes(searchValue.toLowerCase()) ||
      rev.userName?.toLowerCase().includes(searchValue.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenSearchModal = () => {
    setSearchTempValue(searchValue);
    setSearchModalVisible(true);
  };

  const handleSearchSubmit = () => {
    setSearchValue(searchTempValue);
    setSearchModalVisible(false);
  };

  const handleClearSearch = () => {
    setSearchTempValue("");
    setSearchValue("");
    setSearchModalVisible(false);
  };

  const handleCloseModal = () => {
    setSearchModalVisible(false);
  };

  return (
    <>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00A9FF"]}
          />
        }
        contentContainerStyle={styles.reviewBookComponentScrollView}
        style={styles.reviewBookComponent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.reviewBookComponentBlock}>
          <View
            style={
              styles.titleBtnOpenModalAddReviewInpSearchAndFiltersBlockReviewBookComponent
            }
          >
            <View style={styles.titleAndBtnOpenModalAddReview}>
              <Text style={styles.title}>{t("reviewBook.t1")}</Text>
              <Pressable
                style={styles.btnOpenModalAddReview}
                onPress={() => setModalAddReview && setModalAddReview(true)}
              >
                <Feather
                  name="plus-circle"
                  size={22}
                  color="#2623D0"
                  style={styles.btnIconOpenModalAddReview}
                />
                <Text style={styles.btnTextOpenModalAddReview}>
                  {t("reviewBook.t2")}
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.inpSearchBlock}
              onPress={handleOpenSearchModal}
            >
              <Feather
                name="search"
                size={22}
                color="gray"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.inpSearch}
                placeholder={t("reviewBook.t3")}
                value={searchValue}
                editable={false}
                pointerEvents="none"
              />
              {searchValue !== "" && (
                <Pressable
                  style={styles.clearSearchBtn}
                  onPress={handleClearSearch}
                >
                  <Feather name="x" size={20} color="gray" />
                </Pressable>
              )}
            </Pressable>

            <ScrollView
              contentContainerStyle={styles.filterBtnsBlockScrollView}
              style={styles.filterBtnsBlock}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {filterButtons.map((filter) => (
                <Pressable
                  key={filter.id}
                  onPress={() => setActiveFilter(filter.title)}
                  style={[
                    styles.filterBtn,
                    activeFilter === filter.title
                      ? styles.filterBtnActive
                      : styles.filterBtnInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      activeFilter === filter.title
                        ? styles.filterBtnTextActive
                        : styles.filterBtnTextInactive,
                    ]}
                  >
                    {filter.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.reviewsBlock}>
              {loadingReviews && (
                <ActivityIndicator
                  size="large"
                  color="#00A9FF"
                  style={{ marginTop: 20 }}
                />
              )}
              {!loadingReviews &&
                filteredReviews.length === 0 &&
                searchValue !== "" && (
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#999",
                      marginTop: 20,
                      fontSize: 16,
                    }}
                  >
                    No reviews found for "{searchValue}"
                  </Text>
                )}
              {!loadingReviews &&
                filteredReviews.length === 0 &&
                searchValue === "" && (
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#999",
                      marginTop: 20,
                      fontSize: 16,
                    }}
                  >
                    No reviews yet. Be the first!
                  </Text>
                )}
              {filteredReviews.map((rev: any) => (
                <View key={rev.id} style={styles.reviewBlock}>
                  <View style={styles.headerReviewBlock}>
                    <View style={styles.userImgFullnameAndRateBlock}>
                      <Image
                        source={
                          rev.member_image_url
                            ? { uri: rev.member_image_url }
                            : require("../../assets/peshraft-library/book/commented-user.jpg")
                        }
                        style={styles.userImg}
                      />
                      <View style={styles.fullnameAndRateBlock}>
                        <Text style={styles.fullname}>
                          {rev.userName || "User"}
                        </Text>
                        <Stars
                          default={rev.rating || 0}
                          count={5}
                          disabled={true}
                          starSize={50}
                          fullStar={
                            <Entypo name="star" size={22} color="#FCC400" />
                          }
                          emptyStar={
                            <Entypo name="star" size={22} color="#D9D9D9" />
                          }
                          halfStar={
                            <Ionicons
                              name="star-half"
                              size={22}
                              color="#FCC400"
                            />
                          }
                        />
                      </View>
                    </View>
                    <Entypo name="heart-outlined" size={30} color={"#939393"} />
                  </View>
                  <View style={styles.sectionReviewBlock}>
                    <Text style={styles.review}>{rev.review}</Text>
                  </View>
                  <View style={styles.footerReviewBlock}>
                    <Text style={styles.sentDate}>
                      {rev.review_date?.toDate
                        ? rev.review_date.toDate().toLocaleDateString()
                        : rev.review_date || ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setSearchModalVisible(false);
            }}
          >
            <Pressable
              style={styles.modalContainer}
              onPress={(event) => {
                event.stopPropagation();
              }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Search Reviews</Text>
                <Pressable
                  onPress={handleCloseModal}
                  style={styles.modalCloseBtn}
                >
                  <Feather name="x" size={24} color="#333" />
                </Pressable>
              </View>

              <View style={styles.modalSearchBlock}>
                <Feather
                  name="search"
                  size={22}
                  color="gray"
                  style={styles.modalSearchIcon}
                />
                <TextInput
                  style={styles.modalInpSearch}
                  placeholder={t("reviewBook.t3")}
                  placeholderTextColor="#939393"
                  value={searchTempValue}
                  onChangeText={setSearchTempValue}
                  autoFocus={true}
                  returnKeyType="search"
                  onSubmitEditing={handleSearchSubmit}
                />
                {searchTempValue !== "" && (
                  <Pressable
                    onPress={() => setSearchTempValue("")}
                    style={styles.modalClearIcon}
                  >
                    <Feather name="x" size={20} color="gray" />
                  </Pressable>
                )}
              </View>

              <View style={styles.modalButtonsContainer}>
                <Pressable
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalSearchButton]}
                  onPress={handleSearchSubmit}
                >
                  <Feather name="search" size={18} color="#fff" />
                  <Text style={styles.modalSearchButtonText}>Search</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default ReviewBook;

const styles = StyleSheet.create({
  reviewBookComponentScrollView: { paddingBottom: 40 },
  reviewBookComponent: { flex: 1, backgroundColor: "#fff" },
  reviewBookComponentBlock: { padding: 10 },
  titleBtnOpenModalAddReviewInpSearchAndFiltersBlockReviewBookComponent: {},
  titleAndBtnOpenModalAddReview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  title: { color: "#292B38", fontSize: 18, fontWeight: "500" },
  btnOpenModalAddReview: { flexDirection: "row", alignItems: "center", gap: 5 },
  btnIconOpenModalAddReview: {},
  btnTextOpenModalAddReview: {
    color: "#2623D0",
    fontSize: 16,
    fontWeight: "500",
  },
  inpSearchBlock: {
    position: "relative",
    marginTop: 10,
  },
  searchIcon: {
    position: "absolute",
    zIndex: 5,
    top: Platform.OS === "ios" ? 13 : 13.5,
    left: 15,
  },
  clearSearchBtn: {
    position: "absolute",
    right: 15,
    top: Platform.OS === "ios" ? 13 : 13.5,
    zIndex: 5,
  },
  inpSearch: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
    backgroundColor: "#fff",
    fontSize: 20,
    fontWeight: "600",
    borderRadius: 24,
    paddingLeft: 55,
    paddingRight: 45,
    height: Platform.OS === "ios" ? 50 : 48,
  },
  filterBtnsBlockScrollView: { marginTop: 20, gap: 10, paddingHorizontal: 4 },
  filterBtnsBlock: {},
  filterBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12 },
  filterBtnText: { fontSize: 16, fontWeight: "500" },
  filterBtnActive: {
    backgroundColor: "#7EC7EC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  filterBtnTextActive: { color: "#fff" },
  filterBtnInactive: { borderWidth: 1, borderColor: "#939393" },
  filterBtnTextInactive: { color: "#939393" },
  reviewsBlock: { padding: 10 },
  reviewBlock: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 21,
    marginBottom: 12,
  },
  headerReviewBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userImgFullnameAndRateBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  userImg: { width: 44, height: 44, borderRadius: 22 },
  fullnameAndRateBlock: { flex: 1 },
  fullname: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  rate: {},
  sectionReviewBlock: { marginTop: 10 },
  review: { color: "#4D506C", fontSize: 14, fontWeight: "500", lineHeight: 20 },
  footerReviewBlock: { marginTop: 10 },
  sentDate: {
    color: "#C2C2C2",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "right",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#292B38",
  },
  modalCloseBtn: {
    padding: 5,
  },
  modalSearchBlock: {
    position: "relative",
    marginBottom: 20,
  },
  modalSearchIcon: {
    position: "absolute",
    zIndex: 5,
    top: Platform.OS === "ios" ? 14 : 11,
    left: 12,
  },
  modalClearIcon: {
    position: "absolute",
    right: 12,
    top: Platform.OS === "ios" ? 14 : 11,
    zIndex: 5,
  },
  modalInpSearch: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    paddingLeft: 45,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  modalCancelButton: {
    backgroundColor: "#F5F5F5",
  },
  modalCancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  modalSearchButton: {
    backgroundColor: "#00A9FF",
  },
  modalSearchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
