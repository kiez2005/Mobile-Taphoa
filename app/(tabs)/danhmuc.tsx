import { router } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Icon = ({
  emoji,
  bg,
}: {
  emoji: string;
  bg: string;
}) => (
  <View style={[styles.iconBox, { backgroundColor: bg }]}>
    <Text style={styles.iconEmoji}>{emoji}</Text>
  </View>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const giaoDichItems = [
  {
    label: "Bán hàng",
    emoji: "🛒",
    bg: "#E8F4FF",
    onPress: () => router.push("/banhang"),
  },
  {
    label: "Hóa đơn",
    emoji: "📋",
    bg: "#E8F4FF",
    onPress: () => router.push("/hoadon"),
  },
];

const hangHoaItems = [
  { label: "Hàng hoá", emoji: "📦", bg: "#E8F4FF", onPress: () => {} },
  { label: "Nhập hàng", emoji: "📥", bg: "#E8F4FF", onPress: () => {} },
];

const quanlyItems = [
  { label: "Nhân viên", emoji: "👤", bg: "#E8F4FF", onPress: () => {} },
  { label: "Nhà cung cấp", emoji: " 🏭 ", bg: "#E8F4FF", onPress: () => {} },
]

const dangXuatItem = { label: "Đăng xuất", emoji: "🚪", bg: "#FFE8E8", onPress: () => {} };


// ─── MenuItem ─────────────────────────────────────────────────────────────────

const MenuItem = ({
  emoji,
  bg,
  label,
  onPress,
}: {
  emoji: string;
  bg: string;
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <Icon emoji={emoji} bg={bg} />
    <Text style={styles.menuLabel}>{label}</Text>
  </TouchableOpacity>
);

// ─── Section ──────────────────────────────────────────────────────────────────

const Section = ({
  title,
  items,
}: {
  title: string;
  items: { label: string; emoji: string; bg: string; onPress: () => void }[];
}) => {
  // Split into rows of 2
  const rows: typeof items[] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rows.map((row, rIdx) => (
        <View key={rIdx} style={styles.row}>
          {row.map((item, iIdx) => (
            <MenuItem key={iIdx} {...item} />
          ))}
          {/* Fill empty slot if odd item */}
          {row.length === 1 && <View style={styles.menuItem} />}
        </View>
      ))}
    </View>
  );
};


// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NhieuHonScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View>
            <Text style={styles.storeName}>Cửa hàng</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>


      {/* Scrollable Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Giao dịch" items={giaoDichItems} />
        <Section title="Hàng hoá" items={hangHoaItems} />
        <Section title="Quản lý" items={quanlyItems} />
        
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7}>
          <Text style={styles.logoutEmoji}>🚪</Text>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
      

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: { fontSize: 22 },
  storeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  storeBranch: {
    fontSize: 13,
    color: "#888",
    marginTop: 1,
  },
  editBtn: {
    padding: 6,
  },
  editIcon: { fontSize: 18 },

  // Trial Banner
  trialBanner: {
    backgroundColor: "#FFFFFF",
    marginTop: 8,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  trialText: { fontSize: 14, color: "#111" },
  trialBold: { fontWeight: "600" },
  trialTag: {
    color: "#FF9500",
    fontWeight: "500",
  },
  trialChevron: {
    fontSize: 20,
    color: "#C7C7CC",
    fontWeight: "300",
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    marginHorizontal: 16,  
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderRadius: 16,       
    shadowColor: "#000",    
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,       
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },

  // Grid row
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },

  // Menu Item
  menuItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  iconEmoji: { fontSize: 20 },
  menuLabel: {
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
    flexShrink: 1,
  },
  logoutBtn: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutEmoji: { fontSize: 20 },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF3B30",
  },

  
});