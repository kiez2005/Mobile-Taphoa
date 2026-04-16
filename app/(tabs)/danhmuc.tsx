import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SW } = Dimensions.get("window");

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#F0F4FF",
  card: "#FFFFFF",
  blue: "#1655D8",
  blueSoft: "#EEF3FF",
  blueDeep: "#0D3DAD",
  text: "#0A1628",
  sub: "#6B7A99",
  border: "#E8EDF8",
  red: "#E53935",
  redSoft: "#FFF0F0",
  green: "#1B8A5A",
  greenSoft: "#EDFAF4",
  orange: "#E67E22",
  orangeSoft: "#FFF5EA",
  teal: "#0097A7",
  tealSoft: "#E0F7FA",
  purple: "#6B3FA0",
  purpleSoft: "#F3EEFF",
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    title: "Giao dịch",
    items: [
      {
        label: "Bán hàng",
        sub: "Tạo đơn nhanh",
        emoji: "🛒",
        accent: T.blue,
        soft: T.blueSoft,
        onPress: () => router.push("/banhang"),
      },
      {
        label: "Hóa đơn",
        sub: "Tra cứu lịch sử",
        emoji: "📋",
        accent: T.teal,
        soft: T.tealSoft,
        onPress: () => router.push("/hoadon"),
      },
    ],
  },
  {
    title: "Kho hàng",
    items: [
      {
        label: "Hàng hoá",
        sub: "Quản lý sản phẩm",
        emoji: "📦",
        accent: T.orange,
        soft: T.orangeSoft,
        onPress: () => {},
      },
      {
        label: "Nhập hàng",
        sub: "Tạo phiếu nhập",
        emoji: "📥",
        accent: T.green,
        soft: T.greenSoft,
        onPress: () => {},
      },
    ],
  },
  {
    title: "Quản lý",
    items: [
      {
        label: "Nhân viên",
        sub: "Phân quyền, ca làm",
        emoji: "👤",
        accent: T.purple,
        soft: T.purpleSoft,
        onPress: () => router.push("/nhanvien"),
      },
      {
        label: "Nhà cung cấp",
        sub: "Danh sách đối tác",
        emoji: "🏭",
        accent: T.blue,
        soft: T.blueSoft,
        onPress: () => {},
      },
    ],
  },
];

// ─── ANIMATED MENU ITEM ──────────────────────────────────────────────────────
function AnimatedMenuItem({
  item,
  delay,
}: {
  item: (typeof SECTIONS)[0]["items"][0];
  delay: number;
}) {
  const slide = useRef(new Animated.Value(24)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fade,
        transform: [{ translateY: slide }, { scale }],
      }}
    >
      <TouchableOpacity
        style={styles.menuCard}
        onPress={item.onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Accent strip top-right */}
        <View
          style={[
            styles.accentStrip,
            { backgroundColor: item.accent + "22" },
          ]}
        />

        <View style={[styles.iconCircle, { backgroundColor: item.soft }]}>
          <Text style={styles.iconEmoji}>{item.emoji}</Text>
        </View>

        <View style={styles.menuTextWrap}>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.menuSub}>{item.sub}</Text>
        </View>

        {/* Right arrow dot */}
        <View style={[styles.arrowDot, { backgroundColor: item.soft }]}>
          <Text style={[styles.arrowIcon, { color: item.accent }]}>›</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── SECTION ─────────────────────────────────────────────────────────────────
function Section({
  title,
  items,
  baseDelay,
}: {
  title: string;
  items: (typeof SECTIONS)[0]["items"];
  baseDelay: number;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionTitleDot} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <View style={styles.grid}>
        {items.map((item, i) => (
          <AnimatedMenuItem key={i} item={item} delay={baseDelay + i * 60} />
        ))}
        {items.length % 2 !== 0 && <View style={{ flex: 1 }} />}
      </View>
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function NhieuHonScreen() {
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* ── HEADER ── */}
      <Animated.View
        style={[
          styles.header,
          { opacity: headerFade, transform: [{ translateY: headerSlide }] },
        ]}
      >
        {/* Avatar block */}
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing} />
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🏪</Text>
            </View>
            {/* Online dot */}
            <View style={styles.onlineDot} />
          </View>

          <View>
            <Text style={styles.storeName}>Cửa hàng</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Đang hoạt động</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn} activeOpacity={0.75}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── SCROLLABLE CONTENT ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((sec, sIdx) => (
          <Section
            key={sIdx}
            title={sec.title}
            items={sec.items}
            baseDelay={80 + sIdx * 120}
          />
        ))}

        {/* ── LOGOUT ── */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8}>
          <View style={[styles.iconCircle, { backgroundColor: T.redSoft }]}>
            <Text style={styles.iconEmoji}>🚪</Text>
          </View>
          <Text style={styles.logoutText}>Đăng xuất</Text>
          <View style={styles.logoutArrow}>
            <Text style={{ color: T.red, fontSize: 20, fontWeight: "300" }}>
              ›
            </Text>
          </View>
        </TouchableOpacity>

        {/* Bottom spacer */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: T.card,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: T.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  // Avatar
  avatarWrap: { position: "relative", width: 50, height: 50 },
  avatarRing: {
    position: "absolute",
    inset: -3,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: T.blue + "30",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: T.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 24 },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: T.green,
    borderWidth: 2,
    borderColor: T.card,
  },

  storeName: {
    fontSize: 16,
    fontWeight: "800",
    color: T.text,
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.green,
  },
  statusText: { fontSize: 12, color: T.green, fontWeight: "600" },

  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  editIcon: { fontSize: 16 },

  // Section
  section: { marginTop: 18 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
    paddingLeft: 2,
  },
  sectionTitleDot: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: T.blue,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: T.sub,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Grid
  grid: {
    flexDirection: "row",
    gap: 12,
  },

  // Menu card
  menuCard: {
    backgroundColor: T.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.blue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
    gap: 10,
  },
  accentStrip: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: 22 },
  menuTextWrap: { flex: 1 },
  menuLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: T.text,
    letterSpacing: -0.2,
  },
  menuSub: {
    fontSize: 11.5,
    color: T.sub,
    marginTop: 2,
    fontWeight: "500",
  },
  arrowDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  arrowIcon: { fontSize: 20, fontWeight: "700", lineHeight: 22 },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.card,
    marginTop: 18,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FFD6D6",
    shadowColor: T.red,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: T.red,
    letterSpacing: -0.2,
  },
  logoutArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: T.redSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});