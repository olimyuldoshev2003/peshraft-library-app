import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getNewsNotifications } from "@/firebase/mobile.services";
import { useTranslation } from "react-i18next";

const News = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getNewsNotifications()
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.duetimeComponent}>
      <View style={styles.duetimeComponentBlock}>
        <ScrollView
          contentContainerStyle={styles.newsBlockScrollView}
          style={styles.newsBlock}
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
            <Text style={styles.emptyText}>{t("notifications.t7")}</Text>
          )}
          {!loading && notifications.length > 0 && (
            <View style={styles.newsContainer}>
              {notifications.map((notif: any) => (
                <View key={notif.id} style={styles.news}>
                  {notif.notification_image_url ? (
                    <Image
                      source={{ uri: notif.notification_image_url }}
                      style={styles.newsImg}
                    />
                  ) : (
                    <Image
                      source={require("../../assets/peshraft-library/home/event.jpg")}
                      style={styles.newsImg}
                    />
                  )}
                  <View style={styles.newsTitleAndDescriptionBlock}>
                    <Text style={styles.newsTitle}>{notif.title}</Text>
                    <Text style={styles.newsDescription}>
                      {notif.description}
                    </Text>
                    <Text style={styles.newsTime}>
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

export default News;

const styles = StyleSheet.create({
  duetimeComponent: { flex: 1, backgroundColor: "#fff" },
  duetimeComponentBlock: { paddingHorizontal: 16 },
  newsBlockScrollView: {
    paddingHorizontal: 7,
    paddingBottom: 55,
  },
  newsBlock: {},
  newsContainer: { marginTop: 15, gap: 15 },
  emptyText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 18,
    marginTop: 40,
  },
  news: {
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  newsImg: {
    width: "100%",
    height: 125,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  newsTitleAndDescriptionBlock: { padding: 15, gap: 6 },
  newsTitle: { fontSize: 22, fontWeight: "700", color: "#000" },
  newsDescription: { fontSize: 15, fontWeight: "400", color: "#000" },
  newsTime: {
    fontSize: 14,
    fontWeight: "400",
    color: "#9E9E9E",
    textAlign: "right",
  },
});
