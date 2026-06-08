import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { sendReturnBookRequest } from "@/firebase/mobile.services";

const ReturnBook = ({ route }: { route?: any }) => {
  const navigation: any = useNavigation();
  const { currentUser, userProfile } = useAuth();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // borrowData is passed from ReceivedBook screen
  const borrowData = route?.params?.borrowData;

  if (!borrowData) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons
          name="arrow-left-thin-circle-outline"
          size={45}
          color="black"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.emptyText}>No book data found.</Text>
      </View>
    );
  }

  const handleConfirmReturn = async () => {
    if (!currentUser || !userProfile) {
      Alert.alert("Error", "You must be logged in.");
      return;
    }

    Alert.alert(
      "Confirm Return",
      `Are you sure you want to return "${borrowData.bookTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Return",
          style: "destructive",
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await sendReturnBookRequest({
                borrowId: borrowData.id,
                userId: borrowData.userId,
                bookId: borrowData.bookId,
                bookTitle: borrowData.bookTitle,
                author: borrowData.author || "",
                borrowerName: borrowData.borrowerName || userProfile.fullName || "",
                phoneNumber: borrowData.phoneNumber || userProfile.phoneNumber || "",
                email: borrowData.email || userProfile.email || currentUser.email || "",
                member_image_url: userProfile.member_image_url || "",  // ✅ spec requires this
                dateBorrowed: borrowData.dateBorrowed,
                dueDate: borrowData.dueDate,
              });

              Alert.alert(
                "Return Request Sent!",
                "The admin will process your return request. Your bookshelf will update once approved.",
                [{ text: "OK", onPress: () => navigation.navigate("Bookshelf") }]
              );
            } catch (error: any) {
              Alert.alert("Error", error.message || "Something went wrong.");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.block}>
        {/* Back button */}
        <MaterialCommunityIcons
          name="arrow-left-thin-circle-outline"
          size={45}
          color="black"
          onPress={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Return Book</Text>

          {/* Book image */}
          <View style={styles.imageBlock}>
            <Image
              source={
                borrowData.image_url
                  ? { uri: borrowData.image_url }
                  : require("../../assets/peshraft-library/home/tojikon.jpg")
              }
              style={styles.bookImage}
            />
          </View>

          {/* Book info */}
          <Text style={styles.bookTitle}>{borrowData.bookTitle || "-"}</Text>
          <Text style={styles.bookAuthor}>{borrowData.author || ""}</Text>

          {/* Borrow details */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Borrower</Text>
              <Text style={styles.detailValue}>
                {borrowData.borrowerName || userProfile?.fullName || "-"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={[styles.detailValue, { color: "#FF383C" }]}>
                {borrowData.dueDate || "-"}
              </Text>
            </View>
          </View>

          <Text style={styles.infoNote}>
            When you tap "Confirm Return", a request will be sent to the admin. 
            The book will be marked as returned once the admin approves.
          </Text>

          {/* Confirm button */}
          <Pressable
            style={[styles.confirmBtn, isSubmitting && styles.confirmBtnDisabled]}
            onPress={handleConfirmReturn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm Return</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
};

export default ReturnBook;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  block: { padding: 18, paddingTop: 26, flex: 1 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 18 },
  scrollContent: { marginTop: 20, gap: 16, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: "600", textAlign: "center" },
  imageBlock: { justifyContent: "center", alignItems: "center" },
  bookImage: {
    width: 180,
    height: 260,
    resizeMode: "contain",
    borderRadius: 8,
    elevation: 5,
    backgroundColor: "#f0f0f0",
  },
  bookTitle: { fontSize: 24, fontWeight: "600", textAlign: "center" },
  bookAuthor: { fontSize: 18, color: "#939393", textAlign: "center" },
  detailsCard: {
    backgroundColor: "#F5F8FF",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 15, color: "#666" },
  detailValue: { fontSize: 15, fontWeight: "600" },
  infoNote: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  confirmBtn: {
    backgroundColor: "#00A9FF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  confirmBtnDisabled: { backgroundColor: "#7fcfef" },
  confirmBtnText: { color: "#fff", fontSize: 20, fontWeight: "600" },
});