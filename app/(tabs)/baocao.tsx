// app/(tabs)/baocao.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE = 'http://172.20.10.2/cuahangtaphoa';
const { width: SW } = Dimensions.get('window');

const C = {
  blue: '#1565c0',
  blueMid: '#4285f4',
  blueLight: '#e8f0fe',
  orange: '#f57c00',
  orangeLight: '#fff3e0',
  green: '#2e7d32',
  greenLight: '#e8f5e9',
  red: '#c62828',
  purple: '#6a1b9a',
  purpleLight: '#f3e5f5',
  border: '#e8eaed',
  bg: '#f1f3f4',
  text: '#202124',
  muted: '#5f6368',
  white: '#ffffff',
  gold: '#f9a825',
  silver: '#757575',
  bronze: '#bf360c',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────
function formatDate(d: Date) {
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function displayDate(d: Date) {
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type QuickKey = 'today' | 'yesterday' | 'week' | 'month' | 'lastmonth';

function getRange(key: QuickKey): { from: Date; to: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (key === 'today')     return { from: today, to: today };
  if (key === 'yesterday') { const y = new Date(today); y.setDate(y.getDate() - 1); return { from: y, to: y }; }
  if (key === 'week')      { const f = new Date(today); f.setDate(f.getDate() - 6); return { from: f, to: today }; }
  if (key === 'month')     return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
  // lastmonth
  const f = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const t = new Date(today.getFullYear(), today.getMonth(), 0);
  return { from: f, to: t };
}

// ─── TYPES ────────────────────────────────────────────────────────────────
type TongHop = {
  doanhThu: number; doanhThuText: string;
  soHoaDon: number; tbHoaDonText: string;
  tongNhap: number; tongNhapText: string; soPhieuNhap: number;
  loiNhuan: number; loiNhuanText: string;
  chartLabels: string[]; chartData: number[];
};

type TopSP = {
  maSanPham: number; tenSanPham: string;
  tongSoLuong: number; tongDoanhThu: number;
};

type NhapHangRow = { nhaCungCap: string; soPhieu: number; tongTien: number };

type HoaDonRow = {
  maDon: number; ngayLap: string; nhanVien: string;
  tongTien: number; phanTramGiam: number; thucThu: number; trangThai: string;
};

// ─── RANK BADGE ──────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  const cfg =
    rank === 1 ? { bg: '#fff8e1', color: C.gold } :
    rank === 2 ? { bg: '#f5f5f5', color: C.silver } :
    rank === 3 ? { bg: '#fbe9e7', color: C.bronze } :
                 { bg: C.blueLight, color: C.blue };
  return (
    <View style={[styles.rankBadge, { backgroundColor: cfg.bg }]}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>{rank}</Text>
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────
export default function BaoCaoScreen() {
  const [chartType, setChartType]   = useState<'bar' | 'line'>('bar');
  const [sortTop, setSortTop]       = useState<'revenue' | 'quantity'>('revenue');
  const [activeQuick, setActiveQuick] = useState<QuickKey>('month');

  const [fromDate, setFromDate] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate]     = useState<Date>(() => new Date());

  const [loading, setLoading]   = useState(false);
  const [tongHop, setTongHop]   = useState<TongHop | null>(null);
  const [topSP, setTopSP]       = useState<TopSP[]>([]);
  const [nhapHang, setNhapHang] = useState<NhapHangRow[]>([]);
  const [hoaDons, setHoaDons]   = useState<HoaDonRow[]>([]);

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchAll = async (from: Date, to: Date) => {
    setLoading(true);
    const f = formatDate(from);
    const t = formatDate(to);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch(`${API_BASE}/BaoCao/GetTongHop?tuNgay=${f}&denNgay=${t}`).then(r => r.json()),
        fetch(`${API_BASE}/BaoCao/GetTopSanPham?tuNgay=${f}&denNgay=${t}`).then(r => r.json()),
        fetch(`${API_BASE}/BaoCao/GetNhapHang?tuNgay=${f}&denNgay=${t}`).then(r => r.json()),
        fetch(`${API_BASE}/BaoCao/GetChiTietHoaDon?tuNgay=${f}&denNgay=${t}`).then(r => r.json()),
      ]);
      if (r1.success) setTongHop(r1);
      if (r2.success) setTopSP(r2.data ?? []);
      if (r3.success) setNhapHang(r3.data ?? []);
      if (r4.success) setHoaDons(r4.data ?? []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(fromDate, toDate); }, []);

  const onQuickFilter = (key: QuickKey) => {
    setActiveQuick(key);
    const { from, to } = getRange(key);
    setFromDate(from);
    setToDate(to);
    fetchAll(from, to);
  };

  const onApply = () => fetchAll(fromDate, toDate);

  // ── chart data ────────────────────────────────────────────────────────────
  const chartLabels = tongHop?.chartLabels ?? [];
  const chartValues = tongHop?.chartData   ?? [];

  // react-native-chart-kit cần ít nhất 1 điểm
  const safeLabels = chartLabels.length ? chartLabels : ['—'];
  const safeValues = chartValues.length ? chartValues : [0];

  // rút gọn label nếu quá nhiều
  const displayLabels = safeLabels.map((l, i) =>
    safeLabels.length > 10 ? (i % Math.ceil(safeLabels.length / 7) === 0 ? l : '') : l
  );

  const chartData = {
    labels: displayLabels,
    datasets: [{ data: safeValues }],
  };

  const chartConfig = {
    backgroundColor: C.white,
    backgroundGradientFrom: C.white,
    backgroundGradientTo: C.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(66,133,244,${opacity})`,
    labelColor: () => C.muted,
    style: { borderRadius: 12 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: C.blueMid },
    formatYLabel: (v: string) => {
      const n = Number(v);
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + 'tr';
      if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'k';
      return String(n);
    },
  };

  // top SP sorted phía client
  const sortedTop = [...topSP].sort((a, b) =>
    sortTop === 'quantity' ? b.tongSoLuong - a.tongSoLuong : b.tongDoanhThu - a.tongDoanhThu
  );
  const maxTopVal = sortedTop.length
    ? (sortTop === 'quantity' ? sortedTop[0].tongSoLuong : sortedTop[0].tongDoanhThu)
    : 1;

  // tổng hóa đơn
  const tongThucThu = hoaDons.reduce((s, h) => s + h.thucThu, 0);
  const tongTongTien = hoaDons.reduce((s, h) => s + h.tongTien, 0);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── BỘ LỌC ── */}
        <View style={styles.filterBar}>
          <Text style={styles.filterLabel}>📅 Lọc theo ngày:</Text>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Từ</Text>
            <View style={styles.dateBox}><Text style={styles.dateText}>{displayDate(fromDate)}</Text></View>
            <Text style={styles.dateLabel}>Đến</Text>
            <View style={styles.dateBox}><Text style={styles.dateText}>{displayDate(toDate)}</Text></View>
          </View>

          <View style={styles.quickFilters}>
            {([
              { key: 'today',     label: 'Hôm nay' },
              { key: 'yesterday', label: 'Hôm qua' },
              { key: 'week',      label: '7 ngày' },
              { key: 'month',     label: 'Tháng này' },
              { key: 'lastmonth', label: 'Tháng trước' },
            ] as { key: QuickKey; label: string }[]).map(item => (
              <TouchableOpacity
                key={item.key}
                style={[styles.quickBtn, activeQuick === item.key && styles.quickBtnActive]}
                onPress={() => onQuickFilter(item.key)}
              >
                <Text style={[styles.quickBtnText, activeQuick === item.key && { color: C.blue, fontWeight: '600' }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={{ color: 'white', fontWeight: '600', fontSize: 13.5 }}>🔍 Xem báo cáo</Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── STAT CARDS ── */}
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: C.blueLight }]}><Text style={{ fontSize: 24 }}>📈</Text></View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Doanh thu</Text>
              <Text style={[styles.statValue, { color: C.blueMid }]}>{tongHop?.doanhThuText ?? '—'}</Text>
              <Text style={styles.statSub}>{tongHop ? tongHop.soHoaDon + ' hóa đơn' : '...'}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: C.greenLight }]}><Text style={{ fontSize: 24 }}>🧾</Text></View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Số hóa đơn</Text>
              <Text style={[styles.statValue, { color: C.green }]}>{tongHop?.soHoaDon ?? '—'}</Text>
              <Text style={styles.statSub}>TB: {tongHop?.tbHoaDonText ?? '...'}/đơn</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: C.orangeLight }]}><Text style={{ fontSize: 24 }}>📦</Text></View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Nhập hàng</Text>
              <Text style={[styles.statValue, { color: C.orange }]}>{tongHop?.tongNhapText ?? '—'}</Text>
              <Text style={styles.statSub}>{tongHop ? tongHop.soPhieuNhap + ' phiếu nhập' : '...'}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: C.purpleLight }]}><Text style={{ fontSize: 24 }}>💰</Text></View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Lợi nhuận</Text>
              <Text style={[styles.statValue, { color: tongHop && tongHop.loiNhuan >= 0 ? C.green : C.red }]}>
                {tongHop ? (tongHop.loiNhuan >= 0 ? '' : '-') + tongHop.loiNhuanText : '—'}
              </Text>
              <Text style={[styles.statSub, { color: tongHop && tongHop.loiNhuan >= 0 ? C.green : C.red }]}>
                {tongHop ? (tongHop.loiNhuan >= 0 ? '▲ Lãi' : '▼ Lỗ') : '...'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── BIỂU ĐỒ ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📊 Doanh thu theo ngày</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['bar', 'line'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chartTypeBtn, chartType === t && styles.chartTypeActive]}
                  onPress={() => setChartType(t)}
                >
                  <Text style={[{ fontSize: 12, color: C.muted }, chartType === t && { color: C.blue, fontWeight: '600' }]}>
                    {t === 'bar' ? 'Cột' : 'Đường'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}><ActivityIndicator color={C.blueMid} /></View>
          ) : chartType === 'bar' ? (
            <BarChart
              data={chartData}
              width={SW - 48}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={{ borderRadius: 12, marginVertical: 8 }}
              fromZero
              showValuesOnTopOfBars={safeValues.length <= 10}
            />
          ) : (
            <LineChart
              data={chartData}
              width={SW - 48}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={{ borderRadius: 12, marginVertical: 8 }}
              bezier
              fromZero
            />
          )}
        </View>

        {/* ── TOP SẢN PHẨM ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🏆 Top sản phẩm bán chạy</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {([
                { key: 'revenue',  label: 'Doanh thu' },
                { key: 'quantity', label: 'SL' },
              ] as const).map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.chartTypeBtn, sortTop === s.key && styles.chartTypeActive]}
                  onPress={() => setSortTop(s.key)}
                >
                  <Text style={[{ fontSize: 12, color: C.muted }, sortTop === s.key && { color: C.blue, fontWeight: '600' }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}><ActivityIndicator color={C.blueMid} /></View>
          ) : sortedTop.length === 0 ? (
            <View style={styles.emptyBox}><Text style={styles.emptyText}>📭 Chưa có dữ liệu</Text></View>
          ) : (
            sortedTop.map((sp, i) => {
              const val = sortTop === 'quantity' ? sp.tongSoLuong : sp.tongDoanhThu;
              const pct = maxTopVal > 0 ? Math.round((val / maxTopVal) * 100) : 0;
              const label = sortTop === 'quantity'
                ? `${sp.tongSoLuong} cái`
                : `${sp.tongDoanhThu.toLocaleString('vi-VN')} ₫`;
              return (
                <View key={sp.maSanPham} style={styles.topItem}>
                  <RankBadge rank={i + 1} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={styles.topName} numberOfLines={1}>{sp.tenSanPham}</Text>
                      <Text style={styles.topVal}>{label}</Text>
                    </View>
                    <View style={styles.progressWrap}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── NHẬP HÀNG THEO NCC ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚚 Thống kê nhập hàng</Text>

          {loading ? (
            <View style={styles.loadingBox}><ActivityIndicator color={C.blueMid} /></View>
          ) : nhapHang.length === 0 ? (
            <View style={styles.emptyBox}><Text style={styles.emptyText}>📭 Chưa có dữ liệu</Text></View>
          ) : (
            <>
              {/* header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 2, color: C.muted }]}>Nhà cung cấp</Text>
                <Text style={[styles.tableCell, { color: C.muted, textAlign: 'center' }]}>Số phiếu</Text>
                <Text style={[styles.tableCell, { flex: 1.5, color: C.muted, textAlign: 'right' }]}>Tổng tiền</Text>
              </View>
              {nhapHang.map((r, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 0 && { backgroundColor: '#fafbff' }]}>
                  <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{r.nhaCungCap}</Text>
                  <Text style={[styles.tableCell, { textAlign: 'center' }]}>{r.soPhieu}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: '700', color: C.blue }]}>
                    {r.tongTien.toLocaleString('vi-VN')} ₫
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* ── CHI TIẾT HÓA ĐƠN ── */}
        <View style={[styles.card, { marginBottom: 100 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📋 Chi tiết hóa đơn</Text>
            {hoaDons.length > 0 && (
              <Text style={{ fontSize: 12, color: C.muted }}>Tổng {hoaDons.length} đơn</Text>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingBox}><ActivityIndicator color={C.blueMid} /></View>
          ) : hoaDons.length === 0 ? (
            <View style={styles.emptyBox}><Text style={styles.emptyText}>📭 Không có hóa đơn</Text></View>
          ) : (
            <>
              {/* header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.hdCell, { width: 30, color: C.muted }]}>#</Text>
                <Text style={[styles.hdCell, { width: 55, color: C.muted }]}>Mã</Text>
                <Text style={[styles.hdCell, { flex: 1, color: C.muted }]}>Ngày</Text>
                <Text style={[styles.hdCell, { flex: 1.2, color: C.muted }]}>NV</Text>
                <Text style={[styles.hdCell, { flex: 1.5, color: C.muted, textAlign: 'right' }]}>Thực thu</Text>
                <Text style={[styles.hdCell, { width: 70, color: C.muted, textAlign: 'center' }]}>TT</Text>
              </View>

              {hoaDons.map((hd, i) => (
                <View key={hd.maDon} style={[styles.tableRow, i % 2 === 0 && { backgroundColor: '#fafbff' }]}>
                  <Text style={[styles.hdCell, { width: 30, color: C.muted }]}>{i + 1}</Text>
                  <Text style={[styles.hdCell, { width: 55, fontWeight: '600' }]}>#{hd.maDon}</Text>
                  <Text style={[styles.hdCell, { flex: 1, fontSize: 11 }]} numberOfLines={1}>{hd.ngayLap}</Text>
                  <Text style={[styles.hdCell, { flex: 1.2 }]} numberOfLines={1}>{hd.nhanVien}</Text>
                  <Text style={[styles.hdCell, { flex: 1.5, fontWeight: '700', color: C.blue, textAlign: 'right' }]}>
                    {hd.thucThu.toLocaleString('vi-VN')}₫
                  </Text>
                  <View style={{ width: 70, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={[
                      styles.statusBadge,
                      hd.trangThai === 'Hoàn thành' ? styles.statusSuccess : styles.statusWarn
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: hd.trangThai === 'Hoàn thành' ? C.green : C.orange }
                      ]}>
                        {hd.trangThai === 'Hoàn thành' ? '✓ Xong' : hd.trangThai}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* footer tổng */}
              <View style={[styles.tableRow, styles.tableFooter]}>
                <Text style={{ flex: 1, fontWeight: '700', fontSize: 13 }}>Tổng cộng:</Text>
                <Text style={{ fontWeight: '800', color: C.blue, fontSize: 13 }}>
                  {tongThucThu.toLocaleString('vi-VN')} ₫
                </Text>
              </View>
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },

  filterBar: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 14, gap: 12,
  },
  filterLabel: { fontSize: 13.5, fontWeight: '600', color: C.muted },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateLabel: { fontSize: 13, color: C.muted },
  dateBox: {
    borderWidth: 1, borderColor: C.border, borderRadius: 6,
    paddingHorizontal: 10, height: 36, justifyContent: 'center',
  },
  dateText: { fontSize: 13, color: C.text },
  quickFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  quickBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 6, borderWidth: 1, borderColor: C.border, backgroundColor: C.white,
  },
  quickBtnActive: { backgroundColor: C.blueLight, borderColor: C.blueMid },
  quickBtnText: { fontSize: 12.5, color: C.muted },
  applyBtn: {
    backgroundColor: C.blue, paddingVertical: 11,
    borderRadius: 8, alignItems: 'center',
  },

  statGrid: { gap: 10, marginBottom: 14 },
  statCard: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  statIcon: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 12, color: C.muted },
  statValue: { fontSize: 19, fontWeight: '800', marginTop: 2 },
  statSub: { fontSize: 11.5, color: C.muted, marginTop: 2 },

  card: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 12 },

  chartTypeBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6, borderWidth: 1, borderColor: C.border,
  },
  chartTypeActive: { backgroundColor: C.blueLight, borderColor: C.blueMid },

  topItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  rankBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  topName: { flex: 1, fontSize: 13, color: C.text, marginRight: 8 },
  topVal: { fontSize: 12.5, fontWeight: '700', color: C.blue },
  progressWrap: { height: 5, backgroundColor: '#f0f0f0', borderRadius: 4 },
  progressFill: { height: 5, backgroundColor: C.blueMid, borderRadius: 4 },

  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  tableHeader: { backgroundColor: '#f8f9fb', borderRadius: 6, marginBottom: 2 },
  tableFooter: {
    backgroundColor: '#f8f9fb', borderTopWidth: 2,
    borderTopColor: C.border, paddingVertical: 10, marginTop: 2,
  },
  tableCell: { flex: 1, fontSize: 13, color: C.text, paddingHorizontal: 4 },

  hdCell: { fontSize: 12, color: C.text, paddingHorizontal: 3 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  statusSuccess: { backgroundColor: C.greenLight },
  statusWarn: { backgroundColor: C.orangeLight },
  statusText: { fontSize: 10.5, fontWeight: '600' },

  loadingBox: { alignItems: 'center', paddingVertical: 30 },
  emptyBox: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 13, color: C.muted },
});