import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";

const { width, height } = Dimensions.get("window");

const IntroductionAboutApp = () => {
  const navigation: any = useNavigation();
  const [modalAnimationFinalIntroduction, setModalAnimationFinalIntroduction] =
    useState<boolean>(false);
  // const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Animation values for modal fade
  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const modalBackgroundFadeAnim = useRef(new Animated.Value(0)).current;
  const contentScaleAnim = useRef(new Animated.Value(0.8)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  const slides = [
    {
      key: 1,
      title: "Book request",
      text: "You can request and read books from the Peshraft library in this app.",
      image: require("../../assets/peshraft-library/introduction/books/rich-dad-poor-dad.jpg"),
      backgroundColor: "#4A6FA5",
    },
    {
      key: 2,
      title: "Online Book",
      text: "You can request a book and read several books online with this release.",
      image: require("../../assets/peshraft-library/introduction/books/rich-dad-poor-dad.jpg"),
      backgroundColor: "#59b2ab",
    },
  ];

  // Open modal with custom fade animation
  const openModalWithAnimation = () => {
    setModalAnimationFinalIntroduction(true);

    // Reset animations
    modalFadeAnim.setValue(0);
    modalBackgroundFadeAnim.setValue(0);
    contentScaleAnim.setValue(0.8);
    contentFadeAnim.setValue(0);

    // Animate modal background fade (400ms duration)
    Animated.timing(modalBackgroundFadeAnim, {
      toValue: 1,
      duration: 400, // Control modal fade duration here
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Animate modal content after a small delay
    setTimeout(() => {
      Animated.parallel([
        // Modal fade animation (500ms duration)
        Animated.timing(modalFadeAnim, {
          toValue: 1,
          duration: 500, // Control modal content fade duration here
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Content scale animation (600ms duration)
        Animated.timing(contentScaleAnim, {
          toValue: 1,
          duration: 600, // Control scale animation duration here
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        // Content fade animation (500ms duration)
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 500, // Control content fade duration here
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);
  };

  // Close modal with custom fade animation
  const closeModalWithAnimation = () => {
    // Animate out
    Animated.parallel([
      // Content fade out (400ms duration)
      Animated.timing(contentFadeAnim, {
        toValue: 0,
        duration: 400, // Control fade-out duration here
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      // Content scale out (400ms duration)
      Animated.timing(contentScaleAnim, {
        toValue: 0.8,
        duration: 400, // Control scale-out duration here
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      // Modal fade out (300ms duration)
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 300, // Control modal fade-out duration here
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate background fade out (200ms duration)
      Animated.timing(modalBackgroundFadeAnim, {
        toValue: 0,
        duration: 200, // Control background fade-out duration here
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setModalAnimationFinalIntroduction(false);
        setModalAnimationFinalIntroduction(false);
      });
    });
  };

  const onDone = () => {
    setModalAnimationFinalIntroduction(true);
    openModalWithAnimation();

    // Keep modal visible for 3 seconds before closing
    setTimeout(() => {
      closeModalWithAnimation();
    }, 3000); // Total display time

    setTimeout(() => {
      navigation.replace("IntroductionAboutBook" as never);
    }, 2990);
  };

  const onSkip = () => {
    setModalAnimationFinalIntroduction(true);
    openModalWithAnimation();

    // Keep modal visible for 3 seconds before closing
    setTimeout(() => {
      closeModalWithAnimation();
    }, 3000);
    setTimeout(() => {
      navigation.replace("IntroductionAboutBook" as never);
    }, 2990);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isLastSlide = index === slides.length - 1;

    return (
      <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
        <View style={styles.contentContainer}>
          {/* Skip Button - Hidden on last slide */}
          {!isLastSlide && (
            <View style={styles.skipButtonContainer}>
              <Text style={styles.skipButtonText} onPress={onSkip}>
                Skip
              </Text>
            </View>
          )}

          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={item.image}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay} />
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>

          {/* Progress Dots */}
          <View style={styles.dotsContainer}>
            {slides.map((slide, dotIndex) => (
              <View
                key={slide.key}
                style={[
                  styles.dot,
                  item.key === slide.key
                    ? styles.activeDot
                    : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderNextButton = () => {
    return (
      <View style={styles.nextButton}>
        <Entypo name="chevron-right" size={24} color="#fff" />
      </View>
    );
  };

  const renderDoneButton = () => {
    return (
      <View style={styles.doneButton}>
        <MaterialIcons name="done" size={24} color="#fff" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent />
      <AppIntroSlider
        renderItem={renderItem}
        data={slides}
        onDone={onDone}
        renderNextButton={renderNextButton}
        renderDoneButton={renderDoneButton}
        showSkipButton={false}
        bottomButton
        dotStyle={styles.hiddenDot}
        activeDotStyle={styles.hiddenDot}
      />

      {/* Custom Modal with controlled animation */}
      <Modal
        visible={modalAnimationFinalIntroduction}
        onRequestClose={closeModalWithAnimation}
        animationType="fade" // Disable default animation
        transparent
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: modalBackgroundFadeAnim,
            },
          ]}
        >
          <ImageBackground
            source={require("../../assets/peshraft-library/introduction/img-bg-final-intro.jpg")}
            style={styles.bgImgModalAnimationFinalIntroduction}
            resizeMode="cover"
          >
            <Animated.View
              style={[
                styles.modalContentContainer,
                {
                  opacity: modalFadeAnim,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.modalAnimationFinalIntroductionMainBlock,
                  {
                    opacity: contentFadeAnim,
                    transform: [{ scale: contentScaleAnim }],
                  },
                ]}
              >
                <Text style={styles.titleInsideBg}>Thank you</Text>
                <Text style={styles.descriptionInsideBg}>
                  May your first step into the library open the door to endless
                  knowledge.
                </Text>
              </Animated.View>
            </Animated.View>
          </ImageBackground>
        </Animated.View>
      </Modal>
    </View>
  );
};

export default IntroductionAboutApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  skipButtonContainer: {
    alignItems: "flex-end",
    marginBottom: 30,
  },
  skipButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    opacity: 0.9,
  },
  imageContainer: {
    width: width * 0.85,
    height: height * 0.45,
    alignSelf: "center",
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginBottom: 40,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "System",
    lineHeight: 38,
  },
  text: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    lineHeight: 26,
    opacity: 0.95,
    fontFamily: "System",
    paddingHorizontal: 10,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: "#fff",
  },
  inactiveDot: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  nextButton: {
    width: 60,
    height: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    position: "absolute",
    right: 0,
    bottom: 40,
  },
  doneButton: {
    width: 60,
    height: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    position: "absolute",
    right: 0,
    bottom: 40,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A6FA5",
  },
  hiddenDot: {
    display: "none",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bgImgModalAnimationFinalIntroduction: {
    flex: 1,
  },
  modalContentContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Semi-transparent overlay
  },
  modalAnimationFinalIntroductionMainBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 20,
  },
  titleInsideBg: {
    textAlign: "center",
    fontSize: 42,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 10,
  },
  descriptionInsideBg: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "400",
    paddingHorizontal: 30,
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 32,
  },
});
