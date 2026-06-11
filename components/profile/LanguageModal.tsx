import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  Alert,
} from "react-native";
import { Modalize } from "react-native-modalize";

const LanguageModal = ({ languageModal }: { languageModal: any }) => {
  //for translation
  const { t, i18n } = useTranslation();

  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedLanguageValue, setSelectedLanguageValue] = useState("en");

  const [languages, setLanguages] = useState([
    {
      id: 1,
      name: "Русский",
      value: "ru",
      flag: require("../../assets/peshraft-library/profile/ru-lang.jpg"),
      searchTerms: ["russian", "русский", "русӣ"],
    },
    {
      id: 2,
      name: "Тоҷикӣ",
      value: "tj",
      flag: require("../../assets/peshraft-library/profile/tj-lang.jpg"),
      searchTerms: ["tajik", "таджикский", "тоҷикӣ"],
    },
    {
      id: 3,
      name: "English",
      value: "en",
      flag: require("../../assets/peshraft-library/profile/en-lang.jpg"),
      searchTerms: ["english", "английский", "англисӣ"],
    },
  ]);

  useEffect(() => {
    // Load saved language from storage or use device default
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await i18n.language;
        if (savedLanguage) {
          let langValue = savedLanguage;
          let langName = "English";

          if (savedLanguage === "ru") {
            langName = "Русский";
          } else if (savedLanguage === "tj") {
            langName = "Тоҷикӣ";
          } else {
            langName = "English";
            langValue = "en";
          }

          setSelectedLanguage(langName);
          setSelectedLanguageValue(langValue);
        }
      } catch (error) {
        console.error("Error loading saved language:", error);
      }
    };

    loadSavedLanguage();
  }, []);

  // Update languages when translation changes
  useEffect(() => {
    setLanguages([
      {
        id: 1,
        name: t("language.ru"),
        value: "ru",
        flag: require("../../assets/peshraft-library/profile/ru-lang.jpg"),
        searchTerms: ["russian", "русский", "русӣ"],
      },
      {
        id: 2,
        name: t("language.tj"),
        value: "tj",
        flag: require("../../assets/peshraft-library/profile/tj-lang.jpg"),
        searchTerms: ["tajik", "таджикский", "тоҷикӣ"],
      },
      {
        id: 3,
        name: t("language.en"),
        value: "en",
        flag: require("../../assets/peshraft-library/profile/en-lang.jpg"),
        searchTerms: ["english", "английский", "англисӣ"],
      },
    ]);
  }, [t]);

  // Also update selectedLanguage name when languages change
  useEffect(() => {
    const currentLang = languages.find(
      (lang) => lang.value === selectedLanguageValue,
    );
    if (currentLang) {
      setSelectedLanguage(currentLang.name);
    }
  }, [languages, selectedLanguageValue]);

  function closeLanguageModal() {
    languageModal.current?.close();
  }

  const handleChangeLanguage = async (
    languageName: string,
    languageValue: string,
  ) => {
    try {
      // Update state
      setSelectedLanguage(languageName);
      setSelectedLanguageValue(languageValue);

      // Change language using i18n instance
      await i18n.changeLanguage(languageValue);

      // Get translated alert messages based on the selected language
      let alertMessage = "";

      switch (languageValue) {
        case "en":
          alertMessage = "Language changed to English";
          break;
        case "ru":
          alertMessage = "Язык изменен на русский";
          break;
        case "tj":
          alertMessage = "Забон ба тоҷикӣ иваз карда шуд";
          break;
        default:
          alertMessage = `Language changed to ${languageName}`;
      }

      // Show alert message
      Alert.alert(alertMessage);

      // Close modal after language change
      closeLanguageModal();
    } catch (error) {
      console.error("Error changing language:", error);
      let errorMessage = "";

      switch (i18n.language) {
        case "en":
          errorMessage = "Failed to change language";
          break;
        case "ru":
          errorMessage = "Не удалось изменить язык";
          break;
        case "tj":
          errorMessage = "Забонро иваз кардан муяссар нашуд";
          break;
        default:
          errorMessage = "Failed to change language";
      }

      Alert.alert(errorMessage);
    }
  };

  return (
    <Modalize
      ref={languageModal}
      adjustToContentHeight={false}
      modalHeight={320}
      withHandle={true}
    >
      <View style={styles.languageModalComponent}>
        <View style={styles.languageModalComponentBlock}>
          <View style={styles.languageModalComponentHeader}>
            <Text style={styles.titleLanguageModal}>
              {t("language.selectLang") || "Select language"}
            </Text>
          </View>

          <View style={styles.languageModalComponentSection}>
            {/* Language */}
            {languages.map((language) => (
              <TouchableHighlight
                style={[
                  styles.btnChangeLanguage,
                  selectedLanguageValue === language.value &&
                    styles.selectedLanguage,
                ]}
                underlayColor={"#f0f0f0"}
                key={language.id}
                onPress={() =>
                  handleChangeLanguage(language.name, language.value)
                }
              >
                <View style={styles.languageOption}>
                  <View style={styles.languageFlagAndName}>
                    <Image source={language.flag} style={styles.languageFlag} />
                    <Text style={styles.languageName}>{language.name}</Text>
                  </View>
                  {selectedLanguageValue === language.value && (
                    <Image
                      source={require("../../assets/peshraft-library/profile/circle-check.png")}
                      style={styles.checklanguageIcon}
                    />
                  )}
                </View>
              </TouchableHighlight>
            ))}
          </View>
        </View>
      </View>
    </Modalize>
  );
};

export default LanguageModal;

const styles = StyleSheet.create({
  languageModalComponent: {
    flex: 1,
  },
  languageModalComponentBlock: {
    padding: 10,
  },
  languageModalComponentHeader: {
    marginBottom: 10,
  },
  titleLanguageModal: {
    fontSize: 24,
    fontWeight: "500",
    textAlign: "center",
  },
  languageModalComponentSection: {
    marginTop: 10,
    flexDirection: "column",
    gap: 15,
  },
  btnChangeLanguage: {
    padding: 10,
    borderRadius: 10,
  },
  selectedLanguage: {
    backgroundColor: "#E9F6FD",
  },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  languageFlagAndName: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  languageFlag: {
    width: 44,
    height: 22,
    borderRadius: 4,
  },
  languageName: {
    fontSize: 18,
    fontWeight: "400",
  },
  checklanguageIcon: {
    width: 24,
    height: 24,
  },
});
