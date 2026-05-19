import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import Analytics from "../utils/analytics";
import { useEffect } from "react";

const SECTIONS = [
  { icon: "📋", titleKey: "pp_collect_title", bodyKey: "pp_collect_body" },
  { icon: "🔧", titleKey: "pp_use_title", bodyKey: "pp_use_body" },
  { icon: "🤝", titleKey: "pp_share_title", bodyKey: "pp_share_body" },
  { icon: "💾", titleKey: "pp_storage_title", bodyKey: "pp_storage_body" },
  { icon: "🛡️", titleKey: "pp_security_title", bodyKey: "pp_security_body" },
  { icon: "👤", titleKey: "pp_rights_title", bodyKey: "pp_rights_body" },
  { icon: "📞", titleKey: "pp_contact_title", bodyKey: "pp_contact_body" },
];

export default function PrivacyPolicyScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    Analytics.logScreenView("PrivacyPolicyScreen");
    Analytics.logEvent(Analytics.Events.PRIVACY_VIEWED);
  }, []);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>🔒</Text>
          <Text style={styles.headerTitle}>{t("privacyTitle")}</Text>
          <Text style={styles.headerSub}>{t("lastUpdated")}: 2026-01-01</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.introBox,
            { backgroundColor: "#E3F2FD", borderColor: "#90CAF9" },
          ]}
        >
          <Text style={[styles.introText, { color: "#1565C0" }]}>
            {t("pp_intro")}
          </Text>
        </View>

        {SECTIONS.map((s) => (
          <View
            key={s.titleKey}
            style={[
              styles.section,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{s.icon}</Text>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t(s.titleKey)}
              </Text>
            </View>
            <Text style={[styles.sectionBody, { color: theme.subtext }]}>
              {t(s.bodyKey)}
            </Text>
          </View>
        ))}

        <View
          style={[
            styles.contactBox,
            { backgroundColor: "#E8F5E9", borderColor: "#A5D6A7" },
          ]}
        >
          <Text style={styles.contactTitle}>HANARAD Team</Text>
          <Text style={styles.contactEmail}>support@hanarad.app</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    backgroundColor: "#1565C0",
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  backText: { fontSize: 28, color: "#fff", fontWeight: "300" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerEmoji: { fontSize: 30, marginBottom: 4 },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },

  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },

  introBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  introText: { fontSize: 14, lineHeight: 22, fontWeight: "500" },

  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  sectionIcon: { fontSize: 24 },
  sectionTitle: { fontSize: 15, fontWeight: "800", flex: 1 },
  sectionBody: { fontSize: 13, lineHeight: 21 },

  contactBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginTop: 8,
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 4,
  },
  contactEmail: { fontSize: 14, color: "#388E3C", fontWeight: "600" },
});
