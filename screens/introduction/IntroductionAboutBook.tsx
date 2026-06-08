import { setIsSignedUpUser } from "@/utils/token";
import { useNavigation } from "expo-router";
import React from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const IntroductionAboutBook = () => {
  const navigation: any = useNavigation();

  return (
    <View style={styles.introductionAboutBookComponent}>
      <ImageBackground
        source={require("../../assets/peshraft-library/introduction/bgIntroAboutBook.png")}
        style={styles.imgBgIntroductionAboutBookComponent}
        resizeMode="contain"
      >
        <View style={styles.introductionAboutBookComponentBlock}>
          <View style={styles.headerIntroductionAboutBookComponent}>
            <Image
              source={require("../../assets/peshraft-library/introduction/Logo.png")}
              style={styles.logo}
            />
            <Text style={styles.nameOfApp}>Peshraft Library</Text>
          </View>
          <View style={styles.sectionIntroductionAboutBookComponent}>
            <View style={styles.sectionBlock1Books}>
              <View style={[styles.bookNumber1Block, styles.booksBlocks]}>
                <Image
                  source={require("../../assets/peshraft-library/introduction/books/the-psychology-of-money.jpg")}
                  style={[styles.books, styles.bookNumber1]}
                />
              </View>
              <View style={[styles.bookNumber2Block, styles.booksBlocks]}>
                <Image
                  source={require("../../assets/peshraft-library/introduction/books/7-habits-of-highly-effective-people.jpg")}
                  style={[styles.books, styles.bookNumber2]}
                />
              </View>
              <View style={[styles.bookNumber3Block, styles.booksBlocks]}>
                <Image
                  source={require("../../assets/peshraft-library/introduction/books/the-alchemist.jpg")}
                  style={[styles.books, styles.bookNumber3]}
                />
              </View>
              <View style={[styles.bookNumber4Block, styles.booksBlocks]}>
                <Image
                  source={require("../../assets/peshraft-library/introduction/books/the-steal-like-an-artist-journal.jpg")}
                  style={[styles.books, styles.bookNumber4]}
                />
              </View>
              <View style={[styles.bookNumber5Block, styles.booksBlocks]}>
                <Image
                  source={require("../../assets/peshraft-library/introduction/books/ikigai.jpg")}
                  style={[styles.books, styles.bookNumber5]}
                />
              </View>
              <View style={[styles.bookNumber6Block, styles.booksBlocks]}>
                <Image
                  source={require("../../assets/peshraft-library/introduction/books/the-100$-startup.jpg")}
                  style={[styles.books, styles.bookNumber6]}
                />
              </View>
              <View style={[styles.bookNumber7Block, styles.booksBlocks]}>
                <Image
                  source={require("../../assets/peshraft-library/introduction/books/rich-dad-poor-dad.jpg")}
                  style={[styles.books, styles.bookNumber7]}
                />
              </View>
            </View>
            <View style={styles.sectionBlock2TitleDescriptionAndBtnGetStarted}>
              <Text style={styles.title}>
                Book Has Power To Chanage Everything
              </Text>
              <Text style={styles.description}>
                We have true friend in our life and the books is that. Book has
                power to chnage yourself and make you more valueable.
              </Text>
              <View style={styles.blockBtnGetStarted}>
                <Pressable
                  style={styles.btnGetStarted}
                  onPress={async () => {
                    await setIsSignedUpUser(false);
                    navigation.navigate("Application");
                  }}
                >
                  <Text style={styles.btnTextGetStarted}>Get Started Now</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default IntroductionAboutBook;

const styles = StyleSheet.create({
  introductionAboutBookComponent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  imgBgIntroductionAboutBookComponent: {
    height: "80%",
  },
  introductionAboutBookComponentBlock: {},
  headerIntroductionAboutBookComponent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 29,
    gap: 4,
  },
  logo: {},
  nameOfApp: {
    color: "#7EC7EC",
    fontSize: 26,
    fontWeight: "400",
  },
  sectionIntroductionAboutBookComponent: {},
  sectionBlock1Books: {
    height: 525,
    marginTop: 3,
    position: "relative",
  },
  booksBlocks: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  books: {},
  bookNumber1Block: {
    top: 46,
  },
  bookNumber1: {
    width: 141,
    height: 200,
  },
  bookNumber2Block: {
    top: "11%",
    right: "33.8%",
  },
  bookNumber2: {},
  bookNumber3Block: {
    top: 0,
    right: 0,
  },
  bookNumber3: {},
  bookNumber4Block: {
    bottom: 118,
    left: 28,
  },
  bookNumber4: {},
  bookNumber5Block: {
    bottom: "30%",
    right: "36.9%",
  },
  bookNumber5: {},
  bookNumber6Block: {
    bottom: 0,
    right: "36.9%",
  },
  bookNumber6: {},
  bookNumber7Block: {
    right: 0,
    bottom: 63,
  },
  bookNumber7: {},
  sectionBlock2TitleDescriptionAndBtnGetStarted: {
    marginTop: 14,
    gap: 5,
  },
  title: {
    textAlign: "center",
    color: "#292B38",
    fontSize: 24,
    fontWeight: "600",
  },
  description: {
    textAlign: "center",
    color: "#4D506C",
    fontSize: 17,
    fontWeight: "400",
    paddingHorizontal: 30,
  },
  blockBtnGetStarted: {
    flexDirection: "row",
    justifyContent: "center",
  },
  btnGetStarted: {
    backgroundColor: "#00A9FF",
    borderRadius: 11,
    paddingVertical: 12,
    marginTop: 5,
    width: 200,
  },
  btnTextGetStarted: {
    textAlign: "center",
    color: "#fff",
    fontSize: 19,
    fontWeight: "600",
  },
});
