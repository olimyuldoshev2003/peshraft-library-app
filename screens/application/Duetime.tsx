import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { getDuetimeNotifications } from "@/firebase/mobile.services";
import { useTranslation } from "react-i18next";

const Duetime = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    getDuetimeNotifications(currentUser.uid)
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser]);

  return (
    <View style={styles.duetimeComponent}>
      <View style={styles.duetimeComponentBlock}>
        <ScrollView
          contentContainerStyle={styles.duetimeNotificationsScrollView}
          style={styles.duetimeNotifications}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <ActivityIndicator
              size="large"
              color="#00A9FF"
              style={{ marginTop: 30 }}
            />
          )}
          {!loading && notifications.length === 0 && (
            <Text style={styles.emptyText}>{t("notifications.t6")}</Text>
          )}
          {!loading && notifications.length > 0 && (
            <View style={styles.duetimeNotificationsContainer}>
              {notifications.map((notif: any) => (
                <View key={notif.id} style={styles.duetimeNotification}>
                  {notif.notification_image_url ? (
                    <Image
                      source={{ uri: notif.notification_image_url }}
                      style={styles.duetimeNotificationImg}
                    />
                  ) : (
                    <Image
                      source={require("../../assets/peshraft-library/home/duetime.jpg")}
                      style={styles.duetimeNotificationImg}
                    />
                  )}
                  <View
                    style={styles.duetimeNotificationTitleAndDescriptionBlock}
                  >
                    <Text style={styles.duetimeNotificationTitle}>
                      {notif.title}
                    </Text>
                    <Text style={styles.duetimeNotificationDescription}>
                      {notif.description}
                    </Text>
                    <Text style={styles.duetimeNotificationTime}>
                      {notif.time || notif.date || ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default Duetime;

const styles = StyleSheet.create({
  duetimeComponent: { flex: 1, backgroundColor: "#fff" },
  duetimeComponentBlock: { paddingHorizontal: 16 },
  duetimeNotificationsScrollView: { paddingHorizontal: 7, paddingBottom: 55 },
  duetimeNotifications: {},
  duetimeNotificationsContainer: { marginTop: 15, gap: 15 },
  emptyText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 18,
    marginTop: 40,
  },
  duetimeNotification: {
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  duetimeNotificationImg: {
    width: "100%",
    height: 95,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  duetimeNotificationTitleAndDescriptionBlock: { padding: 15, gap: 6 },
  duetimeNotificationTitle: { fontSize: 25, fontWeight: "700", color: "#000" },
  duetimeNotificationDescription: {
    fontSize: 18,
    fontWeight: "400",
    color: "#000",
  },
  duetimeNotificationTime: {
    fontSize: 14,
    fontWeight: "400",
    color: "#9E9E9E",
    textAlign: "right",
  },
});
