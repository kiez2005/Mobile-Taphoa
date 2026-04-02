// app/(tabs)/banhang.tsx
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');

const C = {
  blue: '#1565c0',
  blueDark: '#0d47a1',
  border: '#e4e7ec',
  bg: '#eef0f3',
  white: '#ffffff',
  text: '#1a1a2e',
  muted: '#6b7280',
  success: '#166534',
  danger: '#ef4444',
};

export default function BanHangScreen() {
  const [searchText, setSearchText] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [tienKhachDua, setTienKhachDua] = useState('');
  const [currentMaDon, setCurrentMaDon] = useState('');

  const mockProducts = [
    { MaSanPham: 1, TenSanPham: 'Mì Hảo Hảo tôm chua cay', GiaBan: 12000, SoLuongTon: 450 },
    { MaSanPham: 2, TenSanPham: 'Nước ngọt Pepsi 330ml', GiaBan: 15000, SoLuongTon: 320 },
    { MaSanPham: 3, TenSanPham: 'Dầu ăn Neptune 1L', GiaBan: 42000, SoLuongTon: 180 },
    { MaSanPham: 4, TenSanPham: 'Sữa tươi Vinamilk 1L', GiaBan: 28000, SoLuongTon: 95 },
  ];

  const addToCart = (sp: any) => {
    setSearchText('');
    const existingIndex = cart.findIndex(item => item.MaSanPham === sp.MaSanPham);
    
    if (existingIndex !== -1) {
      const newCart = [...cart];
      if (newCart[existingIndex].SoLuong < sp.SoLuongTon) {
        newCart[existingIndex].SoLuong += 1;
      }
      setCart(newCart);
    } else {
      setCart([...cart, { ...sp, SoLuong: 1 }]);
    }
  };

  const changeQty = (index: number, delta: number) => {
    const newCart = [...cart];
    const newQty = newCart[index].SoLuong + delta;
    if (newQty < 1) newCart.splice(index, 1);
    else if (newQty <= newCart[index].SoLuongTon) newCart[index].SoLuong = newQty;
    setCart(newCart);
  };

  const removeItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const resetCart = () => {
    if (cart.length === 0 || confirm('Hủy đơn hàng hiện tại?')) {
      setCart([]);
      setDiscountPercent(0);
      setTienKhachDua('');
    }
  };

  const tongTienHang = cart.reduce((sum, item) => sum + item.GiaBan * item.SoLuong, 0);
  const tienGiam = tongTienHang * (discountPercent / 100);
  const tienCanTra = tongTienHang - tienGiam;
  const tienThua = parseFloat(tienKhachDua || '0') - tienCanTra;

  const thanhToan = () => {
    if (cart.length === 0) return alert('Chưa có sản phẩm trong giỏ hàng!');
    if (parseFloat(tienKhachDua || '0') < tienCanTra) return alert('Số tiền khách đưa chưa đủ!');

    const maDon = 'HD' + Date.now().toString().slice(-6);
    setCurrentMaDon(maDon);
    setShowReceiptModal(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topbar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm sản phẩm hoặc quét mã (F3)"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.scanBtn}>
            <Text style={{ fontSize: 20 }}>📸</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={resetCart} style={styles.iconBtn}>
          <Text style={{ fontSize: 22 }}>⟳</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowReceiptModal(true)} style={styles.iconBtn}>
          <Text style={{ fontSize: 22 }}>🖨️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        {/* Giỏ hàng */}
        <View style={styles.cartSection}>
          {cart.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 60, marginBottom: 12 }}>🛒</Text>
              <Text style={{ fontSize: 16, color: C.muted }}>Chưa có sản phẩm nào</Text>
              <Text style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Tìm và thêm sản phẩm vào đơn</Text>
            </View>
          ) : (
            <ScrollView>
              {cart.map((item, index) => (
                <View key={index} style={styles.cartItem}>
                  <Text style={styles.itemIndex}>{index + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.TenSanPham}</Text>
                    <Text style={styles.itemPrice}>{item.GiaBan.toLocaleString('vi-VN')} ₫</Text>
                  </View>

                  <View style={styles.qtyControl}>
                    <TouchableOpacity onPress={() => changeQty(index, -1)} style={styles.qtyBtn}><Text>-</Text></TouchableOpacity>
                    <Text style={styles.qtyText}>{item.SoLuong}</Text>
                    <TouchableOpacity onPress={() => changeQty(index, 1)} style={styles.qtyBtn}><Text>+</Text></TouchableOpacity>
                  </View>

                  <Text style={styles.thanhTien}>
                    {(item.GiaBan * item.SoLuong).toLocaleString('vi-VN')} ₫
                  </Text>

                  <TouchableOpacity onPress={() => removeItem(index)} style={styles.delBtn}>
                    <Text style={{ color: C.danger }}>🗑</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Thanh toán */}
        <View style={styles.paymentSection}>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text>Tổng tiền hàng</Text>
              <Text>{tongTienHang.toLocaleString('vi-VN')} ₫</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Giảm giá (%)</Text>
              <TextInput
                style={styles.discountInput}
                keyboardType="numeric"
                value={discountPercent.toString()}
                onChangeText={(v) => setDiscountPercent(parseFloat(v) || 0)}
              />
            </View>
            <View style={styles.summaryRow}>
              <Text>Khách cần trả</Text>
              <Text style={styles.totalText}>
                {tienCanTra.toLocaleString('vi-VN')} ₫
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Tiền khách đưa</Text>
              <TextInput
                style={styles.paymentInput}
                keyboardType="numeric"
                value={tienKhachDua}
                onChangeText={setTienKhachDua}
                placeholder="0"
              />
            </View>
            <View style={styles.summaryRow}>
              <Text>Tiền thừa</Text>
              <Text style={{ color: tienThua >= 0 ? C.success : C.danger, fontWeight: '600' }}>
                {tienThua >= 0 ? tienThua.toLocaleString('vi-VN') : '—'} ₫
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.checkoutBtn} onPress={thanhToan}>
            <Text style={styles.checkoutText}>THANH TOÁN</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal In Hóa Đơn */}
      <Modal visible={showReceiptModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModal}>
            <Text style={styles.modalTitle}>Hóa đơn bán hàng</Text>
            <Text style={{ color: C.muted, marginBottom: 12 }}>Mã đơn: {currentMaDon || 'TẠM TÍNH'}</Text>

            <View style={styles.receiptContent}>
              {cart.map((item, i) => (
                <Text key={i} style={styles.receiptItem}>
                  {item.SoLuong} x {item.TenSanPham} — {(item.GiaBan * item.SoLuong).toLocaleString('vi-VN')} ₫
                </Text>
              ))}
              <Text style={styles.receiptTotal}>
                Tổng cộng: {tienCanTra.toLocaleString('vi-VN')} ₫
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReceiptModal(false)}>
                <Text>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.printBtn} onPress={() => {
                alert('✅ Đã in hóa đơn thành công!');
                setShowReceiptModal(false);
                setCart([]);
              }}>
                <Text style={{ color: 'white', fontWeight: '600' }}>In Hóa Đơn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  topbar: {
    height: 56,
    backgroundColor: C.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 14 },
  scanBtn: { marginLeft: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  main: { flex: 1, flexDirection: 'row' },
  cartSection: { flex: 1, padding: 12 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemIndex: { width: 24, fontWeight: '600', color: C.muted },
  itemName: { fontSize: 14, fontWeight: '500', flex: 1 },
  itemPrice: { fontSize: 13, color: C.muted },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 28, height: 28, borderWidth: 1, borderColor: C.border, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 15, fontWeight: '600', width: 30, textAlign: 'center' },
  thanhTien: { fontWeight: '600', width: 90, textAlign: 'right' },
  delBtn: { marginLeft: 10 },

  paymentSection: { width: 380, backgroundColor: C.white, borderLeftWidth: 1, borderColor: C.border, padding: 14 },
  summary: { marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  totalText: { fontSize: 17, fontWeight: '700', color: C.blue },
  discountInput: { width: 70, borderWidth: 1, borderColor: C.border, borderRadius: 6, textAlign: 'center', padding: 4 },
  paymentInput: { width: 140, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 8 },

  checkoutBtn: {
    backgroundColor: C.blue,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutText: { color: 'white', fontSize: 16, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  receiptModal: { backgroundColor: 'white', width: '90%', borderRadius: 14, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  receiptContent: { marginVertical: 12, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 },
  receiptItem: { marginVertical: 3 },
  receiptTotal: { marginTop: 12, fontSize: 16, fontWeight: '700', color: C.blue },
  modalFooter: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center' },
  printBtn: { flex: 1, padding: 14, backgroundColor: C.blue, borderRadius: 8, alignItems: 'center' },
});