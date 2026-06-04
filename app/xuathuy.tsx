// app/(tabs)/xuathuy.tsxcxc*-
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

const LY_DO_LIST = ['Hết hạn sử dụng', 'Hư hỏng', 'Kém chất lượng', 'Lý do khác'];

// ─── HELPERS ──────────────────────────────────────────────────────────────
function parseDateNet(val: string | null): string {
  if (!val) return '—';
  const m = /\/Date\((\d+)\)\//.exec(val);
  if (m) return new Date(parseInt(m[1])).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  return val;
}

const fmt = (n: number) => Number(n).toLocaleString('vi-VN') + ' ₫';

async function postForm(url: string, body: Record<string, string>) {
  const fd = new FormData();
  Object.entries(body).forEach(([k, v]) => fd.append(k, v));
  const res = await fetch(`${API_BASE}${url}`, { method: 'POST', body: fd });
  return res.json();
}

// ─── TYPES ────────────────────────────────────────────────────────────────
type TrangThai = 'Chờ xác nhận' | 'Đã hủy' | 'Đã hủy bỏ';

type PhieuItem = {
  MaPhieuHuy: number;
  NgayHuy: string;
  LyDo: string;
  GhiChu: string;
  TongGiaTri: number;
  TrangThai: TrangThai;
  SoSanPham: number;
};

type SearchSP = {
  MaSanPham: number;
  TenSanPham: string;
  MaVach: string;
  SoLuong: number;
  GiaNhap: number;
  HanSuDung: string | null;
  TrangThaiHan: string;
};

type ChiTietRow = {
  MaChiTiet: number;
  MaSanPham: number;
  TenSanPham: string;
  MaVach: string;
  SoLuongTon: number;
  SoLuongHuy: number;
  GiaNhap: number;
  ThanhTien: number;
  HanSuDung: string | null;
  GhiChu: string;
};

type PhieuDetail = {
  phieu: {
    MaPhieuHuy: number;
    NgayHuy: string;
    LyDo: string;
    GhiChu: string;
    TongGiaTri: number;
    TrangThai: TrangThai;
    SoSanPham: number;
  };
  chitiets: ChiTietRow[];
};

// ─── BADGE ────────────────────────────────────────────────────────────────
function TTBadge({ tt }: { tt: TrangThai }) {
  const cfg =
    tt === 'Đã hủy'    ? { bg: C.redLight,   color: C.red,    icon: '✓' } :
    tt === 'Đã hủy bỏ' ? { bg: C.bg,         color: C.muted,  icon: '✕' } :
                         { bg: C.orangeLight, color: C.orange, icon: '⏳' };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.icon} {tt}</Text>
    </View>
  );
}

function HanBadge({ trangThai }: { trangThai: string }) {
  const cfg =
    trangThai === 'Đã hết hạn'  ? { bg: C.redLight,   color: C.red } :
    trangThai === 'Sắp hết hạn' ? { bg: C.orangeLight, color: C.orange } :
    trangThai === 'Còn hạn'     ? { bg: C.greenLight,  color: C.green } :
                                  { bg: C.bg,           color: C.muted };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{trangThai}</Text>
    </View>
  );
}

// ─── THEM SP MODAL ────────────────────────────────────────────────────────
// Chỉ có search input, không cần KeyboardAvoidingView phức tạp
// nhưng vẫn bọc để search bar không bị che
function ThemSPModal({ visible, onClose, maPhieuHuy, onAdded }: {
  visible: boolean;
  onClose: () => void;
  maPhieuHuy: number;
  onAdded: (ct: ChiTietRow) => void;
}) {
  const [keyword, setKeyword]     = useState('');
  const [results, setResults]     = useState<SearchSP[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding]       = useState<number | null>(null);
  const timer = useRef<any>(null);

  const search = (kw: string) => {
    setKeyword(kw);
    clearTimeout(timer.current);
    if (!kw.trim()) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res  = await fetch(`${API_BASE}/XuatHuy/TimSanPham?keyword=${encodeURIComponent(kw)}`);
        const data = await res.json();
        if (data.success) setResults(data.data ?? []);
      } catch {}
      setSearching(false);
    }, 300);
  };

  const them = async (sp: SearchSP) => {
    setAdding(sp.MaSanPham);
    try {
      const data = await postForm('/XuatHuy/ThemSanPham', {
        maPhieuHuy: String(maPhieuHuy),
        maSanPham: String(sp.MaSanPham),
      });
      if (data.success) {
        onAdded(data.data);
        setKeyword('');
        setResults([]);
      } else Alert.alert('Lỗi', data.message);
    } catch {
      Alert.alert('Lỗi', 'Lỗi kết nối!');
    }
    setAdding(null);
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
              <Text style={styles.modalTitle}>➕ Thêm sản phẩm hủy</Text>
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

            {/* Results list */}
            <ScrollView style={{ flex: 1, minHeight:400 }} keyboardShouldPersistTaps="handled">
              {results.map(sp => (
                <View key={sp.MaSanPham} style={styles.spRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>{sp.TenSanPham}</Text>
                    <Text style={{ fontSize: 11, color: C.muted }}>
                      {sp.MaVach || ''} · Tồn: {sp.SoLuong}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 3 }}>
                      <HanBadge trangThai={sp.TrangThaiHan} />
                      {!!sp.HanSuDung && (
                        <Text style={{ fontSize: 11, color: C.muted }}>
                          HSD: {parseDateNet(sp.HanSuDung)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.btnPrimary, { flex: 0, paddingHorizontal: 14, height: 36 }]}
                    onPress={() => them(sp)}
                    disabled={adding === sp.MaSanPham}
                  >
                    {adding === sp.MaSanPham
                      ? <ActivityIndicator size="small" color={C.white} />
                      : <Text style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>+ Thêm</Text>
                    }
                  </TouchableOpacity>
                </View>
              ))}
              {keyword && !searching && results.length === 0 && (
                <Text style={{ textAlign: 'center', padding: 20, color: C.muted, fontSize: 13 }}>
                  Không tìm thấy sản phẩm
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

// ─── SUA SO LUONG MODAL ───────────────────────────────────────────────────
function SuaSLModal({ visible, onClose, ct, onSaved }: {
  visible: boolean;
  onClose: () => void;
  ct: ChiTietRow | null;
  onSaved: (data: any) => void;
}) {
  const [sl, setSL]           = useState('');
  const [ghiChu, setGhiChu]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ct) { setSL(String(ct.SoLuongHuy)); setGhiChu(ct.GhiChu || ''); }
  }, [ct]);

  const handle = async () => {
    const n = parseInt(sl);
    if (isNaN(n) || n <= 0) { Alert.alert('Lỗi', 'Số lượng phải lớn hơn 0!'); return; }
    if (ct && n > ct.SoLuongTon) { Alert.alert('Lỗi', `Tối đa ${ct.SoLuongTon}`); return; }
    setLoading(true);
    try {
      const data = await postForm('/XuatHuy/SuaSoLuong', {
        maChiTiet: String(ct!.MaChiTiet),
        soLuongHuy: String(n),
        ghiChu,
      });
      if (data.success) { onSaved(data.data); onClose(); }
      else Alert.alert('Lỗi', data.message);
    } catch {
      Alert.alert('Lỗi', 'Lỗi kết nối!');
    }
    setLoading(false);
  };

  if (!ct) return null;
  const thanhTien = (parseInt(sl) || 0) * ct.GiaNhap;

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
              <Text style={styles.modalTitle} numberOfLines={1}>✏️ {ct.TenSanPham}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalX}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable form */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 16, gap: 12 }}
            >
              <View style={styles.infoRow}>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Tồn kho</Text>
                  <Text style={[styles.infoVal, { color: C.green }]}>{ct.SoLuongTon}</Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>SL hủy</Text>
                  <TextInput
                    style={[styles.input, { textAlign: 'center', fontSize: 20, fontWeight: '800' }]}
                    keyboardType="numeric"
                    placeholder="1"
                    value={sl}
                    onChangeText={setSL}
                    autoFocus
                    returnKeyType="done"
                  />
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Giá vốn</Text>
                  <Text style={[styles.infoVal, { color: C.blue, fontSize: 13 }]}>{fmt(ct.GiaNhap)}</Text>
                </View>
              </View>

              {parseInt(sl) > 0 && (
                <View style={[styles.tongBox, { backgroundColor: C.redLight }]}>
                  <Text style={{ fontSize: 13, color: C.muted }}>Giá trị hủy:</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: C.red }}>{fmt(thanhTien)}</Text>
                </View>
              )}

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
                  : <Text style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>✓ Lưu</Text>
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
function PhieuDetailScreen({ maPhieuHuy, onBack }: {
  maPhieuHuy: number;
  onBack: () => void;
}) {
  const [detail, setDetail]         = useState<PhieuDetail | null>(null);
  const [loading, setLoading]       = useState(true);
  const [showThem, setShowThem]     = useState(false);
  const [selectedCT, setSelectedCT] = useState<ChiTietRow | null>(null);
  const [showSua, setShowSua]       = useState(false);
  const [actLoading, setActLoading] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/XuatHuy/GetChiTiet?maPhieuHuy=${maPhieuHuy}`);
      const data = await res.json();
      if (data.success) setDetail(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDetail(); }, []);

  const isDone = detail?.phieu.TrangThai !== 'Chờ xác nhận';

  const onAdded = (ct: ChiTietRow) => {
    setDetail(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        phieu: {
          ...prev.phieu,
          SoSanPham: prev.phieu.SoSanPham + 1,
          TongGiaTri: prev.phieu.TongGiaTri + ct.GiaNhap,
        },
        chitiets: [...prev.chitiets, ct],
      };
    });
  };

  const onSuaSL = (updated: any) => {
    setDetail(prev => {
      if (!prev) return prev;
      const chitiets = prev.chitiets.map(ct =>
        ct.MaChiTiet === updated.MaChiTiet
          ? { ...ct, SoLuongHuy: updated.SoLuongHuy, ThanhTien: updated.ThanhTien }
          : ct
      );
      return { ...prev, phieu: { ...prev.phieu, TongGiaTri: updated.TongGiaTri }, chitiets };
    });
  };

  const xoaDong = (ct: ChiTietRow) => {
    Alert.alert('Xóa dòng', `Xóa "${ct.TenSanPham}" khỏi phiếu?`, [
      { text: 'Hủy' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const data = await postForm('/XuatHuy/XoaDong', { maChiTiet: String(ct.MaChiTiet) });
            if (data.success) {
              setDetail(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  phieu: {
                    ...prev.phieu,
                    SoSanPham: prev.phieu.SoSanPham - 1,
                    TongGiaTri: data.TongGiaTri ?? 0,
                  },
                  chitiets: prev.chitiets.filter(c => c.MaChiTiet !== ct.MaChiTiet),
                };
              });
            } else Alert.alert('Lỗi', data.message);
          } catch { Alert.alert('Lỗi', 'Lỗi kết nối!'); }
        },
      },
    ]);
  };

  const xacNhan = () => {
    if (!detail?.chitiets.length) { Alert.alert('Lỗi', 'Phiếu chưa có sản phẩm nào!'); return; }
    Alert.alert(
      'Xác nhận hủy hàng',
      `Sẽ trừ tồn kho ${detail.chitiets.length} sản phẩm. Tiếp tục?`,
      [
        { text: 'Không' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setActLoading(true);
            try {
              const data = await postForm('/XuatHuy/XacNhan', { maPhieuHuy: String(maPhieuHuy) });
              if (data.success) fetchDetail();
              else Alert.alert('Lỗi', data.message);
            } catch { Alert.alert('Lỗi', 'Lỗi kết nối!'); }
            setActLoading(false);
          },
        },
      ]
    );
  };

  const huyBo = () => {
    Alert.alert('Hủy bỏ phiếu', 'Phiếu sẽ bị hủy bỏ, không thể khôi phục. Tiếp tục?', [
      { text: 'Không' },
      {
        text: 'Hủy bỏ',
        style: 'destructive',
        onPress: async () => {
          setActLoading(true);
          try {
            const data = await postForm('/XuatHuy/HuyBo', { maPhieuHuy: String(maPhieuHuy) });
            if (data.success) onBack();
            else Alert.alert('Lỗi', data.message);
          } catch { Alert.alert('Lỗi', 'Lỗi kết nối!'); }
          setActLoading(false);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ fontSize: 20, color: C.white }}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Phiếu hủy #{maPhieuHuy}</Text>
        {!isDone && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowThem(true)}>
            <Text style={{ fontSize: 20, color: C.white }}>＋</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingBox}><ActivityIndicator color={C.blueMid} size="large" /></View>
      ) : !detail ? (
        <View style={styles.emptyBox}><Text style={{ color: C.muted }}>Không tải được</Text></View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 12 }}>
          {/* Phiếu info */}
          <View style={styles.infoCard}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Trạng thái</Text>
              <TTBadge tt={detail.phieu.TrangThai} />
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Ngày hủy</Text>
              <Text style={styles.cardVal}>{parseDateNet(detail.phieu.NgayHuy)}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Lý do</Text>
              <Text style={[styles.cardVal, { color: C.red }]}>{detail.phieu.LyDo}</Text>
            </View>
            {!!detail.phieu.GhiChu && (
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Ghi chú</Text>
                <Text style={[styles.cardVal, { flex: 1, textAlign: 'right' }]}>
                  {detail.phieu.GhiChu}
                </Text>
              </View>
            )}
            <View style={[
              styles.cardRow,
              { borderTopWidth: 1, borderTopColor: C.border, marginTop: 6, paddingTop: 10 },
            ]}>
              <Text style={{ fontSize: 14, fontWeight: '700' }}>Tổng giá trị hủy</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: C.red }}>
                {fmt(detail.phieu.TongGiaTri)}
              </Text>
            </View>
          </View>

          {/* Danh sách SP */}
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: C.text }}>
            Sản phẩm hủy ({detail.chitiets.length})
          </Text>

          {detail.chitiets.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 13, color: C.muted }}>Chưa có sản phẩm nào</Text>
              {!isDone && (
                <TouchableOpacity
                  style={[styles.btnPrimary, { marginTop: 10 }]}
                  onPress={() => setShowThem(true)}
                >
                  <Text style={{ color: C.white, fontWeight: '600', fontSize: 13 }}>＋ Thêm sản phẩm</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.listCard}>
              {detail.chitiets.map((ct, i) => (
                <View
                  key={ct.MaChiTiet}
                  style={[styles.ctRow, i === detail.chitiets.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>{ct.TenSanPham}</Text>
                    {!!ct.MaVach && (
                      <Text style={{ fontSize: 11, color: C.muted }}>{ct.MaVach}</Text>
                    )}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      <Text style={styles.spMeta}>
                        Tồn: <Text style={{ fontWeight: '700' }}>{ct.SoLuongTon}</Text>
                      </Text>
                      <Text style={styles.spMeta}>
                        Hủy: <Text style={{ fontWeight: '700', color: C.red }}>{ct.SoLuongHuy}</Text>
                      </Text>
                      <Text style={styles.spMeta}>
                        Giá vốn: <Text style={{ fontWeight: '700' }}>{fmt(ct.GiaNhap)}</Text>
                      </Text>
                    </View>
                    {!!ct.HanSuDung && (
                      <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        HSD: {parseDateNet(ct.HanSuDung)}
                      </Text>
                    )}
                    {!!ct.GhiChu && (
                      <Text style={{ fontSize: 11.5, color: C.muted }}>💬 {ct.GhiChu}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: C.red }}>
                      {fmt(ct.ThanhTien)}
                    </Text>
                    {!isDone && (
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={[styles.iconBtn, { backgroundColor: C.blueLight }]}
                          onPress={() => { setSelectedCT(ct); setShowSua(true); }}
                        >
                          <Text style={{ fontSize: 13, color: C.blue }}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconBtn, { backgroundColor: C.redLight }]}
                          onPress={() => xoaDong(ct)}
                        >
                          <Text style={{ fontSize: 13, color: C.red }}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          {!isDone && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={[styles.btnClose, { flex: 1, borderColor: C.red }]}
                onPress={huyBo}
                disabled={actLoading}
              >
                <Text style={{ fontSize: 13, color: C.red, fontWeight: '600' }}>✕ Hủy bỏ phiếu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, { flex: 1.5 }]}
                onPress={xacNhan}
                disabled={actLoading}
              >
                {actLoading
                  ? <ActivityIndicator color={C.white} />
                  : <Text style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>✓ Xác nhận hủy hàng</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      <ThemSPModal
        visible={showThem}
        onClose={() => setShowThem(false)}
        maPhieuHuy={maPhieuHuy}
        onAdded={onAdded}
      />
      <SuaSLModal
        visible={showSua}
        onClose={() => setShowSua(false)}
        ct={selectedCT}
        onSaved={onSuaSL}
      />
    </SafeAreaView>
  );
}

// ─── TAO PHIEU MODAL ──────────────────────────────────────────────────────
function TaoPhieuModal({ visible, onClose, onCreated }: {
  visible: boolean;
  onClose: () => void;
  onCreated: (maPhieu: number) => void;
}) {
  const [lyDo, setLyDo]       = useState('');
  const [ghiChu, setGhiChu]   = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => { setLyDo(''); setGhiChu(''); };

  const handle = async () => {
    if (!lyDo) { Alert.alert('Lỗi', 'Vui lòng chọn lý do hủy!'); return; }
    setLoading(true);
    try {
      const data = await postForm('/XuatHuy/TaoPhieu', {
        maNguoiDung: '1', lyDo, ghiChu,
      });
      if (data.success) { reset(); onClose(); onCreated(data.data.MaPhieuHuy); }
      else Alert.alert('Lỗi', data.message);
    } catch {
      Alert.alert('Lỗi', 'Lỗi kết nối!');
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { reset(); onClose(); }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🗑️ Tạo phiếu xuất hủy</Text>
              <TouchableOpacity onPress={() => { reset(); onClose(); }}>
                <Text style={styles.modalX}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable form — lý do chọn + ghi chú input */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 16, gap: 12 }}
            >
              <View>
                <Text style={styles.inputLabel}>
                  Lý do hủy <Text style={{ color: C.red }}>*</Text>
                </Text>
                <View style={{ gap: 6 }}>
                  {LY_DO_LIST.map(ld => (
                    <TouchableOpacity
                      key={ld}
                      style={[styles.lyDoBtn, lyDo === ld && styles.lyDoBtnActive]}
                      onPress={() => setLyDo(ld)}
                    >
                      <View style={[styles.radio, lyDo === ld && styles.radioActive]} />
                      <Text style={[
                        { fontSize: 13, color: C.text },
                        lyDo === ld && { fontWeight: '600', color: C.blue },
                      ]}>
                        {ld}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View>
                <Text style={styles.inputLabel}>Ghi chú</Text>
                <TextInput
                  style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="Ghi chú thêm (tùy chọn)..."
                  value={ghiChu}
                  onChangeText={setGhiChu}
                  multiline
                />
              </View>
            </ScrollView>

            {/* Footer — always visible above keyboard */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.btnClose} onPress={() => { reset(); onClose(); }}>
                <Text style={{ fontSize: 13 }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handle} disabled={loading}>
                {loading
                  ? <ActivityIndicator color={C.white} size="small" />
                  : <Text style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>✓ Tạo phiếu</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────
export default function XuatHuyScreen() {
  const [list, setList]               = useState<PhieuItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [filterTT, setFilterTT]       = useState('');
  const [filterLyDo, setFilterLyDo]   = useState('');
  const [showTao, setShowTao]         = useState(false);
  const [selectedPhieu, setSelectedPhieu] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTT)    params.append('trangThai', filterTT);
      if (filterLyDo)  params.append('lyDo', filterLyDo);
      const res  = await fetch(`${API_BASE}/XuatHuy/GetDanhSach?${params}`);
      const data = await res.json();
      if (data.success) {
        setList(data.data ?? []);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchList(); }, [filterTT, filterLyDo]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchList();
    setRefreshing(false);
  };

  const choXacNhan = list.filter(p => p.TrangThai === 'Chờ xác nhận').length;

  if (selectedPhieu !== null) {
    return (
      <PhieuDetailScreen
        maPhieuHuy={selectedPhieu}
        onBack={() => { setSelectedPhieu(null); fetchList(); }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>🗑️ Xuất hủy hàng</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowTao(true)}>
          <Text style={{ fontSize: 20, color: C.white }}>＋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.blue]} />}
      >
        {choXacNhan > 0 && (
          <View style={styles.alertBar}>
            <Text style={{ fontSize: 13, color: C.orange, fontWeight: '600' }}>
              ⏳ {choXacNhan} phiếu đang chờ xác nhận
            </Text>
          </View>
        )}

        {/* Filter trạng thái */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[
              { key: '',              label: 'Tất cả' },
              { key: 'Chờ xác nhận', label: '⏳ Chờ xác nhận' },
              { key: 'Đã hủy',       label: '✓ Đã hủy' },
              { key: 'Đã hủy bỏ',   label: '✕ Hủy bỏ' },
            ].map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.quickBtn, filterTT === f.key && styles.quickBtnActive]}
                onPress={() => setFilterTT(f.key)}
              >
                <Text style={[
                  styles.quickBtnText,
                  filterTT === f.key && { color: C.blue, fontWeight: '600' },
                ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Filter lý do */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[styles.quickBtn, filterLyDo === '' && styles.quickBtnActive]}
              onPress={() => setFilterLyDo('')}
            >
              <Text style={[styles.quickBtnText, filterLyDo === '' && { color: C.blue, fontWeight: '600' }]}>
                Mọi lý do
              </Text>
            </TouchableOpacity>
            {LY_DO_LIST.map(ld => (
              <TouchableOpacity
                key={ld}
                style={[styles.quickBtn, filterLyDo === ld && styles.quickBtnActive]}
                onPress={() => setFilterLyDo(ld)}
              >
                <Text style={[
                  styles.quickBtnText,
                  filterLyDo === ld && { color: C.blue, fontWeight: '600' },
                ]}>
                  {ld}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={C.blueMid} size="large" />
          </View>
        ) : list.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🗑️</Text>
            <Text style={{ fontSize: 13, color: C.muted }}>Chưa có phiếu xuất hủy nào</Text>
            <TouchableOpacity
              style={[styles.btnPrimary, { marginTop: 12 }]}
              onPress={() => setShowTao(true)}
            >
              <Text style={{ color: C.white, fontWeight: '600', fontSize: 13 }}>＋ Tạo phiếu hủy</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, gap: 10 }}>
            {list.map(p => (
              <TouchableOpacity
                key={p.MaPhieuHuy}
                style={styles.phieuCard}
                onPress={() => setSelectedPhieu(p.MaPhieuHuy)}
                activeOpacity={0.8}
              >
                <View style={styles.phieuRow1}>
                  <Text style={styles.phieuMa}>Phiếu hủy #{p.MaPhieuHuy}</Text>
                  <TTBadge tt={p.TrangThai} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <Text style={styles.phieuMeta}>🕐 {parseDateNet(p.NgayHuy)}</Text>
                  <Text style={styles.phieuMeta}>📦 {p.SoSanPham} SP</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <View style={[styles.badge, { backgroundColor: C.redLight }]}>
                    <Text style={{ fontSize: 11, color: C.red, fontWeight: '600' }}>{p.LyDo}</Text>
                  </View>
                  {!!p.GhiChu && (
                    <Text style={{ fontSize: 12, color: C.muted, flex: 1 }} numberOfLines={1}>
                      💬 {p.GhiChu}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.phieuRow1,
                  { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
                ]}>
                  <Text style={{ fontSize: 12, color: C.muted }}>Giá trị hủy:</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: C.red }}>
                    {fmt(p.TongGiaTri)}
                  </Text>
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
    backgroundColor: C.red,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  topbarTitle: { fontSize: 16, fontWeight: '700', color: C.white, flex: 1 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  addBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  alertBar: {
    backgroundColor: C.orangeLight, borderRadius: 10,
    borderWidth: 1, borderColor: '#ffe082', padding: 12, marginBottom: 12,
  },
  loadingBox: { alignItems: 'center', paddingVertical: 60 },
  emptyBox:   { alignItems: 'center', paddingVertical: 40 },

  quickBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.white,
  },
  quickBtnActive: { backgroundColor: C.blueLight, borderColor: C.blueMid },
  quickBtnText:   { fontSize: 12.5, color: C.muted },

  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  phieuCard: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, padding: 14,
  },
  phieuRow1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phieuMa:   { fontSize: 15, fontWeight: '700', color: C.red },
  phieuMeta: { fontSize: 12, color: C.muted },

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
    flex: 1, height: 44, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  btnPrimary: {
    flex: 1, height: 44, backgroundColor: C.blue,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },

  inputLabel: { fontSize: 12.5, color: C.muted, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 8,
    padding: 10, fontSize: 13, color: C.text, backgroundColor: C.white,
  },

  lyDoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.white,
  },
  lyDoBtnActive: { borderColor: C.blueMid, backgroundColor: C.blueLight },
  radio:         { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border },
  radioActive:   { borderColor: C.blue, backgroundColor: C.blue },

  infoCard:  { backgroundColor: C.blueLight, borderRadius: 12, padding: 14, gap: 8 },
  cardRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 12.5, color: C.muted },
  cardVal:   { fontSize: 13, fontWeight: '600', color: C.text },

  listCard: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  ctRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 8,
  },
  spMeta: { fontSize: 12, color: C.muted },
  spRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 10,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: 8,
    paddingHorizontal: 10, height: 40,
  },
  iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tongBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 10, padding: 12,
  },
  infoRow:   { flexDirection: 'row', gap: 8 },
  infoCell:  { flex: 1, alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: 11.5, color: C.muted },
  infoVal:   { fontSize: 20, fontWeight: '800', color: C.text },
});