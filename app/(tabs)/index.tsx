// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_STATS = {
  doanhThu: 12_500_000,
  traHang: 0,
  soHoaDon: 47,
  sapHet: 3,
};

const MOCK_CHART = {
  labels: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
  data: [1200000, 3400000, 2800000, 4100000, 2200000, 5600000, 3900000, 4700000, 2100000, 6200000, 3300000, 4800000, 5100000],
  tong: 51_700_000,
};

const MOCK_TOP_SP = [
  { id: 1, TenSanPham: 'Mì Hảo Hảo tôm chua cay', TongDoanhThu: 4800000, TongSoLuong: 320 },
  { id: 2, TenSanPham: 'Nước ngọt Pepsi 330ml', TongDoanhThu: 3600000, TongSoLuong: 180 },
  { id: 3, TenSanPham: 'Dầu ăn Neptune 1L', TongDoanhThu: 2900000, TongSoLuong: 97 },
  { id: 4, TenSanPham: 'Bột giặt Omo 3kg', TongDoanhThu: 2400000, TongSoLuong: 60 },
  { id: 5, TenSanPham: 'Sữa tươi Vinamilk 1L', TongDoanhThu: 1800000, TongSoLuong: 120 },
  { id: 6, TenSanPham: 'Bánh Oreo socola', TongDoanhThu: 1200000, TongSoLuong: 200 },
  { id: 7, TenSanPham: 'Nước mắm Chin-su 500ml', TongDoanhThu: 980000, TongSoLuong: 70 },
];

const MOCK_ACTIVITY = [
  { id: 1, nguoiDung: 'Nhân viên A', hanhDong: 'lập hóa đơn bán hàng', giaTri: '450.000 ₫', thoiGian: '2 phút trước', isBan: true },
  { id: 2, nguoiDung: 'Nhân viên A', hanhDong: 'nhập hàng', giaTri: '2.300.000 ₫', thoiGian: '15 phút trước', isBan: false },
  { id: 3, nguoiDung: 'Nhân viên B', hanhDong: 'lập hóa đơn bán hàng', giaTri: '125.000 ₫', thoiGian: '32 phút trước', isBan: true },
  { id: 4, nguoiDung: 'Nhân viên A', hanhDong: 'lập hóa đơn bán hàng', giaTri: '870.000 ₫', thoiGian: '1 giờ trước', isBan: true },
  { id: 5, nguoiDung: 'Nhân viên B', hanhDong: 'nhập hàng', giaTri: '5.600.000 ₫', thoiGian: '2 giờ trước', isBan: false },
];

// ─── COLORS ────────────────────────────────────────────────────────────────
const C = {
  blue: '#1565c0',
  blueMid: '#4285f4',
  blueLight: '#e8f0fe',
  orange: '#f57c00',
  orangeLight: '#fff3e0',
  green: '#2e7d32',
  greenLight: '#e8f5e9',
  red: '#c62828',
  redLight: '#ffebee',
  border: '#e8eaed',
  bg: '#f1f3f4',
  text: '#202124',
  muted: '#5f6368',
  white: '#ffffff',
  gold: '#f9a825',
  silver: '#757575',
  bronze: '#bf360c',
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
const formatFull = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

const { width: SW } = Dimensions.get('window');
const CHART_W = SW - 64;
const CHART_H = 120;

// ─── MINI CHART ────────────────────────────────────────────────────────────
function MiniChart({ labels, data }: { labels: string[]; data: number[] }) {
  const max = Math.max(...data);
  const min = 0;
  const range = max - min || 1;

  return (
    <View style={{ height: CHART_H + 24, marginTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_H, gap: 3 }}>
        {data.map((v, i) => {
          const h = Math.max(4, ((v - min) / range) * (CHART_H - 8));
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <View
                style={{
                  width: '100%',
                  height: h,
                  backgroundColor: C.blueMid,
                  opacity: 0.15 + (v / max) * 0.75,
                  borderRadius: 3,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {labels.map((l, i) => (
          <Text
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 9,
              color: C.muted,
              opacity: i % 2 === 0 ? 1 : 0,
            }}
          >
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── STAT CARD ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg }: {
  icon: string; label: string; value: string; color: string; bg: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ flex: 1 }}>
      <Animated.View style={[styles.statCard, { transform: [{ scale }] }]}>
        <View style={[styles.statIcon, { backgroundColor: bg }]}>
          <Text style={{ fontSize: 18, color }}>{icon}</Text>
        </View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── RANK BADGE ────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  const cfg = rank === 1 ? { bg: '#fff8e1', color: C.gold } :
             rank === 2 ? { bg: '#f5f5f5', color: C.silver } :
             rank === 3 ? { bg: '#fbe9e7', color: C.bronze } :
             { bg: C.blueLight, color: C.blue };

  return (
    <View style={[styles.rankBadge, { backgroundColor: cfg.bg }]}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>{rank}</Text>
    </View>
  );
}

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [filterChart, setFilterChart] = useState<'month' | 'week' | 'year'>('month');
  const [sortTop, setSortTop] = useState<'revenue' | 'quantity'>('revenue');
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  const stats = MOCK_STATS;
  const chart = MOCK_CHART;
  const activities = MOCK_ACTIVITY;

  const sortedTopSP = useMemo(() => {
    return [...MOCK_TOP_SP].sort((a, b) => {
      if (sortTop === 'revenue') return b.TongDoanhThu - a.TongDoanhThu;
      return b.TongSoLuong - a.TongSoLuong;
    });
  }, [sortTop]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Top Bar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <View style={styles.logoIcon}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>C</Text>
          </View>
          <Text style={styles.topbarTitle}>CuaHang</Text>
        </View>
        <View style={styles.topbarRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatar} onPress={() => setShowAvatarMenu(!showAvatarMenu)}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>A</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar Menu */}
      {showAvatarMenu && (
        <TouchableOpacity style={styles.avatarMenuOverlay} onPress={() => setShowAvatarMenu(false)}>
          <View style={styles.avatarMenu}>
            <View style={styles.avatarMenuItem}>
              <Text style={{ fontSize: 13, fontWeight: '600' }}>Thông tin cá nhân</Text>
            </View>
            <TouchableOpacity style={styles.avatarMenuItem}>
              <Text style={{ fontSize: 13, color: C.red }}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.blue]} />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Greeting */}
          <View style={styles.greeting}>
            <Text style={styles.greetingDate}>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </Text>
            <Text style={styles.greetingTitle}>Kết quả hôm nay 🏪</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statGrid}>
            <View style={styles.statRow}>
              <StatCard icon="📈" label="Doanh thu" value={formatFull(stats.doanhThu)} color={C.blueMid} bg={C.blueLight} />
              <StatCard icon="↩️" label="Trả hàng" value={String(stats.traHang)} color={C.orange} bg={C.orangeLight} />
            </View>
            <View style={styles.statRow}>
              <StatCard icon="🧾" label="Hóa đơn" value={String(stats.soHoaDon)} color={C.green} bg={C.greenLight} />
              <StatCard icon="⚠️" label="Sắp hết hàng" value={String(stats.sapHet)} color={C.red} bg={C.redLight} />
            </View>
          </View>

          {/* Quick Actions */}
<View style={styles.quickActions}>
  <TouchableOpacity 
    style={styles.qaBtn} 
    onPress={() => router.push('/banhang' as any)}
  >
    <Text style={{ fontSize: 20 }}>🛒</Text>
    <Text style={styles.qaLabel}>Bán hàng</Text>
  </TouchableOpacity>

  <TouchableOpacity 
    style={styles.qaBtn} 
    onPress={() => router.push('/kho' as any)}
  >
    <Text style={{ fontSize: 20 }}>📦</Text>
    <Text style={styles.qaLabel}>Nhập hàng</Text>
  </TouchableOpacity>

  <TouchableOpacity 
    style={styles.qaBtn} 
    onPress={() => router.push('/baocao' as any)}
  >
    <Text style={{ fontSize: 20 }}>📊</Text>
    <Text style={styles.qaLabel}>Báo cáo</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.qaBtn}>
    <Text style={{ fontSize: 20 }}>🏷️</Text>
    <Text style={styles.qaLabel}>Hàng hóa</Text>
  </TouchableOpacity>
</View>

          {/* Chart Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Doanh thu thuần</Text>
                <Text style={[styles.cardValue, { color: C.blueMid }]}>{formatFull(chart.tong)}</Text>
              </View>
              <View style={styles.filterRow}>
                {(['month', 'week', 'year'] as const).map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterBtn, filterChart === f && styles.filterBtnActive]}
                    onPress={() => setFilterChart(f)}
                  >
                    <Text style={[styles.filterBtnText, filterChart === f && { color: C.blueMid, fontWeight: '600' }]}>
                      {f === 'month' || f === 'week' ? 'T.này' : 'Năm'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <MiniChart labels={chart.labels} data={chart.data} />
          </View>

          {/* Top Products */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>🏆 Top hàng bán chạy</Text>
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.filterBtn, sortTop === 'revenue' && styles.filterBtnActive]}
                  onPress={() => setSortTop('revenue')}
                >
                  <Text style={[styles.filterBtnText, sortTop === 'revenue' && { color: C.blueMid, fontWeight: '600' }]}>Doanh thu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBtn, sortTop === 'quantity' && styles.filterBtnActive]}
                  onPress={() => setSortTop('quantity')}
                >
                  <Text style={[styles.filterBtnText, sortTop === 'quantity' && { color: C.blueMid, fontWeight: '600' }]}>SL</Text>
                </TouchableOpacity>
              </View>
            </View>

            {sortedTopSP.map((sp, i) => (
              <View key={sp.id} style={styles.topItem}>
                <RankBadge rank={i + 1} />
                <Text style={styles.topName} numberOfLines={1}>{sp.TenSanPham}</Text>
                <Text style={styles.topVal}>
                  {sortTop === 'quantity' ? `${sp.TongSoLuong} cái` : formatFull(sp.TongDoanhThu)}
                </Text>
              </View>
            ))}
          </View>

          {/* Recent Activity */}
          <View style={[styles.card, { marginBottom: 100 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>⚡ Hoạt động gần đây</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activities.length}</Text>
              </View>
            </View>
            {activities.map(a => (
              <View key={a.id} style={styles.actItem}>
                <View style={[styles.actIcon, { backgroundColor: a.isBan ? C.blueLight : C.greenLight }]}>
                  <Text style={{ fontSize: 14 }}>{a.isBan ? '🛍️' : '📥'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actText}>
                    <Text style={{ color: C.blueMid, fontWeight: '600' }}>{a.nguoiDung}</Text>
                    {' '}vừa{' '}
                    <Text style={{ color: C.blueMid, fontWeight: '600' }}>{a.hanhDong}</Text>
                    {' '}với giá trị{' '}
                    <Text style={{ fontWeight: '700' }}>{a.giaTri}</Text>
                  </Text>
                  <Text style={styles.actTime}>{a.thoiGian}</Text>
                </View>
              </View>
            ))}
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white },
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },

  topbar: {
    height: 52,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 28, height: 28,
    backgroundColor: C.blue,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarTitle: { fontSize: 15, fontWeight: '700', color: C.blue },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 34, height: 34,
    backgroundColor: '#4CAF50',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  avatarMenu: {
    position: 'absolute',
    right: 16,
    top: 58,
    backgroundColor: C.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 180,
  },
  avatarMenuItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },

  greeting: { marginBottom: 14 },
  greetingDate: { fontSize: 12, color: C.muted },
  greetingTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 2 },

  statGrid: { gap: 10, marginBottom: 14 },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    alignItems: 'flex-start',
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 2 },
  statValue: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },

  quickActions: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  qaBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  qaLabel: { fontSize: 11, color: C.muted, fontWeight: '500' },

  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 13.5, fontWeight: '600', color: C.text },
  cardValue: { fontSize: 17, fontWeight: '800', marginTop: 2 },

  filterRow: { flexDirection: 'row', gap: 4 },
  filterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  filterBtnActive: { borderColor: C.blueMid, backgroundColor: C.blueLight },
  filterBtnText: { fontSize: 11.5, color: C.muted },

  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topName: { flex: 1, fontSize: 13, color: C.text },
  topVal: { fontSize: 12.5, fontWeight: '700', color: C.blue, flexShrink: 0 },

  badge: {
    backgroundColor: C.orangeLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.orange },
  actItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  actIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actText: { fontSize: 12.5, color: C.text, lineHeight: 18 },
  actTime: { fontSize: 11, color: C.muted, marginTop: 2 },
});