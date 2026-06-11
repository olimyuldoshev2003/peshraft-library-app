import { useAuth } from "@/context/AuthContext";
import {
  Entypo,
  FontAwesome,
  Fontisto,
  MaterialIcons,
} from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const Profile = ({
  languageModal,
}: {
  languageModal: React.RefObject<any>;
}) => {
  const navigation: any = useNavigation();

  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // const languageModal = useRef<Modalize>(null);

  const { logout, currentUser, userProfile } = useAuth();
  const profileImg = userProfile?.member_image_url || null;

  const dynamicStyles = StyleSheet.create({
    btnTextEdit: {
      fontSize: i18n.language === "ru" ? 13 : 16,
    },
  });

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      await setShowLogoutModal(false);
    } finally {
      setLoading(false);
      Alert.alert("Logged out", "You have been successfully logged out.", [
        {
          text: "OK",
          onPress: () => {},
        },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A9FF" />
        <Text style={{ marginTop: 10, color: "#555" }}>Logging out...</Text>
      </View>
    );
  }

  return (
    <View style={styles.profileComponent}>
      <View style={styles.profileComponentBlock}>
        <View style={styles.headerProfileComponent}>
          <Text style={styles.titleProfileComponent}>{t("profile.t1")}</Text>
          <View style={styles.userImgFullnameAndEmailAndBtnEditBlock}>
            <View style={styles.userImgBlock}>
              <Image
                source={
                  profileImg
                    ? { uri: profileImg }
                    : require("../../assets/peshraft-library/profile/profile-img.jpg")
                }
                style={styles.userImg}
              />
            </View>
            <View style={styles.userFullnameEmailAndBtnEditBlock}>
              <Text style={styles.userFullname}>
                {userProfile?.fullName || currentUser?.displayName || "User"}
              </Text>
              <Text style={styles.userEmail}>
                {userProfile?.email || currentUser?.email || ""}
              </Text>
              <View style={styles.btnEditBlock}>
                <Pressable
                  style={styles.btnEdit}
                  onPress={() => {
                    navigation.navigate("EditUser");
                  }}
                >
                  <Text style={[styles.btnTextEdit, dynamicStyles.btnTextEdit]}>
                    {t("profile.t2")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={styles.sectionProfileComponentScrollView}
          style={styles.sectionProfileComponent}
        >
          {/* General */}
          <View
            style={[styles.generalSection, styles.generalAndAppearanceSection]}
          >
            <Text style={styles.titleOfGeneralAndAppearanceSections}>
              {t("profile.t3")}
            </Text>
            <View
              style={[
                styles.generalFunctionalitiesBlock,
                styles.generalAndAppearanceFunctionalitiesBlock,
              ]}
            >
              {/* History Book */}
              <TouchableHighlight
                style={[styles.btnFunc, styles.historyBookBtn]}
                onPress={() => {
                  navigation.navigate("HistoryBook");
                }}
                underlayColor={"#f0f0f0"}
              >
                <View style={styles.iconFuncTypeAndIconRightSideBlock}>
                  <View style={styles.iconAndFuncTypeBlock}>
                    <View style={styles.iconBlock}>
                      <FontAwesome
                        name="clock-o"
                        size={32}
                        color="black"
                        style={[styles.icon, styles.historyBookIcon]}
                      />
                    </View>
                    <Text style={styles.funcType}>{t("profile.t4")}</Text>
                  </View>
                  <Entypo
                    name="chevron-small-right"
                    size={37}
                    color={"black"}
                    style={styles.rightSideIcon}
                  />
                </View>
              </TouchableHighlight>

              {/* Feedback */}
              <TouchableHighlight
                style={[styles.btnFunc, styles.feedbackBtn]}
                onPress={() => {
                  navigation.navigate("Feedback");
                }}
                underlayColor={"#f0f0f0"}
              >
                <View style={styles.iconFuncTypeAndIconRightSideBlock}>
                  <View style={styles.iconAndFuncTypeBlock}>
                    <View style={styles.iconBlock}>
                      <MaterialIcons
                        name="feedback"
                        size={32}
                        color="black"
                        style={styles.icon}
                      />
                    </View>
                    <Text style={styles.funcType}>{t("profile.t5")}</Text>
                  </View>
                  <Entypo
                    name="chevron-small-right"
                    size={37}
                    color={"black"}
                    style={styles.rightSideIcon}
                  />
                </View>
              </TouchableHighlight>
            </View>
          </View>

          {/* Appearance */}
          <View
            style={[
              styles.appearanceSection,
              styles.generalAndAppearanceSection,
            ]}
          >
            <Text style={styles.titleOfGeneralAndAppearanceSections}>
              {t("profile.t6")}
            </Text>
            <View
              style={[
                styles.appearanceFunctionalitiesBlock,
                styles.generalAndAppearanceFunctionalitiesBlock,
              ]}
            >
              {/* Language */}
              <TouchableHighlight
                style={[styles.btnFuncShownType, styles.languageBtn]}
                underlayColor={"#f0f0f0"}
                onPress={() => {
                  languageModal.current?.open();
                }}
              >
                <View
                  style={
                    styles.iconFuncTypeShownSelectedFuncAndIconRightSideBlock
                  }
                >
                  <View style={styles.iconFuncTypeShownSelectedFuncBlock}>
                    <View style={styles.iconAndFuncTypeBlock}>
                      <View style={styles.iconBlock}>
                        <Fontisto
                          name="world-o"
                          size={32}
                          color="black"
                          style={styles.icon}
                        />
                      </View>
                      <Text style={styles.funcType}>{t("profile.t7")}</Text>
                    </View>
                    <Text style={styles.selectedFunc}>
                      {t(`language.${i18n.language}`)}
                    </Text>
                  </View>
                  <Entypo
                    name="chevron-small-right"
                    size={37}
                    color={"black"}
                    style={styles.rightSideIcon}
                  />
                </View>
              </TouchableHighlight>

              <TouchableHighlight
                style={[styles.btnFunc, styles.updateAppBtn]}
                underlayColor={"#f0f0f0"}
                onPress={() => {
                  // Opens the app store page for this app
                  // Replace the URL with your actual Play Store / App Store link
                  const storeUrl =
                    "https://play.google.com/store/apps/details?id=com.peshraft.library";
                  Linking.openURL(storeUrl).catch(() => {
                    Alert.alert(
                      "Error",
                      "Could not open the store. Please try again.",
                    );
                  });
                }}
              >
                <View style={styles.iconFuncTypeAndIconRightSideBlock}>
                  <View style={styles.iconAndFuncTypeBlock}>
                    <View style={styles.iconBlock}>
                      <Entypo
                        name="cycle"
                        size={30}
                        color="black"
                        style={styles.icon}
                      />
                    </View>
                    <Text style={styles.funcType}>{t("profile.t8")}</Text>
                  </View>
                  <Entypo
                    name="chevron-small-right"
                    size={37}
                    color={"black"}
                    style={styles.rightSideIcon}
                  />
                </View>
              </TouchableHighlight>

              <TouchableHighlight
                style={[styles.btnFunc, styles.logoutBtn]}
                onPress={() => setShowLogoutModal(true)}
                underlayColor={"#f0f0f0"}
              >
                <View style={styles.iconFuncTypeAndIconRightSideBlock}>
                  <View style={styles.iconAndFuncTypeBlock}>
                    <View style={styles.iconBlock}>
                      <MaterialIcons
                        name="logout"
                        size={30}
                        color="black"
                        style={styles.icon}
                      />
                    </View>
                    <Text style={styles.funcType}>{t("profile.t9")}</Text>
                  </View>
                  <Entypo
                    name="chevron-small-right"
                    size={37}
                    color={"black"}
                    style={styles.rightSideIcon}
                  />
                </View>
              </TouchableHighlight>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLogoutModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalIconContainer}>
                  <MaterialIcons name="logout" size={60} color="#FF3B30" />
                </View>
                <Text style={styles.modalTitle}>{t("logoutModal.t1")}</Text>
                <Text style={styles.modalMessage}>{t("logoutModal.t2")}</Text>
                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowLogoutModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>
                      {t("logoutModal.t3")}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, styles.logoutButton]}
                    onPress={handleLogout}
                  >
                    <Text style={styles.logoutButtonText}>
                      {t("logoutModal.t4")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  profileComponent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  profileComponentBlock: {
    padding: 20,
    paddingTop: 35,
  },
  headerProfileComponent: {},
  titleProfileComponent: {
    textAlign: "center",
    fontSize: 25,
    fontWeight: "500",
  },

  sectionProfileComponentScrollView: {
    paddingBottom: 170,
  },
  sectionProfileComponent: {},
  userImgFullnameAndEmailAndBtnEditBlock: {
    marginTop: 20,
    flexDirection: "row",
    gap: 15,
  },
  userImgBlock: {},
  userImg: {
    width: 120,
    height: 120,
    borderRadius: 100,
  },
  userFullnameEmailAndBtnEditBlock: {},
  userFullname: {
    fontSize: 21,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "400",
    color: "#939393",
  },
  btnEditBlock: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  btnEdit: {
    backgroundColor: "#00A9FF",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 8,
  },
  btnTextEdit: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },

  ////////////////////////////////////////////////////

  generalSection: {},
  generalFunctionalitiesBlock: {},
  historyBookBtn: {},
  historyBookIcon: {
    paddingVertical: 1,
    paddingHorizontal: 4,
  },

  feedbackBtn: {},

  appearanceSection: {},
  appearanceFunctionalitiesBlock: {},
  languageBtn: {},
  updateAppBtn: {},
  logoutBtn: {},

  // Styles with the same properties
  generalAndAppearanceSection: {
    marginTop: 20,
    borderRadius: 12,
    gap: 12,
  },
  titleOfGeneralAndAppearanceSections: {
    color: "#000",
    fontSize: 22,
    fontWeight: "500",
  },
  generalAndAppearanceFunctionalitiesBlock: {
    gap: 20,
  },

  // Styles with the same properties for buttons, which showed selected type of functionality
  btnFuncShownType: {
    borderRadius: 12,
  },
  iconFuncTypeShownSelectedFuncAndIconRightSideBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconFuncTypeShownSelectedFuncBlock: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconAndFuncTypeBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBlock: {
    backgroundColor: "#D9D9D9",
    padding: 10,
    borderRadius: 50,
  },
  icon: {},
  funcType: {
    fontSize: 18,
    fontWeight: "400",
    color: "#000",
  },
  selectedFunc: {
    fontSize: 13,
    fontWeight: "400",
    color: "#626262",
  },
  rightSideIcon: {},

  // Styles with the same properties for buttons, which didn't show selected type of functionality
  btnFunc: {
    borderRadius: 12,
  },
  iconFuncTypeAndIconRightSideBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  ////////////////////////////////////////////////////

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    width: "85%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIconContainer: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F2F2F2",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
