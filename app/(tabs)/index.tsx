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

// ─── API ───────────────────────────────────────────────────────────────────
const API_BASE = 'http://172.20.10.2/cuahangtaphoa';

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

// ─── TYPES ─────────────────────────────────────────────────────────────────
type StatsData = {
  doanhThuText: string;
  doanhThu: number;
  traHang: number;
  soHoaDon: number;
  sapHet: number;
};

type ChartData = {
  labels: string[];
  data: number[];
  tongDoanhThu: number;
  tongDoanhThuText: string;
};

type TopSPItem = {
  MaSanPham: number;
  TenSanPham: string;
  TongDoanhThu: number;
  TongSoLuong: number;
};

type ActivityItem = {
  nguoiDung: string;
  hanhDong: string;
  giaTri: string;
  thoiGian: string;
};

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();

  const [refreshing, setRefreshing]     = useState(false);
  const [filterChart, setFilterChart]   = useState<'month' | 'week' | 'year'>('month');
  const [sortTop, setSortTop]           = useState<'revenue' | 'quantity'>('revenue');
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  const [stats, setStats]         = useState<StatsData | null>(null);
  const [chart, setChart]         = useState<ChartData | null>(null);
  const [topSP, setTopSP]         = useState<TopSPItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const res  = await fetch(`${API_BASE}/Dashboard/GetStats`);
      const data = await res.json();
      if (data.success) setStats(data);
    } catch {}
  };

  const fetchChart = async (filter: string) => {
    try {
      const res  = await fetch(`${API_BASE}/Dashboard/GetDoanhThu?filter=${filter}`);
      const data = await res.json();
      if (data.success) setChart(data);
    } catch {}
  };

  const fetchTopSP = async (sort: string, filter: string) => {
    try {
      const res  = await fetch(`${API_BASE}/Dashboard/GetTopSanPham?sortBy=${sort}&filter=${filter}`);
      const data = await res.json();
      if (data.success) setTopSP(data.data ?? []);
    } catch {}
  };

  const fetchActivity = async () => {
    try {
      const res  = await fetch(`${API_BASE}/Dashboard/GetHoatDong`);
      const data = await res.json();
      if (data.success) setActivities(data.data ?? []);
    } catch {}
  };

  const loadAll = async () => {
    await Promise.all([
      fetchStats(),
      fetchChart(filterChart),
      fetchTopSP(sortTop, filterChart),
      fetchActivity(),
    ]);
  };

  // khi đổi filter chart → tải lại chart + top SP
  useEffect(() => {
    fetchChart(filterChart);
    fetchTopSP(sortTop, filterChart);
  }, [filterChart]);

  // khi đổi sort top SP
  useEffect(() => {
    fetchTopSP(sortTop, filterChart);
  }, [sortTop]);

  // lần đầu load
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadAll().then(() => {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // sort top SP phía client (dùng dữ liệu đã fetch theo sortTop)
  const sortedTopSP = useMemo(() => [...topSP], [topSP]);

  // ── render ────────────────────────────────────────────────────────────────
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
              <StatCard
                icon="📈" label="Doanh thu"
                value={stats ? stats.doanhThuText : '—'}
                color={C.blueMid} bg={C.blueLight}
              />
              <StatCard
                icon="↩️" label="Trả hàng"
                value={stats ? String(stats.traHang) : '—'}
                color={C.orange} bg={C.orangeLight}
              />
            </View>
            <View style={styles.statRow}>
              <StatCard
                icon="🧾" label="Hóa đơn"
                value={stats ? String(stats.soHoaDon) : '—'}
                color={C.green} bg={C.greenLight}
              />
              <StatCard
                icon="⚠️" label="Sắp hết hàng"
                value={stats ? String(stats.sapHet) : '—'}
                color={C.red} bg={C.redLight}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.qaBtn} onPress={() => router.push('/banhang' as any)}>
              <Text style={{ fontSize: 20 }}>🛒</Text>
              <Text style={styles.qaLabel}>Bán hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qaBtn} onPress={() => router.push('/kho' as any)}>
              <Text style={{ fontSize: 20 }}>📦</Text>
              <Text style={styles.qaLabel}>Nhập hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qaBtn} onPress={() => router.push('/baocao' as any)}>
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
                <Text style={[styles.cardValue, { color: C.blueMid }]}>
                  {chart ? chart.tongDoanhThuText : '—'}
                </Text>
              </View>
              <View style={styles.filterRow}>
                {(['month', 'week', 'year'] as const).map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterBtn, filterChart === f && styles.filterBtnActive]}
                    onPress={() => setFilterChart(f)}
                  >
                    <Text style={[styles.filterBtnText, filterChart === f && { color: C.blueMid, fontWeight: '600' }]}>
                      {f === 'month' ? 'T.này' : f === 'week' ? 'Tuần' : 'Năm'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {chart && chart.data.length > 0
              ? <MiniChart labels={chart.labels} data={chart.data} />
              : <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: C.muted, fontSize: 12 }}>Đang tải...</Text>
                </View>
            }
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
                  <Text style={[styles.filterBtnText, sortTop === 'revenue' && { color: C.blueMid, fontWeight: '600' }]}>
                    Doanh thu
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBtn, sortTop === 'quantity' && styles.filterBtnActive]}
                  onPress={() => setSortTop('quantity')}
                >
                  <Text style={[styles.filterBtnText, sortTop === 'quantity' && { color: C.blueMid, fontWeight: '600' }]}>
                    SL
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {sortedTopSP.length === 0
              ? <Text style={{ color: C.muted, fontSize: 12, textAlign: 'center', paddingVertical: 20 }}>
                  Chưa có dữ liệu
                </Text>
              : sortedTopSP.map((sp, i) => (
                  <View key={sp.MaSanPham} style={styles.topItem}>
                    <RankBadge rank={i + 1} />
                    <Text style={styles.topName} numberOfLines={1}>{sp.TenSanPham}</Text>
                    <Text style={styles.topVal}>
                      {sortTop === 'quantity' ? `${sp.TongSoLuong} cái` : formatFull(sp.TongDoanhThu)}
                    </Text>
                  </View>
                ))
            }
          </View>

          {/* Recent Activity */}
          <View style={[styles.card, { marginBottom: 100 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>⚡ Hoạt động gần đây</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activities.length}</Text>
              </View>
            </View>

            {activities.length === 0
              ? <Text style={{ color: C.muted, fontSize: 12, textAlign: 'center', paddingVertical: 20 }}>
                  Chưa có hoạt động
                </Text>
              : activities.map((a, idx) => {
                  const isBan = a.hanhDong.includes('bán');
                  return (
                    <View key={idx} style={styles.actItem}>
                      <View style={[styles.actIcon, { backgroundColor: isBan ? C.blueLight : C.greenLight }]}>
                        <Text style={{ fontSize: 14 }}>{isBan ? '🛍️' : '📥'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actText}>
                          <Text style={{ color: C.blueMid, fontWeight: '600' }}>{a.nguoiDung}</Text>
                          {' '}vừa{' '}
                          <Text style={{ color: C.blueMid, fontWeight: '600' }}>{a.hanhDong}</Text>
                          {' '}với giá trị{' '}
                          <Text style={{ fontWeight: '700' }}>{a.giaTri} ₫</Text>
                        </Text>
                        <Text style={styles.actTime}>{a.thoiGian}</Text>
                      </View>
                    </View>
                  );
                })
            }
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
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
  },
  avatarMenu: {
    position: 'absolute', right: 16, top: 58,
    backgroundColor: C.white, borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
    minWidth: 180,
  },
  avatarMenuItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },

  greeting: { marginBottom: 14 },
  greetingDate: { fontSize: 12, color: C.muted },
  greetingTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 2 },

  statGrid: { gap: 10, marginBottom: 14 },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: C.white,
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 14, alignItems: 'flex-start', gap: 6,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 2 },
  statValue: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },

  quickActions: {
    flexDirection: 'row', backgroundColor: C.white,
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    marginBottom: 14, overflow: 'hidden',
  },
  qaBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  qaLabel: { fontSize: 11, color: C.muted, fontWeight: '500' },

  card: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10,
  },
  cardTitle: { fontSize: 13.5, fontWeight: '600', color: C.text },
  cardValue: { fontSize: 17, fontWeight: '800', marginTop: 2 },

  filterRow: { flexDirection: 'row', gap: 4 },
  filterBtn: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: C.border, backgroundColor: C.white,
  },
  filterBtnActive: { borderColor: C.blueMid, backgroundColor: C.blueLight },
  filterBtnText: { fontSize: 11.5, color: C.muted },

  topItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  rankBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  topName: { flex: 1, fontSize: 13, color: C.text },
  topVal: { fontSize: 12.5, fontWeight: '700', color: C.blue, flexShrink: 0 },

  badge: { backgroundColor: C.orangeLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.orange },

  actItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  actIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actText: { fontSize: 12.5, color: C.text, lineHeight: 18 },
  actTime: { fontSize: 11, color: C.muted, marginTop: 2 },
});