// app/(tabs)/hoadon.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE = 'http://172.20.10.2/cuahangtaphoa';
const { width: SW } = Dimensions.get('window');

const C = {
  blue: '#1565c0',
  blueMid: '#4285f4',
  blueLight: '#e8f0fe',
  green: '#2e7d32',
  greenLight: '#e8f5e9',
  red: '#c62828',
  redLight: '#ffebee',
  orange: '#f57c00',
  orangeLight: '#fff3e0',
  border: '#e8eaed',
  bg: '#f1f3f4',
  text: '#202124',
  muted: '#5f6368',
  white: '#ffffff',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────
const fmt = (n: number) => Number(n).toLocaleString('vi-VN') + ' ₫';
const today = () => new Date().toISOString().slice(0, 10);

type QuickKey = 'today' | 'yesterday' | 'week' | 'month' | 'all';

function getRange(key: QuickKey): { from: string; to: string } {
  const now = new Date();
  const pad = (d: Date) => d.toISOString().slice(0, 10);
  if (key === 'today') return { from: today(), to: today() };
  if (key === 'yesterday') {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    return { from: pad(y), to: pad(y) };
  }
  if (key === 'week') {
    const w = new Date(now); w.setDate(w.getDate() - 6);
    return { from: pad(w), to: today() };
  }
  if (key === 'month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), to: today() };
  }
  return { from: '', to: '' };
}

// ─── TYPES ────────────────────────────────────────────────────────────────
type Stats = {
  tongHoaDon: number;
  hoanThanh: number;
  daHuy: number;
  doanhThuText: string;
};

type HoaDonItem = {
  maHoaDon: number;
  maDon: string;
  ngayLap: string;
  nhanVien: string;
  tongTien: number;
  phanTramGiam: number;
  thucThu: number;
  trangThai: string;
  soMatHang: number;
};

type ChiTietItem = {
  tenSanPham: string;
  maVach: string;
  soLuong: number;
  giaBan: number;
  thanhTien: number;
};

type HoaDonDetail = {
  maHoaDon: number;
  maDon: string;
  ngayLap: string;
  nhanVien: string;
  tongTien: number;
  phanTramGiam: number;
  thucThu: number;
  trangThai: string;
  phuongThuc: string;
  tienKhachDua: number;
  chiTiet: ChiTietItem[];
};

// ─── STAT CARD ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg }: {
  icon: string; label: string; value: string | number;
  color: string; bg: string;
}) {
  return (
    <View style={[styles.statCard, { flex: 1 }]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

// ─── TRANG THAI BADGE ─────────────────────────────────────────────────────
function TrangThaiBadge({ trangThai }: { trangThai: string }) {
  const isHoanThanh = trangThai === 'Hoàn thành';
  const isDaHuy = trangThai === 'Đã hủy';
  const bg = isHoanThanh ? C.greenLight : isDaHuy ? C.redLight : C.orangeLight;
  const color = isHoanThanh ? C.green : isDaHuy ? C.red : C.orange;
  const icon = isHoanThanh ? '✓' : isDaHuy ? '✕' : '…';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{icon} {trangThai}</Text>
    </View>
  );
}

// ─── CHI TIET MODAL ───────────────────────────────────────────────────────
function ChiTietModal({
  visible, onClose, detail, loading, onHuy,
}: {
  visible: boolean; onClose: () => void;
  detail: HoaDonDetail | null; loading: boolean;
  onHuy: (id: number) => void;
}) {
  if (!visible) return null;
  const giam = detail ? detail.tongTien - detail.thucThu : 0;
  const thua = detail ? Math.max(0, detail.tienKhachDua - detail.thucThu) : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🧾 Chi tiết hóa đơn</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={{ fontSize: 22, color: C.muted }}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator color={C.blueMid} size="large" />
            </View>
          ) : detail ? (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Meta info */}
              <View style={styles.metaGrid}>
                {[
                  { label: 'Mã hóa đơn', value: detail.maDon, color: C.blue },
                  { label: 'Trạng thái', value: detail.trangThai },
                  { label: 'Ngày lập', value: detail.ngayLap },
                  { label: 'Thu ngân', value: detail.nhanVien },
                  { label: 'Phương thức', value: detail.phuongThuc },
                  { label: 'Tiền khách đưa', value: fmt(detail.tienKhachDua) },
                ].map((m, i) => (
                  <View key={i} style={styles.metaItem}>
                    <Text style={styles.metaLabel}>{m.label}</Text>
                    <Text style={[styles.metaValue, m.color ? { color: m.color } : {}]}>{m.value}</Text>
                  </View>
                ))}
              </View>

              {/* Chi tiết sản phẩm */}
              <View style={styles.sectionTitle}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>Danh sách sản phẩm</Text>
              </View>

              {/* Table header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.col1, { color: C.muted }]}>#</Text>
                <Text style={[styles.colName, { color: C.muted }]}>Sản phẩm</Text>
                <Text style={[styles.colSL, { color: C.muted, textAlign: 'center' }]}>SL</Text>
                <Text style={[styles.colMoney, { color: C.muted }]}>Thành tiền</Text>
              </View>

              {detail.chiTiet.map((ct, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 0 && { backgroundColor: '#fafbff' }]}>
                  <Text style={[styles.col1, { color: C.muted }]}>{i + 1}</Text>
                  <View style={styles.colName}>
                    <Text style={{ fontSize: 13, color: C.text }} numberOfLines={2}>{ct.tenSanPham}</Text>
                    {ct.maVach ? <Text style={{ fontSize: 11, color: C.muted }}>{ct.maVach}</Text> : null}
                    <Text style={{ fontSize: 11, color: C.muted }}>{fmt(ct.giaBan)}/cái</Text>
                  </View>
                  <Text style={[styles.colSL, { textAlign: 'center', fontWeight: '600' }]}>{ct.soLuong}</Text>
                  <Text style={[styles.colMoney, { fontWeight: '700', color: C.blue }]}>{fmt(ct.thanhTien)}</Text>
                </View>
              ))}

              {/* Summary */}
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tổng tiền hàng</Text>
                  <Text style={styles.summaryVal}>{fmt(detail.tongTien)}</Text>
                </View>
                {detail.phanTramGiam > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Giảm giá ({detail.phanTramGiam}%)</Text>
                    <Text style={[styles.summaryVal, { color: C.red }]}>-{fmt(giam)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.summaryBig]}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: C.blue }}>Khách phải trả</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: C.blue }}>{fmt(detail.thucThu)}</Text>
                </View>
                {detail.tienKhachDua > 0 && (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tiền khách đưa</Text>
                      <Text style={styles.summaryVal}>{fmt(detail.tienKhachDua)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tiền thừa</Text>
                      <Text style={[styles.summaryVal, { color: C.green, fontWeight: '700' }]}>{fmt(thua)}</Text>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          ) : null}

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalBtnClose} onPress={onClose}>
              <Text style={{ fontSize: 13, color: C.text }}>Đóng</Text>
            </TouchableOpacity>
            {detail?.trangThai === 'Hoàn thành' && (
              <TouchableOpacity
                style={styles.modalBtnHuy}
                onPress={() => { onClose(); onHuy(detail.maHoaDon); }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.white }}>✕ Hủy hóa đơn</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── HUY MODAL ────────────────────────────────────────────────────────────
function HuyModal({
  visible, onClose, onConfirm, loading,
}: {
  visible: boolean; onClose: () => void;
  onConfirm: (lyDo: string) => void; loading: boolean;
}) {
  const [lyDo, setLyDo] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { maxHeight: 340 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: C.red }]}>⚠️ Hủy hóa đơn</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={{ fontSize: 22, color: C.muted }}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
              Hủy hóa đơn sẽ hoàn lại tồn kho. Bạn có chắc chắn?
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Lý do hủy:</Text>
            <TextInput
              style={styles.lyDoInput}
              placeholder="Nhập lý do hủy..."
              value={lyDo}
              onChangeText={setLyDo}
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalBtnClose} onPress={onClose}>
              <Text style={{ fontSize: 13 }}>Không</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBtnHuy}
              onPress={() => { onConfirm(lyDo); setLyDo(''); }}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={C.white} size="small" />
                : <Text style={{ fontSize: 13, fontWeight: '600', color: C.white }}>✕ Xác nhận hủy</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────
export default function HoaDonScreen() {
  const [stats, setStats]               = useState<Stats | null>(null);
  const [list, setList]                 = useState<HoaDonItem[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);

  const [keyword, setKeyword]           = useState('');
  const [tuNgay, setTuNgay]             = useState(today());
  const [denNgay, setDenNgay]           = useState(today());
  const [trangThai, setTrangThai]       = useState('Tất cả');
  const [activeQuick, setActiveQuick]   = useState<QuickKey>('today');

  const [detail, setDetail]             = useState<HoaDonDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail]     = useState(false);

  const [huyId, setHuyId]               = useState<number | null>(null);
  const [showHuy, setShowHuy]           = useState(false);
  const [huyLoading, setHuyLoading]     = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/HoaDon/GetStats?tuNgay=${today()}&denNgay=${today()}`);
      const data = await res.json();
      if (data.success) setStats(data);
    } catch {}
  };

  const fetchList = async (p: number, kw: string, tu: string, den: string, tt: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p), pageSize: '15',
        keyword: kw, trangThai: tt,
        ...(tu ? { tuNgay: tu } : {}),
        ...(den ? { denNgay: den } : {}),
      });
      const res = await fetch(`${API_BASE}/HoaDon/GetDanhSach?${params}`);
      const data = await res.json();
      if (data.success) {
        setList(data.data ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
    } catch {}
    setLoading(false);
  };

  const fetchDetail = async (id: number) => {
    setDetailLoading(true);
    setDetail(null);
    setShowDetail(true);
    try {
      const res = await fetch(`${API_BASE}/HoaDon/GetChiTiet?id=${id}`);
      const data = await res.json();
      if (data.success) setDetail(data);
    } catch {}
    setDetailLoading(false);
  };

  const doHuy = async (id: number, lyDo: string) => {
    setHuyLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', String(id));
      formData.append('lyDo', lyDo);
      const res = await fetch(`${API_BASE}/HoaDon/HuyHoaDon`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setShowHuy(false);
        loadAll(1);
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch { alert('Lỗi kết nối!'); }
    setHuyLoading(false);
  };

  const loadAll = (p = page) => {
    fetchStats();
    fadeAnim.setValue(0);
    fetchList(p, keyword, tuNgay, denNgay, trangThai);
  };

  useEffect(() => { loadAll(1); }, []);

  const onQuickFilter = (key: QuickKey) => {
    setActiveQuick(key);
    const { from, to } = getRange(key);
    setTuNgay(from); setDenNgay(to);
    fadeAnim.setValue(0);
    fetchList(1, keyword, from, to, trangThai);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchList(1, keyword, tuNgay, denNgay, trangThai)]);
    setRefreshing(false);
  };

  const onSearch = (kw: string) => {
    setKeyword(kw);
    fadeAnim.setValue(0);
    fetchList(1, kw, tuNgay, denNgay, trangThai);
  };

  const onTrangThai = (tt: string) => {
    setTrangThai(tt);
    fadeAnim.setValue(0);
    fetchList(1, keyword, tuNgay, denNgay, tt);
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>🧾 Hóa đơn</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => loadAll(1)}>
          <Text style={{ fontSize: 18, color: C.white }}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.blue]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statRow}>
          <StatCard icon="🧾" label="Tổng hôm nay" value={stats?.tongHoaDon ?? '—'} color={C.blueMid} bg={C.blueLight} />
          <StatCard icon="✅" label="Hoàn thành" value={stats?.hoanThanh ?? '—'} color={C.green} bg={C.greenLight} />
        </View>
        <View style={styles.statRow}>
          <StatCard icon="❌" label="Đã hủy" value={stats?.daHuy ?? '—'} color={C.red} bg={C.redLight} />
          <StatCard icon="💰" label="Doanh thu" value={stats?.doanhThuText ?? '—'} color={C.orange} bg={C.orangeLight} />
        </View>

        {/* Filter */}
        <View style={styles.filterBar}>
          {/* Search */}
          <View style={styles.searchWrap}>
            <Text style={{ fontSize: 14, color: C.muted, marginRight: 6 }}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm mã hóa đơn..."
              value={keyword}
              onChangeText={onSearch}
              placeholderTextColor={C.muted}
            />
          </View>

          {/* Quick filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {([
                { key: 'today', label: 'Hôm nay' },
                { key: 'yesterday', label: 'Hôm qua' },
                { key: 'week', label: '7 ngày' },
                { key: 'month', label: 'Tháng này' },
                { key: 'all', label: 'Tất cả' },
              ] as { key: QuickKey; label: string }[]).map(q => (
                <TouchableOpacity
                  key={q.key}
                  style={[styles.quickBtn, activeQuick === q.key && styles.quickBtnActive]}
                  onPress={() => onQuickFilter(q.key)}
                >
                  <Text style={[styles.quickBtnText, activeQuick === q.key && { color: C.blue, fontWeight: '600' }]}>
                    {q.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Trạng thái filter */}
          <View style={styles.ttFilterRow}>
            {(['Tất cả', 'Hoàn thành', 'Đã hủy'] as string[]).map(tt => (
              <TouchableOpacity
                key={tt}
                style={[styles.ttBtn, trangThai === tt && styles.ttBtnActive]}
                onPress={() => onTrangThai(tt)}
              >
                <Text style={[styles.ttBtnText, trangThai === tt && { color: C.blue, fontWeight: '600' }]}>
                  {tt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* List */}
        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Danh sách hóa đơn</Text>
            <Text style={styles.listCount}>{total} hóa đơn</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}><ActivityIndicator color={C.blueMid} size="large" /></View>
          ) : list.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
              <Text style={{ fontSize: 13, color: C.muted }}>Không có hóa đơn nào</Text>
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {list.map((hd, i) => (
                <TouchableOpacity
                  key={hd.maHoaDon}
                  style={[styles.hdItem, i === list.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => fetchDetail(hd.maHoaDon)}
                  activeOpacity={0.7}
                >
                  {/* Row 1: Mã + trạng thái */}
                  <View style={styles.hdRow1}>
                    <Text style={styles.hdMaDon}>{hd.maDon}</Text>
                    <TrangThaiBadge trangThai={hd.trangThai} />
                  </View>
                  {/* Row 2: Ngày + nhân viên */}
                  <View style={styles.hdRow2}>
                    <Text style={styles.hdMeta}>🕐 {hd.ngayLap}</Text>
                    <Text style={styles.hdMeta}>👤 {hd.nhanVien}</Text>
                  </View>
                  {/* Row 3: Số mặt hàng + thực thu */}
                  <View style={styles.hdRow3}>
                    <Text style={styles.hdSoSP}>{hd.soMatHang} mặt hàng</Text>
                    <Text style={styles.hdThucThu}>{fmt(hd.thucThu)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                disabled={page === 1}
                onPress={() => { const p = page - 1; setPage(p); fetchList(p, keyword, tuNgay, denNgay, trangThai); }}
              >
                <Text style={[styles.pageBtnText, page === 1 && { color: C.muted }]}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.pageInfo}>Trang {page} / {totalPages}</Text>

              <TouchableOpacity
                style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                disabled={page === totalPages}
                onPress={() => { const p = page + 1; setPage(p); fetchList(p, keyword, tuNgay, denNgay, trangThai); }}
              >
                <Text style={[styles.pageBtnText, page === totalPages && { color: C.muted }]}>›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Chi tiết modal */}
      <ChiTietModal
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        detail={detail}
        loading={detailLoading}
        onHuy={(id) => { setHuyId(id); setShowHuy(true); }}
      />

      {/* Hủy modal */}
      <HuyModal
        visible={showHuy}
        onClose={() => setShowHuy(false)}
        onConfirm={(lyDo) => { if (huyId) doHuy(huyId, lyDo); }}
        loading={huyLoading}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  topbar: {
    height: 52, backgroundColor: C.blue,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, justifyContent: 'space-between',
  },
  topbarTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  refreshBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 12, gap: 4,
  },
  statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11.5, color: C.muted, marginTop: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },

  filterBar: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 12, marginBottom: 12, gap: 8,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: 8,
    paddingHorizontal: 10, height: 38,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.text },
  quickBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1, borderColor: C.border, backgroundColor: C.white,
  },
  quickBtnActive: { backgroundColor: C.blueLight, borderColor: C.blueMid },
  quickBtnText: { fontSize: 12.5, color: C.muted },
  ttFilterRow: { flexDirection: 'row', gap: 6 },
  ttBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 6,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  ttBtnActive: { backgroundColor: C.blueLight, borderColor: C.blueMid },
  ttBtnText: { fontSize: 12, color: C.muted },

  listCard: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  listTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  listCount: { fontSize: 12, color: C.muted },

  loadingBox: { alignItems: 'center', paddingVertical: 40 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },

  hdItem: {
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 5,
  },
  hdRow1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hdMaDon: { fontSize: 14, fontWeight: '700', color: C.blue },
  hdRow2: { flexDirection: 'row', gap: 12 },
  hdMeta: { fontSize: 12, color: C.muted },
  hdRow3: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hdSoSP: { fontSize: 12, color: C.muted },
  hdThucThu: { fontSize: 14, fontWeight: '800', color: C.green },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  pagination: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 16,
  },
  pageBtn: {
    width: 36, height: 36, borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.white,
  },
  pageBtnDisabled: { backgroundColor: C.bg, borderColor: C.border },
  pageBtnText: { fontSize: 18, fontWeight: '700', color: C.blue },
  pageInfo: { fontSize: 13, color: C.muted },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  modalCloseBtn: { padding: 4 },
  modalLoading: { alignItems: 'center', paddingVertical: 60 },
  modalBody: { padding: 16, maxHeight: 500 },
  modalFooter: {
    flexDirection: 'row', gap: 8, padding: 14,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  modalBtnClose: {
    flex: 1, height: 40, borderWidth: 1, borderColor: C.border,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  modalBtnHuy: {
    flex: 1, height: 40, backgroundColor: C.red,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },

  // Detail
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  metaItem: { width: (SW - 64) / 2 },
  metaLabel: { fontSize: 11.5, color: C.muted, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '600', color: C.text },
  sectionTitle: { borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 8, marginBottom: 8 },

  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tableHeader: { backgroundColor: '#f8f9fb' },
  col1: { width: 24, fontSize: 12, paddingRight: 4 },
  colName: { flex: 1, paddingRight: 6 },
  colSL: { width: 32, fontSize: 13 },
  colMoney: { width: 90, fontSize: 12, textAlign: 'right' },

  summaryBox: {
    backgroundColor: C.blueLight, borderRadius: 10, padding: 12, marginTop: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryBig: { borderTopWidth: 1, borderTopColor: '#c5d8fb', marginTop: 4, paddingTop: 8 },
  summaryLabel: { fontSize: 13, color: C.muted },
  summaryVal: { fontSize: 13, fontWeight: '600', color: C.text },

  lyDoInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: 8,
    padding: 10, fontSize: 13, color: C.text, minHeight: 80,
    textAlignVertical: 'top',
  },
});