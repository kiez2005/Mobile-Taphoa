// app/(tabs)/banhang.tsx
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const BASE_URL = 'http://172.20.10.2/cuahangtaphoa';

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  blue: '#1565c0',
  blueDark: '#0d47a1',
  blueLight: '#e8f0fe',
  border: '#e4e7ec',
  bg: '#eef0f3',
  white: '#ffffff',
  text: '#1a1a2e',
  muted: '#6b7280',
  success: '#166534',
  successBg: '#dcfce7',
  danger: '#ef4444',
  dangerBg: '#fee2e2',
  warning: '#f57c00',
  gray: '#9ca3af',
};

const { width: SW, height: SH } = Dimensions.get('window');

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface SanPham {
  MaSanPham: number;
  TenSanPham: string;
  GiaBan: number;
  SoLuong: number;
  MaVach: string;
  HinhAnh: string;
}

interface CartItem extends SanPham {
  SoLuongCart: number;
}

interface PendingReceipt {
  maDon: string;
  cart: CartItem[];
  phanTram: number;
  tong: number;
  tienSauGiam: number;
  tienKhach: number;
}

// ─── FORMAT TIỀN ─────────────────────────────────────────────────────────────
const fmt = (n: number) => Number(n).toLocaleString('vi-VN') + ' ₫';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
function Toast({
  msg, type, visible,
}: { msg: string; type: 'success' | 'error' | 'info'; visible: boolean }) {
  const bg = type === 'success' ? '#166534' : type === 'error' ? '#991b1b' : C.blue;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '🔍';
  if (!visible) return null;
  return (
    <View style={[styles.toast, { backgroundColor: bg }]}>
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <Text style={styles.toastText}>{msg}</Text>
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function BanHangScreen() {
  // State
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SanPham[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPct, setDiscountPct] = useState('0');
  const [tienKhach, setTienKhach] = useState('');

  const [paying, setPaying] = useState(false);
  const [pendingReceipt, setPendingReceipt] = useState<PendingReceipt | null>(null);

  // Modals
  const [showConfirmPrint, setShowConfirmPrint] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Toast
  const [toast, setToast] = useState({ msg: '', type: 'info' as 'success' | 'error' | 'info', visible: false });
  const toastTimer = useRef<any>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  };

  // ─── TÍNH TIỀN ──────────────────────────────────────────────────────────────
  const pct = parseFloat(discountPct) || 0;
  const tongTienHang = cart.reduce((s, x) => s + x.GiaBan * x.SoLuongCart, 0);
  const tienGiam = tongTienHang * (pct / 100);
  const tienSauGiam = tongTienHang - tienGiam;
  const tienKhachNum = parseFloat(tienKhach) || 0;
  const tienThua = tienKhachNum - tienSauGiam;

  // ─── TÌM SẢN PHẨM ───────────────────────────────────────────────────────────
  const searchTimer = useRef<any>(null);

  const onSearchChange = (text: string) => {
    setSearchText(text);
    clearTimeout(searchTimer.current);
    if (!text.trim()) { setShowDropdown(false); setSearchResults([]); return; }
    searchTimer.current = setTimeout(() => timSanPham(text.trim()), 300);
  };

  const timSanPham = async (kw: string) => {
    setSearching(true);
    try {
      const res = await fetch(`${BASE_URL}/BanHang/TimSanPham?keyword=${encodeURIComponent(kw)}`);
      const data: SanPham[] = await res.json();
      setSearchResults(data);
      setShowDropdown(true);
    } catch {
      showToast('Lỗi kết nối server!', 'error');
    } finally {
      setSearching(false);
    }
  };

  // ─── THÊM VÀO GIỎ ───────────────────────────────────────────────────────────
  const addToCart = (sp: SanPham) => {
    if (sp.SoLuong <= 0) { showToast('Sản phẩm đã hết hàng!', 'error'); return; }
    setSearchText('');
    setShowDropdown(false);

    setCart(prev => {
      const idx = prev.findIndex(x => x.MaSanPham === sp.MaSanPham);
      if (idx >= 0) {
        if (prev[idx].SoLuongCart >= sp.SoLuong) {
          showToast('Không đủ tồn kho!', 'error');
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...next[idx], SoLuongCart: next[idx].SoLuongCart + 1 };
        return next;
      }
      return [...prev, { ...sp, SoLuongCart: 1 }];
    });
    showToast('Đã thêm: ' + sp.TenSanPham, 'success');
  };

  // ─── SỬA SỐ LƯỢNG ───────────────────────────────────────────────────────────
  const changeQty = (idx: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      const newQty = next[idx].SoLuongCart + delta;
      if (newQty < 1) { next.splice(idx, 1); return next; }
      if (newQty > next[idx].SoLuong) { showToast('Không đủ tồn kho!', 'error'); return prev; }
      next[idx] = { ...next[idx], SoLuongCart: newQty };
      return next;
    });
  };

  const removeItem = (idx: number) => {
    setCart(prev => { const n = [...prev]; n.splice(idx, 1); return n; });
  };

  const resetCart = () => {
    if (cart.length === 0) return;
    Alert.alert('Xác nhận', 'Hủy đơn hàng hiện tại?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đơn', style: 'destructive', onPress: () => {
          setCart([]); setDiscountPct('0'); setTienKhach('');
        }
      },
    ]);
  };

  // ─── THANH TOÁN ──────────────────────────────────────────────────────────────
  const thanhToan = async () => {
    if (cart.length === 0) { showToast('Chưa có sản phẩm trong đơn!', 'error'); return; }
    if (tienKhachNum < tienSauGiam) { showToast('Số tiền khách đưa chưa đủ!', 'error'); return; }

    setPaying(true);
    try {
      const body = {
        PhanTramGiam: pct,
        TongTien: tongTienHang,
        TienSauGiam: tienSauGiam,
        TienKhachDua: tienKhachNum,
        ChiTiet: cart.map(x => ({
          MaSanPham: x.MaSanPham,
          TenSanPham: x.TenSanPham,
          SoLuong: x.SoLuongCart,
          GiaBan: x.GiaBan,
        })),
      };

      const res = await fetch(`${BASE_URL}/BanHang/ThanhToan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        // Lưu snapshot để in
        setPendingReceipt({
          maDon: data.maDon,
          cart: [...cart],
          phanTram: pct,
          tong: tongTienHang,
          tienSauGiam,
          tienKhach: tienKhachNum,
        });
        // Reset giỏ
        setCart([]); setDiscountPct('0'); setTienKhach('');
        // Hỏi in hóa đơn
        setShowConfirmPrint(true);
      } else {
        showToast('Lỗi: ' + data.message, 'error');
      }
    } catch {
      showToast('Lỗi kết nối server!', 'error');
    } finally {
      setPaying(false);
    }
  };

  // ─── RENDER SEARCH ITEM ──────────────────────────────────────────────────────
  const renderSearchItem = ({ item }: { item: SanPham }) => {
    const hetHang = item.SoLuong <= 0;
    return (
      <TouchableOpacity
        style={[styles.searchItem, hetHang && { opacity: 0.5 }]}
        onPress={() => !hetHang && addToCart(item)}
        activeOpacity={hetHang ? 1 : 0.7}
      >
        <View style={styles.spImgPlaceholder}>
          <Text style={{ fontSize: 20 }}>📦</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.spTen} numberOfLines={2}>{item.TenSanPham}</Text>
          {!!item.MaVach && <Text style={styles.spMavach}>{item.MaVach}</Text>}
          <Text style={[styles.spTon, hetHang && { color: C.danger }]}>
            {hetHang ? '❌ Hết hàng' : `Tồn: ${item.SoLuong}`}
          </Text>
        </View>
        <Text style={[styles.spGia, hetHang && { color: C.gray }]}>
          {item.GiaBan.toLocaleString('vi-VN')}₫
        </Text>
      </TouchableOpacity>
    );
  };

  // ─── RENDER CART ITEM ────────────────────────────────────────────────────────
  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => (
    <View style={styles.cartItem}>
      <Text style={styles.cartIndex}>{index + 1}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName} numberOfLines={2}>{item.TenSanPham}</Text>
        <Text style={styles.itemPrice}>{fmt(item.GiaBan)}</Text>
      </View>
      <View style={styles.qtyControl}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(index, -1)}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.SoLuongCart}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(index, 1)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.thanhTien}>{fmt(item.GiaBan * item.SoLuongCart)}</Text>
      <TouchableOpacity onPress={() => removeItem(index)} style={{ paddingLeft: 8 }}>
        <Text style={{ fontSize: 18, color: C.danger }}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── RECEIPT CONTENT ────────────────────────────────────────────────────────
  const ReceiptContent = ({ data }: { data: PendingReceipt | null }) => {
    const items = data ? data.cart : cart;
    const maDon = data?.maDon ?? 'TẠM TÍNH';
    const _pct = data?.phanTram ?? pct;
    const _tong = data?.tong ?? tongTienHang;
    const _sau = data?.tienSauGiam ?? tienSauGiam;
    const _khach = data?.tienKhach ?? tienKhachNum;
    const _thua = Math.max(0, _khach - _sau);
    const now = new Date();

    return (
      <View style={styles.receiptBox}>
        <Text style={styles.receiptShop}>🏪 CỬA HÀNG TẠP HÓA</Text>
        <Text style={styles.receiptAddr}>Địa chỉ: ___________________</Text>
        <Text style={styles.receiptAddr}>SĐT: 0xxx xxx xxx</Text>
        <View style={styles.receiptDivider} />
        <Text style={styles.receiptTitle}>HÓA ĐƠN BÁN HÀNG</Text>
        <Text style={styles.receiptMeta}>Mã đơn: {maDon}</Text>
        <Text style={styles.receiptMeta}>
          Ngày: {now.toLocaleDateString('vi-VN')}  Giờ: {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <View style={styles.receiptDivider} />

        {items.map((item, i) => (
          <View key={i}>
            <Text style={styles.receiptItemName} numberOfLines={2}>{item.TenSanPham}</Text>
            <View style={styles.receiptItemRow}>
              <Text style={styles.receiptItemSub}>{item.SoLuongCart} × {item.GiaBan.toLocaleString('vi-VN')}</Text>
              <Text style={styles.receiptItemSubBold}>{(item.SoLuongCart * item.GiaBan).toLocaleString('vi-VN')} ₫</Text>
            </View>
          </View>
        ))}

        <View style={styles.receiptDivider} />
        <View style={styles.receiptSumRow}>
          <Text>Tổng tiền hàng:</Text>
          <Text>{_tong.toLocaleString('vi-VN')} ₫</Text>
        </View>
        {_pct > 0 && (
          <View style={styles.receiptSumRow}>
            <Text>Giảm giá ({_pct}%):</Text>
            <Text>-{(_tong - _sau).toLocaleString('vi-VN')} ₫</Text>
          </View>
        )}
        <View style={[styles.receiptSumRow, styles.receiptSumBig]}>
          <Text style={{ fontWeight: '700' }}>Khách phải trả:</Text>
          <Text style={{ fontWeight: '700', color: C.blue }}>{_sau.toLocaleString('vi-VN')} ₫</Text>
        </View>
        {_khach > 0 && <>
          <View style={styles.receiptSumRow}>
            <Text>Tiền khách đưa:</Text>
            <Text>{_khach.toLocaleString('vi-VN')} ₫</Text>
          </View>
          <View style={styles.receiptSumRow}>
            <Text>Tiền thừa:</Text>
            <Text>{_thua.toLocaleString('vi-VN')} ₫</Text>
          </View>
        </>}
        <View style={styles.receiptDivider} />
        <Text style={styles.receiptFooter}>Cảm ơn quý khách đã mua hàng!</Text>
        <Text style={styles.receiptFooter}>Hẹn gặp lại 😊</Text>
      </View>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── TOPBAR ── */}
      <View style={styles.topbar}>
        <View style={styles.searchWrap}>
          <Text style={{ fontSize: 14, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm hàng hóa hoặc quét mã..."
            placeholderTextColor={C.muted}
            value={searchText}
            onChangeText={onSearchChange}
            returnKeyType="search"
          />
          {searching && <ActivityIndicator size="small" color={C.blue} style={{ marginLeft: 4 }} />}
          {!!searchText && (
            <TouchableOpacity onPress={() => { setSearchText(''); setShowDropdown(false); }}>
              <Text style={{ fontSize: 16, color: C.muted, paddingLeft: 6 }}>✕</Text>
            </TouchableOpacity>
          )}

          {/* Dropdown kết quả tìm kiếm */}
          {showDropdown && (
            <View style={styles.dropdown}>
              {searchResults.length === 0 ? (
                <View style={styles.dropdownEmpty}>
                  <Text style={{ color: C.muted, fontSize: 13 }}>🔍 Không tìm thấy sản phẩm</Text>
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={i => String(i.MaSanPham)}
                  renderItem={renderSearchItem}
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 320 }}
                />
              )}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.topIconBtn} onPress={resetCart}>
          <Text style={{ fontSize: 20, color: C.white }}>⟳</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={() => {
            if (cart.length === 0) { showToast('Chưa có sản phẩm!', 'error'); return; }
            setShowPrintPreview(true);
          }}
        >
          <Text style={{ fontSize: 20, color: C.white }}>🖨️</Text>
        </TouchableOpacity>
      </View>

      {/* ── TOAST ── */}
      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />

      {/* ── BODY: GIỎ HÀNG + THANH TOÁN ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={60}
      >
        {/* Tap ngoài để đóng dropdown */}
        {showDropdown && (
          <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        )}

        <ScrollView
          style={{ flex: 1, backgroundColor: C.bg }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* GIỎ HÀNG */}
          <View style={styles.cartSection}>
            {cart.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 56, marginBottom: 10 }}>🛒</Text>
                <Text style={styles.emptyText}>Chưa có sản phẩm nào trong đơn</Text>
                <Text style={styles.emptySubText}>Tìm và thêm sản phẩm vào đơn hàng</Text>
              </View>
            ) : (
              <>
                {/* Header giỏ hàng */}
                <View style={styles.cartHeader}>
                  <Text style={[styles.cartHeaderCell, { width: 24 }]}>#</Text>
                  <Text style={[styles.cartHeaderCell, { flex: 1 }]}>Sản phẩm</Text>
                  <Text style={[styles.cartHeaderCell, { width: 90, textAlign: 'center' }]}>SL</Text>
                  <Text style={[styles.cartHeaderCell, { width: 100, textAlign: 'right' }]}>Thành tiền</Text>
                  <View style={{ width: 34 }} />
                </View>
                {cart.map((item, index) => (
                  <View key={index}>
                    {renderCartItem({ item, index })}
                  </View>
                ))}
                <View style={styles.cartSummaryBar}>
                  <Text style={styles.cartSummaryText}>
                    {cart.reduce((s, x) => s + x.SoLuongCart, 0)} sản phẩm
                  </Text>
                  <Text style={styles.cartSummaryTotal}>{fmt(tongTienHang)}</Text>
                </View>
              </>
            )}
          </View>

          {/* THANH TOÁN */}
          <View style={styles.paySection}>
            <Text style={styles.paySectionTitle}>💰 Thanh toán</Text>

            {/* Tổng tiền hàng */}
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Tổng tiền hàng</Text>
              <Text style={styles.payValue}>{fmt(tongTienHang)}</Text>
            </View>

            {/* Giảm giá */}
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Giảm giá (%)</Text>
              <TextInput
                style={styles.payInput}
                keyboardType="numeric"
                value={discountPct}
                onChangeText={setDiscountPct}
                placeholder="0"
                placeholderTextColor={C.muted}
              />
            </View>

            {/* Khách cần trả */}
            <View style={[styles.payRow, styles.payRowTotal]}>
              <Text style={styles.payLabelTotal}>Khách cần trả</Text>
              <Text style={styles.payValueTotal}>{fmt(tienSauGiam)}</Text>
            </View>

            {/* Tiền khách đưa */}
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Tiền khách đưa</Text>
              <TextInput
                style={[styles.payInput, { width: 160 }]}
                keyboardType="numeric"
                value={tienKhach}
                onChangeText={setTienKhach}
                placeholder="Nhập số tiền..."
                placeholderTextColor={C.muted}
              />
            </View>

            {/* Tiền thừa */}
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Tiền thừa trả khách</Text>
              <Text
                style={[
                  styles.payValue,
                  { color: tienThua >= 0 ? C.success : C.danger, fontWeight: '700' },
                ]}
              >
                {tienKhachNum > 0 ? fmt(Math.max(0, tienThua)) : '—'}
              </Text>
            </View>

            {/* Nút thanh toán */}
            <TouchableOpacity
              style={[styles.checkoutBtn, (paying || cart.length === 0) && styles.checkoutBtnDisabled]}
              onPress={thanhToan}
              disabled={paying || cart.length === 0}
              activeOpacity={0.85}
            >
              {paying ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <Text style={styles.checkoutText}>THANH TOÁN</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ══════════════════════════════════════════
          MODAL: HỎI CÓ IN KHÔNG
      ══════════════════════════════════════════ */}
      <Modal visible={showConfirmPrint} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIcon}>
              <Text style={{ fontSize: 30 }}>🖨️</Text>
            </View>
            <Text style={styles.confirmTitle}>Thanh toán thành công! 🎉</Text>
            <Text style={styles.confirmSub}>
              Mã đơn: <Text style={{ fontWeight: '700' }}>{pendingReceipt?.maDon}</Text>{'\n'}
              Bạn có muốn in hóa đơn không?
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmNo}
                onPress={() => {
                  setShowConfirmPrint(false);
                  setShowSuccess(true);
                }}
              >
                <Text style={styles.confirmNoText}>✕  Không in</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmYes}
                onPress={() => {
                  setShowConfirmPrint(false);
                  setShowPrintPreview(true);
                }}
              >
                <Text style={styles.confirmYesText}>🖨️  In hóa đơn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════
          MODAL: THÀNH CÔNG (không in)
      ══════════════════════════════════════════ */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <Text style={{ fontSize: 34 }}>✅</Text>
            </View>
            <Text style={styles.successTitle}>Hoàn thành đơn hàng!</Text>
            <Text style={styles.successSub}>
              Mã đơn <Text style={{ fontWeight: '700' }}>{pendingReceipt?.maDon}</Text> đã lưu thành công.{'\n'}
              Cảm ơn quý khách! 😊
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => { setShowSuccess(false); setPendingReceipt(null); }}
            >
              <Text style={styles.successBtnText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════
          MODAL: XEM TRƯỚC & IN HÓA ĐƠN
      ══════════════════════════════════════════ */}
      <Modal visible={showPrintPreview} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.printBox}>
            {/* Header */}
            <View style={styles.printHeader}>
              <Text style={styles.printHeaderTitle}>🖨️ Xem trước hóa đơn</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPrintPreview(false);
                  if (pendingReceipt) setPendingReceipt(null);
                }}
              >
                <Text style={{ fontSize: 22, color: C.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Receipt content */}
            <ScrollView style={styles.printBody} showsVerticalScrollIndicator={false}>
              <ReceiptContent data={pendingReceipt} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.printFooter}>
              <TouchableOpacity
                style={styles.printCancelBtn}
                onPress={() => {
                  setShowPrintPreview(false);
                  if (pendingReceipt) setPendingReceipt(null);
                }}
              >
                <Text style={styles.printCancelText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.printConfirmBtn}
                onPress={() => {
                  // Ở React Native: tích hợp thư viện in thực tế như
                  // react-native-print hoặc expo-print tại đây
                  Alert.alert('✅', 'Đã gửi lệnh in hóa đơn!');
                  setShowPrintPreview(false);
                  setPendingReceipt(null);
                }}
              >
                <Text style={styles.printConfirmText}>🖨️  In hóa đơn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Topbar
  topbar: {
    height: 56,
    backgroundColor: C.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
    zIndex: 100,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    position: 'relative',
    zIndex: 101,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: C.text, paddingVertical: 0 },
  topIconBtn: {
    width: 40, height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  // Dropdown
  dropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 200,
    overflow: 'hidden',
  },
  dropdownEmpty: { padding: 20, alignItems: 'center' },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  spImgPlaceholder: {
    width: 48, height: 48,
    borderRadius: 8,
    backgroundColor: '#f8f9fb',
    borderWidth: 1, borderColor: '#eee',
    alignItems: 'center', justifyContent: 'center',
  },
  spTen: { fontSize: 13.5, fontWeight: '600', color: C.text },
  spMavach: { fontSize: 11.5, color: C.muted, marginTop: 1 },
  spTon: { fontSize: 12, color: C.muted, marginTop: 1 },
  spGia: { fontSize: 14, fontWeight: '700', color: C.blue },

  // Toast
  toast: {
    position: 'absolute',
    top: 64, left: 20, right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 8,
    zIndex: 999,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  toastText: { color: C.white, fontSize: 13, fontWeight: '500', flex: 1 },

  // Cart section
  cartSection: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    minHeight: 180,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: C.muted, marginBottom: 4 },
  emptySubText: { fontSize: 12.5, color: C.gray },

  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  cartHeaderCell: { fontSize: 12.5, color: C.muted, fontWeight: '600' },

  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    gap: 8,
  },
  cartIndex: { width: 24, fontSize: 12.5, color: C.muted, fontWeight: '600' },
  itemName: { fontSize: 13.5, fontWeight: '500', color: C.text },
  itemPrice: { fontSize: 12, color: C.muted, marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: {
    width: 28, height: 28,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.white,
  },
  qtyBtnText: { fontSize: 16, color: C.text, lineHeight: 20 },
  qtyText: { fontSize: 14, fontWeight: '700', width: 28, textAlign: 'center' },
  thanhTien: { width: 100, textAlign: 'right', fontWeight: '700', fontSize: 13, color: C.blue },

  cartSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f9fb',
    borderTopWidth: 1, borderTopColor: C.border,
  },
  cartSummaryText: { fontSize: 13, color: C.muted },
  cartSummaryTotal: { fontSize: 14, fontWeight: '700', color: C.blue },

  // Payment section
  paySection: {
    margin: 12,
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 14,
    gap: 2,
  },
  paySectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: C.text },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  payRowTotal: { backgroundColor: '#f0f7ff', marginHorizontal: -14, paddingHorizontal: 14, borderBottomWidth: 0 },
  payLabel: { fontSize: 13.5, color: C.text },
  payLabelTotal: { fontSize: 15, fontWeight: '700', color: C.blue },
  payValue: { fontSize: 13.5, fontWeight: '600', color: C.text },
  payValueTotal: { fontSize: 18, fontWeight: '800', color: C.blue },
  payInput: {
    width: 100,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 7,
    paddingHorizontal: 10, paddingVertical: 6,
    fontSize: 13.5, textAlign: 'right', color: C.text,
    backgroundColor: '#fafafa',
  },

  checkoutBtn: {
    backgroundColor: C.blue,
    height: 52,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 14,
  },
  checkoutBtnDisabled: { backgroundColor: C.gray },
  checkoutText: { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Confirm print modal
  confirmBox: {
    backgroundColor: C.white,
    borderRadius: 18,
    width: SW * 0.86,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  confirmIcon: {
    width: 70, height: 70,
    backgroundColor: C.blueLight,
    borderRadius: 35,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 28, marginBottom: 14,
  },
  confirmTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center', color: C.text, paddingHorizontal: 20 },
  confirmSub: { fontSize: 13.5, color: C.muted, textAlign: 'center', lineHeight: 20, padding: 16, paddingTop: 8 },
  confirmActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  confirmNo: {
    flex: 1, height: 52, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f9fafb', borderRightWidth: 1, borderRightColor: '#f3f4f6',
  },
  confirmNoText: { fontSize: 14, fontWeight: '600', color: C.text },
  confirmYes: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue },
  confirmYesText: { fontSize: 14, fontWeight: '700', color: C.white },

  // Success modal
  successBox: {
    backgroundColor: C.white,
    borderRadius: 18,
    width: SW * 0.8,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
    alignItems: 'center',
  },
  successIcon: {
    width: 76, height: 76,
    backgroundColor: '#dcfce7',
    borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 28, marginBottom: 14,
  },
  successTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
  successSub: { fontSize: 13.5, color: C.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20, paddingBottom: 24 },
  successBtn: { width: '100%', height: 50, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' },
  successBtnText: { color: C.white, fontSize: 15, fontWeight: '700' },

  // Print modal
  printBox: {
    backgroundColor: C.white,
    borderRadius: 18,
    width: SW * 0.92,
    maxHeight: SH * 0.88,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  printHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  printHeaderTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  printBody: { flex: 1, padding: 12 },
  printFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  printCancelBtn: {
    flex: 1, height: 44,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  printCancelText: { fontSize: 14, color: C.text },
  printConfirmBtn: {
    flex: 1, height: 44,
    backgroundColor: C.blue,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  printConfirmText: { fontSize: 14, fontWeight: '700', color: C.white },

  // Receipt
  receiptBox: {
    backgroundColor: '#fafafa',
    borderWidth: 1, borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 14,
  },
  receiptShop: { textAlign: 'center', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  receiptAddr: { textAlign: 'center', fontSize: 11.5, color: C.muted, lineHeight: 18 },
  receiptDivider: { borderTopWidth: 1, borderTopColor: '#ccc', borderStyle: 'dashed', marginVertical: 8 },
  receiptTitle: { textAlign: 'center', fontSize: 14, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  receiptMeta: { fontSize: 11.5, color: '#444', marginBottom: 2 },
  receiptItemName: { fontSize: 12.5, fontWeight: '600', marginBottom: 1 },
  receiptItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, paddingLeft: 8 },
  receiptItemSub: { fontSize: 12, color: '#555' },
  receiptItemSubBold: { fontSize: 12, fontWeight: '700' },
  receiptSumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  receiptSumBig: {
    borderTopWidth: 1, borderTopColor: '#aaa',
    marginTop: 4, paddingTop: 6, marginBottom: 2,
  },
  receiptFooter: { textAlign: 'center', fontSize: 11.5, color: C.muted, marginTop: 2 },
});