/**
 * CropCard — shows a crop with suitability badge
 * Updated: uses Card wrapper, platform ripple, platform shadow
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import Card from "./Card";
import { typography, spacing, radius } from "../utils/ui";

export default function CropCard({ crop, suitable, onPress }) {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(theme, isDark), [theme, isDark]);

  const accentColor = suitable ? theme.primary : theme.border;
  const iconBg = suitable ? theme.light : isDark ? "#374151" : "#F1F5F9";
  const badgeBg = suitable ? theme.light : isDark ? "#374151" : "#F1F5F9";
  const badgeTextColor = suitable ? theme.primary : theme.subtext;

  return (
    <Card
      onPress={onPress}
      borderLeft={accentColor}
      noPadding
      style={styles.card}
    >
      <View style={styles.inner}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Text style={styles.icon}>{crop.icon}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {crop.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.badgeText, { color: badgeTextColor }]}>
                {suitable ? `✅ ${t("suitable")}` : `❌ ${t("notNow")}`}
              </Text>
            </View>
          </View>

          <Text style={styles.season}>{crop.season}</Text>
          <Text style={styles.tip} numberOfLines={2}>
            {crop.tip}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing[2],
    },
    inner: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing[3] + 1,
    },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: radius.xl,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing[3],
      flexShrink: 0,
    },
    icon: { fontSize: 28 },
    info: { flex: 1 },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing[1],
    },
    name: {
      ...typography.h5,
      color: theme.text,
      flex: 1,
    },
    badge: {
      borderRadius: radius.sm,
      paddingHorizontal: spacing[2],
      paddingVertical: 3,
      marginLeft: spacing[2],
    },
    badgeText: { ...typography.tiny, fontWeight: "700" },
    season: {
      ...typography.caption,
      color: theme.subtext,
      marginBottom: spacing[1],
    },
    tip: {
      ...typography.caption,
      color: theme.subtext,
      lineHeight: 17,
      opacity: 0.8,
    },
  });
}
