// app/(tabs)/trahang.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
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
  border: '#e8eaed',
  bg: '#f1f3f4',
  text: '#202124',
  muted: '#5f6368',
  white: '#ffffff',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────
function parseDateNet(val: string | null): string {
  if (!val) return '—';
  const m = /\/Date\((\d+)\)\//.exec(val);
  if (m) {
    return new Date(parseInt(m[1])).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
  return val;
}

const fmt = (n: number) => Number(n).toLocaleString('vi-VN') + ' ₫';

// Controller TaoPhieuTra nhận JSON body
async function postJSON(url: string, body: object) {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Controller XacNhan/Huy nhận query string: /XacNhan?maPhieuTra=x
async function postQueryString(url: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}${url}?${qs}`, { method: 'POST' });
  return res.json();
}

// ─── TYPES ────────────────────────────────────────────────────────────────
type TrangThai = 'Chờ xác nhận' | 'Đã trả' | 'Đã hủy';

type PhieuItem = {
  MaPhieuTra: number;
  MaPhieuNhap: number;
  MaPhieuNhapText: string;
  TenNhaCungCap: string;
  NgayTra: string;
  LyDo: string;
  TongTienTra: number;
  TrangThai: TrangThai;
  SoSanPham: number;
};

// Khớp với ChiTietPhieuNhap trong controller GetPhieuNhap
type ChiTietNhap = {
  MaChiTiet: number;
  MaSanPham: number;   // Controller dùng MaSanPham làm key khi tạo phiếu trả
  TenSanPham: string;
  MaVach: string;
  SoLuong: number;
  GiaNhap: number;
  ThanhTien: number;
  SoLuongDaTra: number;
};

type PhieuNhapInfo = {
  MaPhieuNhap: number;
  MaPhieu: string;
  TenNhaCungCap: string;
  NgayNhap: string;
  TongTien: number;
};

type ChiTietTra = {
  MaChiTiet: number;
  MaSanPham: number;
  TenSanPham: string;
  MaVach: string;
  SoLuongNhap: number;
  SoLuongTra: number;
  GiaNhap: number;
  ThanhTien: number;
  GhiChu: string;
};

type PhieuTraDetail = {
  phieu: {
    MaPhieuTra: number;
    MaPhieuNhap: number;
    MaPhieuNhapText: string;
    TenNhaCungCap: string;
    NgayTra: string;
    LyDo: string;
    TongTienTra: number;
    TrangThai: TrangThai;
  };
  chitiets: ChiTietTra[];
};

// ─── TRANG THAI BADGE ─────────────────────────────────────────────────────
function TTBadge({ tt }: { tt: TrangThai }) {
  const cfg =
    tt === 'Đã trả'       ? { bg: C.greenLight,  color: C.green,  icon: '✓' } :
    tt === 'Chờ xác nhận' ? { bg: C.orangeLight, color: C.orange, icon: '⏳' } :
                            { bg: C.redLight,     color: C.red,    icon: '✕' };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.icon} {tt}</Text>
    </View>
  );
}

// ─── TAO PHIEU TRA MODAL ──────────────────────────────────────────────────
function TaoPhieuTraModal({ visible, onClose, onCreated }: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep]               = useState<1 | 2>(1);
  const [maPhieuNhap, setMaPhieuNhap] = useState('');
  const [phieuNhap, setPhieuNhap]     = useState<PhieuNhapInfo | null>(null);
  const [chitiets, setChitiets]       = useState<ChiTietNhap[]>([]);
  const [daTraRoi, setDaTraRoi]       = useState(false);
  const [lyDo, setLyDo]               = useState('');
  // Key: MaSanPham — đúng với controller TaoPhieuTra.ChiTiets[].MaSanPham
  const [soLuongs, setSoLuongs] = useState<Record<number, string>>({});
  const [ghiChus, setGhiChus]   = useState<Record<number, string>>({});
  const [fetching, setFetching]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep(1); setMaPhieuNhap(''); setPhieuNhap(null);
    setChitiets([]); setDaTraRoi(false); setLyDo('');
    setSoLuongs({}); setGhiChus({});
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Tìm phiếu nhập ──────────────────────────────────────────────────────
  const timPhieu = async () => {
    const id = parseInt(maPhieuNhap.trim());
    if (isNaN(id) || id <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã phiếu nhập hợp lệ!');
      return;
    }
    setFetching(true);
    try {
      const res  = await fetch(`${API_BASE}/TraHangNhap/GetPhieuNhap?maPhieuNhap=${id}`);
      const data = await res.json();
      console.log('phieuNhap:', data.phieu);
      console.log('chitiets length:', data.chitiets?.length);
      console.log('chitiets:', JSON.stringify(data.chitiets));

      if (!data.success) {
        Alert.alert('Lỗi', data.message || 'Không tìm thấy phiếu nhập');
        setFetching(false);
        return;
      }

      // Gán state đồng thời, step 2 render sau khi state đã có
      const pn  = data.phieu     as PhieuNhapInfo;
      const cts = data.chitiets  as ChiTietNhap[];
      const dtr = !!data.daTraRoi;

      setPhieuNhap(pn);
      setChitiets(cts);
      setDaTraRoi(dtr);
      // Reset số lượng / ghi chú cho lần tìm mới
      setSoLuongs({});
      setGhiChus({});
      // Chuyển step sau cùng
      setStep(2);
    } catch (e) {
      console.log('timPhieu error:', e);
      Alert.alert('Lỗi', 'Lỗi kết nối!');
    }
    setFetching(false);
  };

  // ── Tạo phiếu trả ───────────────────────────────────────────────────────
  const taoPhieu = async () => {
    if (!phieuNhap) return;

    if (!lyDo.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do trả hàng!');
      return;
    }

    const items = chitiets
      .map(ct => ({
        MaSanPham:  ct.MaSanPham,
        SoLuongTra: parseInt(soLuongs[ct.MaSanPham] || '0'),
        GhiChu:     ghiChus[ct.MaSanPham] || '',
      }))
      .filter(item => item.SoLuongTra > 0);

    if (!items.length) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng trả cho ít nhất 1 sản phẩm!');
      return;
    }

    setSubmitting(true);
    try {
      const res  = await fetch(`${API_BASE}/TraHangNhap/TaoPhieuTra`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          MaPhieuNhap: phieuNhap.MaPhieuNhap,
          LyDo:        lyDo.trim(),
          ChiTiets:    items,
        }),
      });
      const data = await res.json();

      if (data.success) {
        Alert.alert('Thành công', 'Tạo phiếu trả hàng thành công!', [
          { text: 'OK', onPress: () => { handleClose(); onCreated(); } },
        ]);
      } else {
        Alert.alert('Lỗi', data.message || 'Tạo phiếu thất bại');
      }
    } catch (e) {
      console.log('taoPhieu error:', e);
      Alert.alert('Lỗi', 'Lỗi kết nối!');
    }
    setSubmitting(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { maxHeight: '92%' }]}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={step === 2 ? () => setStep(1) : handleClose}>
                <Text style={{ fontSize: 20, color: C.muted }}>{step === 2 ? '‹' : '×'}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {step === 1 ? '🔍 Tìm phiếu nhập' : '📋 Tạo phiếu trả hàng'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Step 1: Tìm phiếu nhập */}
            {step === 1 && (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 16, gap: 12 }}
              >
                <Text style={styles.inputLabel}>Mã phiếu nhập (số)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mã phiếu nhập..."
                  keyboardType="numeric"
                  value={maPhieuNhap}
                  onChangeText={setMaPhieuNhap}
                  autoFocus
                  returnKeyType="search"
                  onSubmitEditing={timPhieu}
                />
                <TouchableOpacity style={styles.btnPrimary} onPress={timPhieu} disabled={fetching}>
                  {fetching
                    ? <ActivityIndicator color={C.white} />
                    : <Text style={{ color: C.white, fontWeight: '700', fontSize: 14 }}>🔍 Tìm phiếu</Text>
                  }
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Step 2: Nhập chi tiết trả */}
            {step === 2 && phieuNhap && (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 14, gap: 12 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}  
                showsVerticalScrollIndicator={true}
              >
                {/* Thông tin phiếu nhập */}
                <View style={[styles.infoCard, daTraRoi && { borderColor: C.orange, borderWidth: 1.5 }]}>
                  {daTraRoi && (
                    <View style={[styles.badge, { backgroundColor: C.orangeLight, marginBottom: 8 }]}>
                      <Text style={{ fontSize: 11.5, color: C.orange, fontWeight: '600' }}>
                        ⚠️ Phiếu này đã có phiếu trả trước đó
                      </Text>
                    </View>
                  )}
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Mã phiếu nhập</Text>
                    <Text style={[styles.cardVal, { color: C.blue }]}>{phieuNhap.MaPhieu}</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Nhà cung cấp</Text>
                    <Text style={styles.cardVal}>{phieuNhap.TenNhaCungCap}</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Ngày nhập</Text>
                    <Text style={styles.cardVal}>{parseDateNet(phieuNhap.NgayNhap)}</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Tổng tiền nhập</Text>
                    <Text style={[styles.cardVal, { color: C.green }]}>{fmt(phieuNhap.TongTien)}</Text>
                  </View>
                </View>

                {/* Lý do */}
                <View>
                  <Text style={styles.inputLabel}>
                    Lý do trả hàng <Text style={{ color: C.red }}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                    placeholder="Nhập lý do trả hàng..."
                    value={lyDo}
                    onChangeText={setLyDo}
                    multiline
                  />
                </View>

                {/* Chi tiết sản phẩm */}
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: C.text }}>
                  Chọn sản phẩm trả ({chitiets.length} SP)
                </Text>

                {chitiets.map(ct => {
                  const conLai    = ct.SoLuong - ct.SoLuongDaTra;
                  // Dùng MaSanPham làm key — khớp với controller
                  const sl        = parseInt(soLuongs[ct.MaSanPham] || '0');
                  const thanhTien = sl * ct.GiaNhap;
                  return (
                    // key dùng MaChiTiet để React render đúng, nhưng state dùng MaSanPham
                    <View key={ct.MaChiTiet} style={styles.spTraCard}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>
                        {ct.TenSanPham}
                      </Text>
                      {!!ct.MaVach && (
                        <Text style={{ fontSize: 11, color: C.muted }}>{ct.MaVach}</Text>
                      )}

                      <View style={styles.spMetaRow}>
                        <Text style={styles.spMeta}>
                          Đã nhập: <Text style={{ fontWeight: '700' }}>{ct.SoLuong}</Text>
                        </Text>
                        <Text style={styles.spMeta}>
                          Đã trả: <Text style={{ fontWeight: '700', color: C.orange }}>{ct.SoLuongDaTra}</Text>
                        </Text>
                        <Text style={styles.spMeta}>
                          Còn trả: <Text style={{ fontWeight: '700', color: C.green }}>{conLai}</Text>
                        </Text>
                      </View>

                      <View style={styles.slRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>SL trả (tối đa {conLai})</Text>
                          <TextInput
                            style={[
                              styles.input,
                              conLai === 0 && { backgroundColor: C.bg, color: C.muted },
                            ]}
                            keyboardType="numeric"
                            placeholder="0"
                            value={soLuongs[ct.MaSanPham] || ''}
                            editable={conLai > 0}
                            returnKeyType="done"
                            onChangeText={v => {
                              const n = parseInt(v);
                              if (!isNaN(n) && n > conLai) return;
                              setSoLuongs(prev => ({ ...prev, [ct.MaSanPham]: v }));
                            }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>Giá nhập</Text>
                          <View style={[styles.input, { justifyContent: 'center' }]}>
                            <Text style={{ color: C.blue, fontWeight: '600' }}>{fmt(ct.GiaNhap)}</Text>
                          </View>
                        </View>
                      </View>

                      {sl > 0 && (
                        <Text style={{ fontSize: 12, color: C.green, marginTop: 2 }}>
                          → Thành tiền trả:{' '}
                          <Text style={{ fontWeight: '700' }}>{fmt(thanhTien)}</Text>
                        </Text>
                      )}

                      <TextInput
                        style={[styles.input, { marginTop: 6 }]}
                        placeholder="Ghi chú (tùy chọn)..."
                        value={ghiChus[ct.MaSanPham] || ''}
                        returnKeyType="done"
                        onChangeText={v => setGhiChus(prev => ({ ...prev, [ct.MaSanPham]: v }))}
                      />
                    </View>
                  );
                })}

                {/* Tổng tiền trả */}
                {(() => {
                  const tong = chitiets.reduce((s, ct) => {
                    const sl = parseInt(soLuongs[ct.MaSanPham] || '0');
                    return s + sl * ct.GiaNhap;
                  }, 0);
                  return tong > 0 ? (
                    <View style={styles.tongBox}>
                      <Text style={{ fontSize: 14, color: C.muted }}>Tổng tiền trả hàng:</Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: C.red }}>{fmt(tong)}</Text>
                    </View>
                  ) : null;
                })()}

                <View style={{ height: 20 }} />
              </ScrollView>
            )}

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.btnClose} onPress={handleClose}>
                <Text style={{ fontSize: 13 }}>Hủy</Text>
              </TouchableOpacity>
              {step === 2 && (
                <TouchableOpacity style={styles.btnPrimary} onPress={taoPhieu} disabled={submitting}>
                  {submitting
                    ? <ActivityIndicator color={C.white} />
                    : <Text style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>✓ Tạo phiếu trả</Text>
                  }
                </TouchableOpacity>
              )}
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── CHI TIET MODAL ───────────────────────────────────────────────────────
function ChiTietModal({ visible, onClose, maPhieuTra, onRefresh }: {
  visible: boolean;
  onClose: () => void;
  maPhieuTra: number | null;
  onRefresh: () => void;
}) {
  const [detail, setDetail]         = useState<PhieuTraDetail | null>(null);
  const [loading, setLoading]       = useState(false);
  const [actLoading, setActLoading] = useState(false);

  useEffect(() => {
    if (visible && maPhieuTra) {
      setDetail(null);
      setLoading(true);
      fetch(`${API_BASE}/TraHangNhap/GetChiTiet?maPhieuTra=${maPhieuTra}`)
        .then(r => r.json())
        .then(data => { if (data.success) setDetail(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [visible, maPhieuTra]);

  const doXacNhan = () => {
    Alert.alert('Xác nhận trả hàng', 'Xác nhận sẽ trừ tồn kho. Tiếp tục?', [
      { text: 'Hủy' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          setActLoading(true);
          try {
            // Controller: [HttpPost] XacNhan(int maPhieuTra) — nhận qua query string
            const data = await postQueryString('/TraHangNhap/XacNhan', {
              maPhieuTra: String(maPhieuTra),
            });
            if (data.success) { onClose(); onRefresh(); }
            else Alert.alert('Lỗi', data.message);
          } catch { Alert.alert('Lỗi', 'Lỗi kết nối!'); }
          setActLoading(false);
        },
      },
    ]);
  };

  const doHuy = () => {
    Alert.alert('Hủy phiếu trả', 'Bạn có chắc muốn hủy phiếu này?', [
      { text: 'Không' },
      {
        text: 'Hủy phiếu',
        style: 'destructive',
        onPress: async () => {
          setActLoading(true);
          try {
            // Controller: [HttpPost] Huy(int maPhieuTra) — nhận qua query string
            const data = await postQueryString('/TraHangNhap/Huy', {
              maPhieuTra: String(maPhieuTra),
            });
            if (data.success) { onClose(); onRefresh(); }
            else Alert.alert('Lỗi', data.message);
          } catch { Alert.alert('Lỗi', 'Lỗi kết nối!'); }
          setActLoading(false);
        },
      },
    ]);
  };

  const p = detail?.phieu;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalBox, { maxHeight: '90%', flex:1 }]}>

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📋 Chi tiết phiếu trả</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalX}>×</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={C.blueMid} size="large" />
            </View>
          ) : !detail || !p ? (
            <View style={styles.emptyBox}>
              <Text style={{ color: C.muted }}>Không tải được dữ liệu</Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 12 }}>
              {/* Phiếu info */}
              <View style={styles.infoCard}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Mã phiếu trả</Text>
                  <Text style={[styles.cardVal, { color: C.blue }]}>#{p.MaPhieuTra}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Phiếu nhập gốc</Text>
                  <Text style={styles.cardVal}>{p.MaPhieuNhapText}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Nhà cung cấp</Text>
                  <Text style={styles.cardVal}>{p.TenNhaCungCap}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Ngày trả</Text>
                  <Text style={styles.cardVal}>{parseDateNet(p.NgayTra)}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Lý do</Text>
                  <Text style={[styles.cardVal, { flex: 1, textAlign: 'right' }]}>{p.LyDo || '—'}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Trạng thái</Text>
                  <TTBadge tt={p.TrangThai} />
                </View>
                <View style={[
                  styles.cardRow,
                  { borderTopWidth: 1, borderTopColor: C.border, marginTop: 6, paddingTop: 10 },
                ]}>
                  <Text style={{ fontSize: 14, fontWeight: '700' }}>Tổng tiền trả</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: C.red }}>
                    {fmt(p.TongTienTra)}
                  </Text>
                </View>
              </View>

              {/* Chi tiết sản phẩm */}
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: C.text }}>
                Sản phẩm trả ({detail.chitiets.length})
              </Text>

              <View style={styles.listCard}>
                {detail.chitiets.map((ct, i) => (
                  <View
                    key={ct.MaChiTiet}
                    style={[styles.ctRow, i === detail.chitiets.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>
                        {ct.TenSanPham}
                      </Text>
                      {!!ct.MaVach && (
                        <Text style={{ fontSize: 11, color: C.muted }}>{ct.MaVach}</Text>
                      )}
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        <Text style={styles.spMeta}>
                          Nhập: <Text style={{ fontWeight: '700' }}>{ct.SoLuongNhap}</Text>
                        </Text>
                        <Text style={styles.spMeta}>
                          Trả: <Text style={{ fontWeight: '700', color: C.red }}>{ct.SoLuongTra}</Text>
                        </Text>
                        <Text style={styles.spMeta}>
                          Giá: <Text style={{ fontWeight: '700' }}>{fmt(ct.GiaNhap)}</Text>
                        </Text>
                      </View>
                      {!!ct.GhiChu && (
                        <Text style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>
                          💬 {ct.GhiChu}
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: C.red }}>
                      {fmt(ct.ThanhTien)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 10 }} />
            </ScrollView>
          )}

          {/* Footer actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnClose} onPress={onClose}>
              <Text style={{ fontSize: 13 }}>Đóng</Text>
            </TouchableOpacity>
            {p?.TrangThai === 'Chờ xác nhận' && (
              <>
                <TouchableOpacity
                  style={[styles.btnPrimary, { backgroundColor: C.red }]}
                  onPress={doHuy}
                  disabled={actLoading}
                >
                  <Text style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>✕ Hủy phiếu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={doXacNhan}
                  disabled={actLoading}
                >
                  {actLoading
                    ? <ActivityIndicator color={C.white} size="small" />
                    : <Text style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>✓ Xác nhận</Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────
export default function TraHangNhapScreen() {
  const [list, setList]             = useState<PhieuItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTT, setFilterTT]     = useState('');
  const [showTao, setShowTao]       = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchList = useCallback(async (tt: string) => {
    setLoading(true);
    try {
      // Controller GetDanhSach nhận query string ?trangThai=
      const url = tt
        ? `${API_BASE}/TraHangNhap/GetDanhSach?trangThai=${encodeURIComponent(tt)}`
        : `${API_BASE}/TraHangNhap/GetDanhSach`;
      const res  = await fetch(url);
      const data = await res.json();
      // Controller trả về { success, data: [...] }
      if (data.success) {
        setList(data.data ?? []);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
    } catch {}
    setLoading(false);
  }, [fadeAnim]);

  useEffect(() => { fetchList(filterTT); }, [filterTT]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchList(filterTT);
    setRefreshing(false);
  };

  const openDetail = (id: number) => {
    setSelectedId(id);
    setShowDetail(true);
  };

  const choXacNhan = list.filter(p => p.TrangThai === 'Chờ xác nhận').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>↩️ Trả hàng nhập</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowTao(true)}>
          <Text style={{ fontSize: 20, color: C.white }}>＋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.blue]} />}
      >
        {/* Alert chờ xác nhận */}
        {choXacNhan > 0 && (
          <View style={styles.alertBar}>
            <Text style={{ fontSize: 13, color: C.orange, fontWeight: '600' }}>
              ⏳ Có {choXacNhan} phiếu đang chờ xác nhận
            </Text>
          </View>
        )}

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[
              { key: '',              label: 'Tất cả' },
              { key: 'Chờ xác nhận', label: '⏳ Chờ xác nhận' },
              { key: 'Đã trả',       label: '✓ Đã trả' },
              { key: 'Đã hủy',       label: '✕ Đã hủy' },
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

        {/* List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={C.blueMid} size="large" />
          </View>
        ) : list.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📦</Text>
            <Text style={{ fontSize: 13, color: C.muted }}>Chưa có phiếu trả hàng nào</Text>
            <TouchableOpacity
              style={[styles.btnPrimary, { marginTop: 12 }]}
              onPress={() => setShowTao(true)}
            >
              <Text style={{ color: C.white, fontWeight: '600', fontSize: 13 }}>＋ Tạo phiếu trả</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, gap: 10 }}>
            {list.map(p => (
              <TouchableOpacity
                key={p.MaPhieuTra}
                style={styles.phieuCard}
                onPress={() => openDetail(p.MaPhieuTra)}
                activeOpacity={0.8}
              >
                <View style={styles.phieuRow1}>
                  <Text style={styles.phieuMa}>Phiếu trả #{p.MaPhieuTra}</Text>
                  <TTBadge tt={p.TrangThai} />
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                  <Text style={styles.phieuMeta}>🏭 {p.TenNhaCungCap}</Text>
                  <Text style={styles.phieuMeta}>📅 {parseDateNet(p.NgayTra)}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
                  <Text style={styles.phieuMeta}>📄 Phiếu nhập: {p.MaPhieuNhapText}</Text>
                  <Text style={styles.phieuMeta}>📦 {p.SoSanPham} SP</Text>
                </View>
                {!!p.LyDo && (
                  <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }} numberOfLines={1}>
                    💬 {p.LyDo}
                  </Text>
                )}
                <View style={[
                  styles.phieuRow1,
                  { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
                ]}>
                  <Text style={{ fontSize: 12, color: C.muted }}>Tổng tiền trả:</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: C.red }}>
                    {fmt(p.TongTienTra)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <TaoPhieuTraModal
        visible={showTao}
        onClose={() => setShowTao(false)}
        onCreated={() => fetchList(filterTT)}
      />

      <ChiTietModal
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        maPhieuTra={selectedId}
        onRefresh={() => fetchList(filterTT)}
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
  topbarTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  addBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  alertBar: {
    backgroundColor: C.orangeLight, borderRadius: 10,
    borderWidth: 1, borderColor: '#ffe082',
    padding: 12, marginBottom: 12,
  },

  loadingBox: { alignItems: 'center', paddingVertical: 60 },
  emptyBox:   { alignItems: 'center', paddingVertical: 40 },

  quickBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.white,
  },
  quickBtnActive: { backgroundColor: C.blueLight, borderColor: C.blueMid },
  quickBtnText: { fontSize: 12.5, color: C.muted },

  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  phieuCard: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, padding: 14,
  },
  phieuRow1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phieuMa:   { fontSize: 15, fontWeight: '700', color: C.blue },
  phieuMeta: { fontSize: 12, color: C.muted },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, textAlign: 'center' },
  modalX:     { fontSize: 24, color: C.muted },
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

  infoCard: {
    backgroundColor: C.blueLight, borderRadius: 12, padding: 14, gap: 8,
  },
  cardRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 12.5, color: C.muted },
  cardVal:   { fontSize: 13, fontWeight: '600', color: C.text },

  spTraCard: {
    backgroundColor: C.white, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, padding: 12, gap: 6,
  },
  spMetaRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  spMeta:    { fontSize: 12, color: C.muted },
  slRow:     { flexDirection: 'row', gap: 10 },

  tongBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.redLight, borderRadius: 10, padding: 14,
  },

  listCard: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  ctRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 8,
  },
});