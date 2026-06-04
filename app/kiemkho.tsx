// app/(tabs)/kiemkho.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE = 'http://taphoacuakien.runasp.net';

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
  purple: '#6a1b9a',
  purpleLight: '#f3e5f5',
  border: '#e8eaed',
  bg: '#f1f3f4',
  text: '#202124',
  muted: '#5f6368',
  white: '#ffffff',
};

// ─── TYPES ────────────────────────────────────────────────────────────────
type TrangThaiPhieu = 'Phác thảo' | 'Đang kiểm' | 'Đã cân bằng';

type PhieuItem = {
  MaPhieu: number;
  NgayTao: string;
  NgayCanBang: string | null;
  NguoiTao: string;
  TrangThai: TrangThaiPhieu;
  SoSanPham: number;
};

type ChiTietRow = {
  MaChiTiet: number;
  MaSanPham: number;
  TenSanPham: string;
  MaVach: string;
  SoLuongHeThong: number;
  SoLuongThucTe: number | null;
  ChenhLech: number | null;
  TrangThai: 'Chưa kiểm' | 'Khớp' | 'Thừa' | 'Thiếu';
  GhiChu: string;
};

type TongHop = {
  TongSanPham: number;
  ChuaKiem: number;
  Khop: number;
  Thua: number;
  Thieu: number;
  TongChenhLech: number;
};

type PhieuDetail = {
  phieu: {
    MaPhieu: number; NgayTao: string; NgayCanBang: string | null;
    NguoiTao: string; GhiChu: string; TrangThai: TrangThaiPhieu;
  };
  tongHop: TongHop;
  data: ChiTietRow[];
};

// ─── HELPERS ──────────────────────────────────────────────────────────────
function parseDateNet(val: string): string {
  const m = /\/Date\((\d+)\)\//.exec(val);
  if (m) {
    return new Date(parseInt(m[1])).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
  return val || '—';
}

async function postForm(url: string, body: Record<string, string>) {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  const text = await res.text();
  return JSON.parse(text);
}

// ─── TRANG THAI BADGE ─────────────────────────────────────────────────────
function PBadge({ tt }: { tt: TrangThaiPhieu }) {
  const cfg =
    tt === 'Đã cân bằng' ? { bg: C.greenLight, color: C.green, icon: '✓' } :
    tt === 'Đang kiểm'   ? { bg: C.orangeLight, color: C.orange, icon: '⏳' } :
                           { bg: C.blueLight, color: C.blue, icon: '📝' };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.icon} {tt}</Text>
    </View>
  );
}

function CTBadge({ tt }: { tt: ChiTietRow['TrangThai'] }) {
  const cfg =
    tt === 'Khớp'  ? { bg: C.greenLight, color: C.green } :
    tt === 'Thừa'  ? { bg: C.blueLight,  color: C.blue } :
    tt === 'Thiếu' ? { bg: C.redLight,   color: C.red } :
                     { bg: C.bg,         color: C.muted };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{tt}</Text>
    </View>
  );
}

// ─── TAO PHIEU MODAL ──────────────────────────────────────────────────────
function TaoPhieuModal({ visible, onClose, onCreated }: {
  visible: boolean;
  onClose: () => void;
  onCreated: (maPhieu: number) => void;
}) {
  const [nguoiTao, setNguoiTao] = useState('');
  const [ghiChu, setGhiChu]     = useState('');
  const [loading, setLoading]   = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      const data = await postForm('/KiemKho/TaoPhieu', { nguoiTao, ghiChu });
      if (data.success) {
        setNguoiTao('');
        setGhiChu('');
        onClose();
        onCreated(data.data.MaPhieu);
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch(e:any) {
        Alert.alert('Lỗi chi tiết', e?.message ?? JSON.stringify(e));
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Tạo phiếu kiểm kho</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalX}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable form */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 16, gap: 12 }}
            >
              <View>
                <Text style={styles.inputLabel}>Người tạo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên người tạo..."
                  value={nguoiTao}
                  onChangeText={setNguoiTao}
                  returnKeyType="next"
                />
              </View>
              <View>
                <Text style={styles.inputLabel}>Ghi chú</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Ghi chú (tùy chọn)..."
                  value={ghiChu}
                  onChangeText={setGhiChu}
                  multiline
                />
              </View>
            </ScrollView>

            {/* Footer — always visible above keyboard */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.btnClose} onPress={onClose}>
                <Text style={{ fontSize: 13 }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handle} disabled={loading}>
                {loading
                  ? <ActivityIndicator color={C.white} size="small" />
                  : <Text style={{ fontSize: 13, fontWeight: '700', color: C.white }}>✓ Tạo phiếu</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── THEM SP MODAL ────────────────────────────────────────────────────────
function ThemSPModal({ visible, onClose, maPhieu, onAdded }: {
  visible: boolean;
  onClose: () => void;
  maPhieu: number;
  onAdded: () => void;
}) {
  const [keyword, setKeyword]     = useState('');
  const [results, setResults]     = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<any>(null);

  const search = (kw: string) => {
    setKeyword(kw);
    clearTimeout(timer.current);
    if (!kw.trim()) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `${API_BASE}/KiemKho/TimSanPham?keyword=${encodeURIComponent(kw)}`;
        console.log('Fetching:', url); // thêm dòng này
        const res  = await fetch(url);
        const text = await res.text();
        console.log('Response:', text); // thêm dòng này
        const data = JSON.parse(text);
        console.log('Results:', data);
        setResults(data ?? []);
        console.log('Results length:', data?.length);
      } catch (e: any) {
        console.log('Error:', e?.message);
      }
      setSearching(false);
    }, 300);
  };

  const them = async (maSanPham: number) => {
    try {
      const data = await postForm('/KiemKho/ThemSanPham', {
        maPhieu: String(maPhieu),
        maSanPham: String(maSanPham),
      });
      if (data.success) {
        onAdded();
        setKeyword('');
        setResults([]);
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch {
      Alert.alert('Lỗi', 'Lỗi kết nối!');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { maxHeight: '80%' }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>➕ Thêm sản phẩm</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalX}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Search input — always visible */}
            <View style={{ padding: 12 }}>
              <View style={styles.searchWrap}>
                <Text style={{ color: C.muted, marginRight: 6 }}>🔍</Text>
                <TextInput
                  style={{ flex: 1, fontSize: 13 }}
                  placeholder="Tìm tên hoặc mã vạch..."
                  value={keyword}
                  onChangeText={search}
                  autoFocus
                  returnKeyType="search"
                />
                {searching && <ActivityIndicator size="small" color={C.blueMid} />}
              </View>
            </View>

            {/* Results list — scrollable */}
            <ScrollView
              style={{ flex: 1, minHeight: 200 }}
              keyboardShouldPersistTaps="handled"
            >
              {results.map(sp => (
                <TouchableOpacity
                  key={sp.MaSanPham}
                  style={styles.spRow}
                  onPress={() => them(sp.MaSanPham)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>
                      {sp.TenSanPham}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.muted }}>
                      {sp.MaVach || ''} · Tồn: {sp.SoLuong}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: C.blueLight }]}>
                    <Text style={{ fontSize: 12, color: C.blue, fontWeight: '600' }}>+ Thêm</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {keyword && !searching && results.length === 0 && (
                <Text style={{ textAlign: 'center', padding: 20, color: C.muted, fontSize: 13 }}>
                  Không tìm thấy
                </Text>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.btnClose, { flex: 1 }]} onPress={onClose}>
                <Text style={{ fontSize: 13 }}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── NHAP SL MODAL ────────────────────────────────────────────────────────
function NhapSLModal({ visible, onClose, ct, onSaved }: {
  visible: boolean;
  onClose: () => void;
  ct: ChiTietRow | null;
  onSaved: (updated: any) => void;
}) {
  const [sl, setSL]           = useState('');
  const [ghiChu, setGhiChu]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ct) {
      setSL(ct.SoLuongThucTe != null ? String(ct.SoLuongThucTe) : '');
      setGhiChu(ct.GhiChu || '');
    }
  }, [ct]);

  const handle = async () => {
    const n = parseInt(sl);
    if (isNaN(n) || n < 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng hợp lệ!');
      return;
    }
    setLoading(true);
    try {
      const data = await postForm('/KiemKho/NhapSoLuong', {
        maChiTiet: String(ct!.MaChiTiet),
        soLuongThucTe: String(n),
        ghiChu,
      });
      if (data.success) {
        onSaved(data.data);
        onClose();
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch {
      Alert.alert('Lỗi', 'Lỗi kết nối!');
    }
    setLoading(false);
  };

  if (!ct) return null;
  const chenhLech = sl !== '' ? parseInt(sl) - ct.SoLuongHeThong : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>📦 {ct.TenSanPham}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalX}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable form */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 16, gap: 12 }}
            >
              {/* Info row */}
              <View style={styles.infoRow}>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Hệ thống</Text>
                  <Text style={[styles.infoVal, { color: C.blue }]}>{ct.SoLuongHeThong}</Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Thực tế (nhập)</Text>
                  <TextInput
                    style={[styles.input, {
                      textAlign: 'center',
                      fontSize: 18,
                      fontWeight: '700',
                      color: C.text,
                    }]}
                    keyboardType="numeric"
                    placeholder="0"
                    value={sl}
                    onChangeText={setSL}
                    autoFocus
                    returnKeyType="done"
                  />
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Chênh lệch</Text>
                  <Text style={[styles.infoVal, {
                    color:
                      chenhLech === null ? C.muted :
                      chenhLech === 0    ? C.green :
                      chenhLech > 0      ? C.blue  : C.red,
                  }]}>
                    {chenhLech === null
                      ? '—'
                      : chenhLech > 0
                        ? `+${chenhLech}`
                        : String(chenhLech)}
                  </Text>
                </View>
              </View>

              {/* Ghi chú */}
              <View>
                <Text style={styles.inputLabel}>Ghi chú</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ghi chú (tùy chọn)..."
                  value={ghiChu}
                  onChangeText={setGhiChu}
                  returnKeyType="done"
                />
              </View>
            </ScrollView>

            {/* Footer — always visible above keyboard */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.btnClose} onPress={onClose}>
                <Text style={{ fontSize: 13 }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handle} disabled={loading}>
                {loading
                  ? <ActivityIndicator color={C.white} size="small" />
                  : <Text style={{ fontSize: 13, fontWeight: '700', color: C.white }}>✓ Lưu</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── PHIEU DETAIL SCREEN ──────────────────────────────────────────────────
function PhieuDetailScreen({ maPhieu, onBack }: { maPhieu: number; onBack: () => void }) {
  const [detail, setDetail]           = useState<PhieuDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showThem, setShowThem]       = useState(false);
  const [selectedCT, setSelectedCT]   = useState<ChiTietRow | null>(null);
  const [showNhap, setShowNhap]       = useState(false);
  const [canBangLoading, setCanBangLoading] = useState(false);
  const [filter, setFilter]           = useState<'all' | 'chua' | 'lech'>('all');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/KiemKho/GetChiTiet?maPhieu=${maPhieu}`);
      const data = await res.json();
      if (data.success) setDetail(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDetail(); }, []);

  const doCanBang = async () => {
    if (!detail) return;
    const chuaKiem = detail.tongHop.ChuaKiem;

    const proceed = await new Promise<boolean>(resolve => {
      if (chuaKiem > 0) {
        Alert.alert(
          'Cảnh báo',
          `Còn ${chuaKiem} sản phẩm chưa kiểm. Vẫn cân bằng?`,
          [
            { text: 'Hủy',         onPress: () => resolve(false) },
            { text: 'Vẫn cân bằng', onPress: () => resolve(true) },
          ]
        );
      } else {
        resolve(true);
      }
    });

    if (!proceed) return;

    setCanBangLoading(true);
    try {
      const data = await postForm('/KiemKho/CanBangKho', { maPhieu: String(maPhieu) });
      if (data.success) fetchDetail();
      else Alert.alert('Lỗi', data.message);
    } catch {
      Alert.alert('Lỗi', 'Lỗi kết nối!');
    }
    setCanBangLoading(false);
  };

  const onSavedNhap = (updated: any) => {
    if (!detail) return;
    setDetail(prev => {
      if (!prev) return prev;
      const newData = prev.data.map(row =>
        row.MaChiTiet === updated.MaChiTiet
          ? {
              ...row,
              SoLuongThucTe: updated.SoLuongThucTe,
              ChenhLech: updated.ChenhLech,
              TrangThai: updated.TrangThai,
            }
          : row
      );
      const tongHop: TongHop = {
        TongSanPham:   newData.length,
        ChuaKiem:      newData.filter(r => r.TrangThai === 'Chưa kiểm').length,
        Khop:          newData.filter(r => r.TrangThai === 'Khớp').length,
        Thua:          newData.filter(r => r.TrangThai === 'Thừa').length,
        Thieu:         newData.filter(r => r.TrangThai === 'Thiếu').length,
        TongChenhLech: newData.reduce((s, r) => s + (r.ChenhLech ?? 0), 0),
      };
      return { ...prev, data: newData, tongHop };
    });
  };

  const filteredData = detail?.data.filter(r => {
    if (filter === 'chua') return r.TrangThai === 'Chưa kiểm';
    if (filter === 'lech') return r.TrangThai === 'Thừa' || r.TrangThai === 'Thiếu';
    return true;
  }) ?? [];

  const isDone = detail?.phieu.TrangThai === 'Đã cân bằng';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ fontSize: 20, color: C.white }}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle} numberOfLines={1}>Phiếu #{maPhieu}</Text>
        {!isDone && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowThem(true)}>
            <Text style={{ fontSize: 20, color: C.white }}>＋</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={C.blueMid} size="large" />
        </View>
      ) : !detail ? (
        <View style={styles.emptyBox}>
          <Text style={{ color: C.muted }}>Không tải được dữ liệu</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14 }}>

          {/* Phiếu info */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Người tạo</Text>
              <Text style={styles.cardVal}>{detail.phieu.NguoiTao || '—'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Ngày tạo</Text>
              <Text style={styles.cardVal}>{parseDateNet(detail.phieu.NgayTao)}</Text>
            </View>
            {detail.phieu.NgayCanBang && (
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Ngày cân bằng</Text>
                <Text style={[styles.cardVal, { color: C.green }]}>
                  {parseDateNet(detail.phieu.NgayCanBang)}
                </Text>
              </View>
            )}
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Trạng thái</Text>
              <PBadge tt={detail.phieu.TrangThai} />
            </View>
            {!!detail.phieu.GhiChu && (
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Ghi chú</Text>
                <Text style={[styles.cardVal, { flex: 1, textAlign: 'right' }]}>
                  {detail.phieu.GhiChu}
                </Text>
              </View>
            )}
          </View>

          {/* Tổng hợp */}
          <View style={styles.tongHopGrid}>
            {[
              { label: 'Tổng SP',   val: detail.tongHop.TongSanPham,   color: C.blue,   bg: C.blueLight },
              { label: 'Chưa kiểm', val: detail.tongHop.ChuaKiem,      color: C.muted,  bg: C.bg },
              { label: 'Khớp',      val: detail.tongHop.Khop,          color: C.green,  bg: C.greenLight },
              { label: 'Thừa',      val: detail.tongHop.Thua,          color: C.blue,   bg: C.blueLight },
              { label: 'Thiếu',     val: detail.tongHop.Thieu,         color: C.red,    bg: C.redLight },
              {
                label: 'Tổng CL',
                val: detail.tongHop.TongChenhLech > 0
                  ? `+${detail.tongHop.TongChenhLech}`
                  : String(detail.tongHop.TongChenhLech),
                color: detail.tongHop.TongChenhLech === 0 ? C.green : C.orange,
                bg: C.orangeLight,
              },
            ].map((s, i) => (
              <View key={i} style={[styles.tongHopCell, { backgroundColor: s.bg }]}>
                <Text style={[styles.tongHopVal, { color: s.color }]}>{s.val}</Text>
                <Text style={styles.tongHopLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Filter tabs */}
          <View style={styles.filterTabs}>
            {([
              { key: 'all',  label: `Tất cả (${detail.tongHop.TongSanPham})` },
              { key: 'chua', label: `Chưa kiểm (${detail.tongHop.ChuaKiem})` },
              { key: 'lech', label: `Lệch (${detail.tongHop.Thua + detail.tongHop.Thieu})` },
            ] as { key: typeof filter; label: string }[]).map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.filterTabText, filter === f.key && { color: C.blue, fontWeight: '600' }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Danh sách chi tiết */}
          <View style={styles.listCard}>
            {filteredData.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 13, color: C.muted }}>Không có sản phẩm</Text>
              </View>
            ) : filteredData.map((ct, i) => (
              <TouchableOpacity
                key={ct.MaChiTiet}
                style={[styles.ctRow, i === filteredData.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => { if (!isDone) { setSelectedCT(ct); setShowNhap(true); } }}
                activeOpacity={isDone ? 1 : 0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }} numberOfLines={1}>
                    {ct.TenSanPham}
                  </Text>
                  {!!ct.MaVach && (
                    <Text style={{ fontSize: 11, color: C.muted }}>{ct.MaVach}</Text>
                  )}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: C.muted }}>
                      HT: <Text style={{ fontWeight: '700', color: C.text }}>{ct.SoLuongHeThong}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: C.muted }}>
                      TT: <Text style={{ fontWeight: '700', color: C.blue }}>{ct.SoLuongThucTe ?? '—'}</Text>
                    </Text>
                    {ct.ChenhLech !== null && (
                      <Text style={{
                        fontSize: 12, fontWeight: '700',
                        color: ct.ChenhLech === 0 ? C.green : ct.ChenhLech > 0 ? C.blue : C.red,
                      }}>
                        CL: {ct.ChenhLech > 0 ? `+${ct.ChenhLech}` : ct.ChenhLech}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <CTBadge tt={ct.TrangThai} />
                  {!isDone && <Text style={{ fontSize: 11, color: C.blueMid }}>Nhấn để nhập ›</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nút cân bằng */}
          {!isDone && detail.phieu.TrangThai === 'Đang kiểm' && (
            <TouchableOpacity style={styles.canBangBtn} onPress={doCanBang} disabled={canBangLoading}>
              {canBangLoading
                ? <ActivityIndicator color={C.white} />
                : <Text style={{ fontSize: 15, fontWeight: '700', color: C.white }}>⚖️ Cân bằng kho</Text>
              }
            </TouchableOpacity>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      <ThemSPModal
        visible={showThem}
        onClose={() => setShowThem(false)}
        maPhieu={maPhieu}
        onAdded={fetchDetail}
      />
      <NhapSLModal
        visible={showNhap}
        onClose={() => setShowNhap(false)}
        ct={selectedCT}
        onSaved={onSavedNhap}
      />
    </SafeAreaView>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────
export default function KiemKhoScreen() {
  const [list, setList]               = useState<PhieuItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [showTao, setShowTao]         = useState(false);
  const [selectedPhieu, setSelectedPhieu] = useState<number | null>(null);
  const [filterTT, setFilterTT]       = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchList = async () => {
    setLoading(true);
    try {
      const url = filterTT
        ? `${API_BASE}/KiemKho/GetDanhSach?trangThai=${encodeURIComponent(filterTT)}`
        : `${API_BASE}/KiemKho/GetDanhSach`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setList(data.data ?? []);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchList(); }, [filterTT]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchList();
    setRefreshing(false);
  };

  const doXoa = (maPhieu: number) => {
    Alert.alert('Xóa phiếu', 'Bạn có chắc muốn xóa phiếu này?', [
      { text: 'Hủy' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const data = await postForm('/KiemKho/XoaPhieu', { maPhieu: String(maPhieu) });
            if (data.success) fetchList();
            else Alert.alert('Lỗi', data.message);
          } catch {
            Alert.alert('Lỗi', 'Lỗi kết nối!');
          }
        },
      },
    ]);
  };

  // Nếu đang xem chi tiết phiếu
  if (selectedPhieu !== null) {
    return (
      <PhieuDetailScreen
        maPhieu={selectedPhieu}
        onBack={() => { setSelectedPhieu(null); fetchList(); }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>📦 Kiểm kho</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowTao(true)}>
          <Text style={{ fontSize: 20, color: C.white }}>＋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.blue]} />}
      >
        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[
              { key: '',             label: 'Tất cả' },
              { key: 'Phác thảo',   label: '📝 Phác thảo' },
              { key: 'Đang kiểm',   label: '⏳ Đang kiểm' },
              { key: 'Đã cân bằng', label: '✓ Đã cân bằng' },
            ].map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.quickBtn, filterTT === f.key && styles.quickBtnActive]}
                onPress={() => setFilterTT(f.key)}
              >
                <Text style={[styles.quickBtnText, filterTT === f.key && { color: C.blue, fontWeight: '600' }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={C.blueMid} size="large" />
          </View>
        ) : list.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
            <Text style={{ fontSize: 13, color: C.muted }}>Chưa có phiếu kiểm kho nào</Text>
            <TouchableOpacity style={[styles.btnPrimary, { marginTop: 12 }]} onPress={() => setShowTao(true)}>
              <Text style={{ color: C.white, fontWeight: '600', fontSize: 13 }}>＋ Tạo phiếu mới</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, gap: 10 }}>
            {list.map(p => (
              <TouchableOpacity
                key={p.MaPhieu}
                style={styles.phieuCard}
                onPress={() => setSelectedPhieu(p.MaPhieu)}
                activeOpacity={0.8}
              >
                <View style={styles.phieuRow1}>
                  <Text style={styles.phieuMa}>Phiếu #{p.MaPhieu}</Text>
                  <PBadge tt={p.TrangThai} />
                </View>
                <View style={styles.phieuRow2}>
                  <Text style={styles.phieuMeta}>👤 {p.NguoiTao || 'Không rõ'}</Text>
                  <Text style={styles.phieuMeta}>📅 {parseDateNet(p.NgayTao)}</Text>
                </View>
                <View style={styles.phieuRow3}>
                  <Text style={styles.phieuSoSP}>📦 {p.SoSanPham} sản phẩm</Text>
                  {p.TrangThai === 'Phác thảo' && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => doXoa(p.MaPhieu)}>
                      <Text style={{ fontSize: 12, color: C.red }}>🗑 Xóa</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={{ fontSize: 12, color: C.blueMid }}>Xem chi tiết ›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <TaoPhieuModal
        visible={showTao}
        onClose={() => setShowTao(false)}
        onCreated={(maPhieu) => { setShowTao(false); setSelectedPhieu(maPhieu); }}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  topbar: {
    height: 52,
    backgroundColor: C.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  topbarTitle: { fontSize: 16, fontWeight: '700', color: C.white, flex: 1 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  addBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  loadingBox: { alignItems: 'center', paddingVertical: 60 },
  emptyBox:   { alignItems: 'center', paddingVertical: 40 },

  quickBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.white,
  },
  quickBtnActive: { backgroundColor: C.blueLight, borderColor: C.blueMid },
  quickBtnText: { fontSize: 12.5, color: C.muted },

  phieuCard: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 14, gap: 6,
  },
  phieuRow1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phieuMa:   { fontSize: 15, fontWeight: '700', color: C.blue },
  phieuRow2: { flexDirection: 'row', gap: 12 },
  phieuMeta: { fontSize: 12, color: C.muted },
  phieuRow3: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  phieuSoSP: { flex: 1, fontSize: 12, color: C.muted },
  deleteBtn:  { padding: 4 },

  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Detail
  card: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 12, gap: 8,
  },
  cardRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 12.5, color: C.muted },
  cardVal:   { fontSize: 13, fontWeight: '600', color: C.text },

  tongHopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tongHopCell: {
    flex: 1, minWidth: '30%', borderRadius: 10,
    padding: 10, alignItems: 'center', gap: 2,
  },
  tongHopVal:   { fontSize: 18, fontWeight: '800' },
  tongHopLabel: { fontSize: 11, color: C.muted },

  filterTabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  filterTab: {
    flex: 1, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', backgroundColor: C.white,
  },
  filterTabActive: { backgroundColor: C.blueLight, borderColor: C.blueMid },
  filterTabText:   { fontSize: 11.5, color: C.muted },

  listCard: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', marginBottom: 14,
  },
  ctRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 8,
  },

  canBangBtn: {
    backgroundColor: C.green, borderRadius: 12,
    height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },

  // Modals
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: C.white, borderRadius: 16,
    width: '92%', overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  modalX:     { fontSize: 24, color: C.muted, paddingLeft: 8 },
  modalFooter: {
    flexDirection: 'row', gap: 8, padding: 14,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  btnClose: {
    flex: 1, height: 42, borderWidth: 1, borderColor: C.border,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  btnPrimary: {
    flex: 1, height: 42, backgroundColor: C.blue,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  inputLabel: { fontSize: 12.5, color: C.muted, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 8,
    padding: 10, fontSize: 13, color: C.text,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: 8,
    paddingHorizontal: 10, height: 40,
  },
  spRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 10,
  },
  infoRow:   { flexDirection: 'row', gap: 8 },
  infoCell:  { flex: 1, alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: 11.5, color: C.muted },
  infoVal:   { fontSize: 20, fontWeight: '800' },
});