import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";

// ─── Icon ─────────────────────────────────────────
const Icon = ({ emoji, bg }: { emoji: string; bg: string }) => (
  <View style={[styles.iconBox, { backgroundColor: bg }]}>
    <Text style={styles.iconEmoji}>{emoji}</Text>
  </View>
);

// ─── MenuItem ─────────────────────────────────────
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

// ─── Section ──────────────────────────────────────
const Section = ({
  title,
  items,
}: {
  title: string;
  items: { label: string; emoji: string; bg: string; onPress: () => void }[];
}) => {
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
          {row.length === 1 && <View style={styles.menuItem} />}
        </View>
      ))}
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────
export default function NhieuHonScreen() {
  const router = useRouter();

  // Data đặt TRONG component để dùng router
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
    {
      label: "Hàng hoá",
      emoji: "📦",
      bg: "#E8F4FF",
      onPress: () => router.push("/hanghoa"),
    },
    {
      label: "Nhập hàng",
      emoji: "📥",
      bg: "#E8F4FF",
      onPress: () => router.push("/nhaphang"),
    },
  ];

  const quanlyItems = [
    {
      label: "Nhân viên",
      emoji: "👤",
      bg: "#E8F4FF",
      onPress: () => router.push("/nhanvien"),
    },
    {
      label: "Nhà cung cấp",
      emoji: "🏭",
      bg: "#E8F4FF",
      onPress: () => router.push("/nhacungcap"),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.storeName}>Cửa hàng</Text>
        </View>

        <TouchableOpacity activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <Section title="Giao dịch" items={giaoDichItems} />
        <Section title="Hàng hoá" items={hangHoaItems} />
        <Section title="Quản lý" items={quanlyItems} />

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => alert("Đăng xuất")}
        >
          <Text style={styles.logoutEmoji}>🚪</Text>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F2F7" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },

  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: { fontSize: 22 },

  storeName: { fontSize: 16, fontWeight: "700" },

  section: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },

  row: { flexDirection: "row" },

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
  },

  iconEmoji: { fontSize: 20 },

  menuLabel: { fontSize: 14, fontWeight: "500" },

  logoutBtn: {
    backgroundColor: "#FFF",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
  },

  logoutEmoji: { fontSize: 20 },

  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF3B30",
  },
});