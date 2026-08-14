import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadow } from "../theme/tokens";
import { TabName } from "../../App";

const tabs: { name: TabName; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }[] = [
  { name: "Today", icon: "home-outline", active: "home" },
  { name: "Activity", icon: "pulse-outline", active: "pulse" },
  { name: "Integrations", icon: "grid-outline", active: "grid" },
  { name: "More", icon: "options-outline", active: "options" },
];

export function Shell({ children, tab, onTabChange, pending }: { children: React.ReactNode; tab: TabName; onTabChange: (tab: TabName) => void; pending: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.shell, Platform.OS === "web" && styles.webShell]}>
      <View style={styles.content}>{children}</View>
      <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 9) }]}>
        {tabs.map((item) => {
          const selected = item.name === tab;
          return <Pressable key={item.name} onPress={() => onTabChange(item.name)} style={styles.navItem} accessibilityRole="tab" accessibilityState={{ selected }}>
            <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
              <Ionicons name={selected ? item.active : item.icon} size={21} color={selected ? colors.leafDeep : colors.muted} />
              {item.name === "Activity" && pending > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{pending}</Text></View>}
            </View>
            <Text style={[styles.navLabel, selected && styles.navLabelActive]}>{item.name}</Text>
          </Pressable>;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.cream }, webShell: { width: 430, maxWidth: "100%", alignSelf: "center", borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.line }, content: { flex: 1 },
  nav: { flexDirection: "row", paddingTop: 9, paddingHorizontal: 10, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line, ...shadow },
  navItem: { flex: 1, alignItems: "center", gap: 3 }, iconWrap: { width: 43, height: 29, borderRadius: 16, alignItems: "center", justifyContent: "center" }, iconWrapActive: { backgroundColor: colors.leafPale },
  navLabel: { fontFamily: "DMSans_600SemiBold", fontSize: 10, color: colors.muted }, navLabelActive: { color: colors.leafDeep },
  badge: { position: "absolute", right: 3, top: -3, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: colors.tomato, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.paper },
  badgeText: { color: "white", fontFamily: "DMSans_700Bold", fontSize: 8 },
});
