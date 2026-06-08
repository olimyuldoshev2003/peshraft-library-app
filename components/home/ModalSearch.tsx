import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AntDesign from "@expo/vector-icons/AntDesign";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import { useTranslation } from "react-i18next";

const ModalSearch = ({
  modalSearch,
  setModalSearch,
}: {
  modalSearch: any;
  setModalSearch: any;
}) => {
  const [inpSearch, setInpSearch] = useState<string>("");

  const { t } = useTranslation();

  return (
    <Modal
      visible={modalSearch}
      // transparent
      animationType="fade"
      onRequestClose={() => {
        setModalSearch(!modalSearch);
      }}
      style={styles.modalSearchComponent}
    >
      <Pressable
        style={styles.overlayModalSearchComponent}
        onPress={() => {
          setModalSearch(false);
        }}
      >
        <Pressable
          style={styles.modalSearchComponentMainBlock}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.headerModalSearch}>
            <Ionicons
              name="search"
              size={30}
              color="black"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.inputSearch}
              placeholder={t("modalSearchHome.t1")}
              value={inpSearch}
              onChangeText={(val) => {
                setInpSearch(val);
              }}
            />

            {inpSearch ? (
              <EvilIcons
                name="close"
                size={29}
                color="black"
                style={[styles.closeIconInCircle, styles.closeModalSearchIcon]}
                onPress={() => {
                  setInpSearch("");
                }}
              />
            ) : (
              <AntDesign
                name="close-circle"
                size={24}
                color="black"
                style={[
                  styles.closeIconInCircle,
                  styles.clearTheInputSearchIcon,
                ]}
                onPress={() => {
                  setModalSearch(false);
                }}
              />
            )}
          </View>
          <View style={styles.sectionModalSearch}>
            <View style={styles.searchedBooksContainer}>
              <View style={styles.searchBooksTitleAndBtnSeeAllBlock}>
                <Text style={styles.searchBooksTitle}>
                  {t("modalSearchHome.t2")}
                </Text>
                <Pressable style={styles.btnSeeAll}>
                  <Text style={styles.btnTextSeeAll}>
                    {t("modalSearchHome.t3")}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.searchedBooksBlock}>
                {/* Book 1 */}
                <View style={styles.searchedBookBlock}>
                  <Text style={styles.searchedBook}>Rich Dad, Poor Dad</Text>
                </View>
                {/* Book 2 */}
                <View style={styles.searchedBookBlock}>
                  <Text style={styles.searchedBook}>Harry Potter</Text>
                </View>
                {/* Book 3 */}
                <View style={styles.searchedBookBlock}>
                  <Text style={styles.searchedBook}>Cashflow Quadrant</Text>
                </View>
              </View>
            </View>
            <View style={styles.recentSearchesContainer}>
              <View style={styles.recentSearchesTitleAndBtnDeleteHistoryBlock}>
                <Text style={styles.recentSearchesTitle}>
                  {t("modalSearchHome.t4")}
                </Text>
                <Pressable style={styles.btnDeleteHistory}>
                  <Text style={styles.btnTextDeleteHistory}>
                    {t("modalSearchHome.t5")}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.recentSearchesBlock}>
                {/* Recent Search 1 */}
                <View style={styles.recentSearchBlock}>
                  <Text style={styles.recentSearch}>Shohnoma</Text>
                  <AntDesign
                    name="close-circle"
                    size={20}
                    color="black"
                    style={styles.deleteRecentSearchIcon}
                  />
                </View>
                {/* Recent Search 2 */}
                <View style={styles.recentSearchBlock}>
                  <Text style={styles.recentSearch}>Tojikon</Text>
                  <AntDesign
                    name="close-circle"
                    size={20}
                    color="black"
                    style={styles.deleteRecentSearchIcon}
                  />
                </View>
                {/* Recent Search 3 */}
                <View style={styles.recentSearchBlock}>
                  <Text style={styles.recentSearch}>Maktabi kuhna</Text>
                  <AntDesign
                    name="close-circle"
                    size={20}
                    color="black"
                    style={styles.deleteRecentSearchIcon}
                  />
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ModalSearch;

const styles = StyleSheet.create({
  modalSearchComponent: {},
  modalSearchComponentBlock: {},
  overlayModalSearchComponent: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalSearchComponentMainBlock: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#fff",
    zIndex: 5,
    paddingTop: 30,
    paddingHorizontal: 12,
  },
  headerModalSearch: {
    position: "relative",
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
    paddingRight: 42,
  },

  // Styles with the same properties
  //////////////////////////////////
  closeIconInCircle: {
    position: "absolute",
    right: 11.5,
    top: 11.5,
  },
  //////////////////////////////////

  clearTheInputSearchIcon: {
  },
  closeModalSearchIcon: {
    
    top: 9,
  },

  sectionModalSearch: {
    marginTop: 30,
  },
  searchedBooksContainer: {},
  searchBooksTitleAndBtnSeeAllBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchBooksTitle: {
    color: "#3E494A",
    fontSize: 22,
    fontWeight: "500",
  },
  btnSeeAll: {},
  btnTextSeeAll: {
    color: "#00A9FF",
    fontSize: 15,
    fontWeight: "400",
    textDecorationLine: "underline",
  },

  searchedBooksBlock: {
    marginTop: 10,
    gap: 10,
  },
  // Styles with the same name of properties - Searched Book
  //////////////////////////////////////////////
  searchedBookBlock: {},
  searchedBook: {
    fontSize: 18,
    fontWeight: "400",
  },
  //////////////////////////////////////////////

  recentSearchesContainer: {
    marginTop: 20,
  },
  recentSearchesTitleAndBtnDeleteHistoryBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentSearchesTitle: {
    color: "#3E494A",
    fontSize: 22,
    fontWeight: "500",
  },

  btnDeleteHistory: {},
  btnTextDeleteHistory: {
    color: "#FF383C",
    fontSize: 15,
    fontWeight: "400",
    textDecorationLine: "underline",
  },

  recentSearchesBlock: {
    marginTop: 10,
    gap: 10,
  },
  // Styles with the same name of properties - Recent Searches
  //////////////////////////////////////////////
  recentSearchBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentSearch: {
    fontSize: 18,
    fontWeight: "400",
  },
  deleteRecentSearchIcon: {},
  //////////////////////////////////////////////
});
