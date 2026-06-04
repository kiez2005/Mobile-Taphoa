import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import axios from 'axios';

const BASE = 'http://taphoacuakien.runasp.net';

type NhaCungCap = { MaNhaCungCap: number; TenNhaCungCap: string };
type NguoiDung  = { MaNguoiDung: number; HoTen: string };

// ✅ Thêm giaNhap vào type — controller trả về field này
type SanPham = { id: number; name: string; giaNhap: number };

type DongSanPham = {
    id: string;
    MaSanPham: number;
    TenSanPham: string;
    SoLuong: string;
    GiaNhap: string;
};

export default function AddPhieuNhapScreen() {
    const [nccList, setNccList]             = useState<NhaCungCap[]>([]);
    const [nguoiDungList, setNguoiDungList] = useState<NguoiDung[]>([]);
    const [sanPhamList, setSanPhamList]     = useState<SanPham[]>([]);

    const [selectedNCC, setSelectedNCC]     = useState<NhaCungCap | null>(null);
    const [selectedND, setSelectedND]       = useState<NguoiDung | null>(null);

    const [showNCC, setShowNCC]             = useState(false);
    const [showND, setShowND]               = useState(false);

    const [dongs, setDongs]                 = useState<DongSanPham[]>([]);
    const [loading, setLoading]             = useState(false);
    const [loadingNCC, setLoadingNCC]       = useState(false);

    useEffect(() => {
        fetchNCC();
        fetchNguoiDung();
    }, []);

    // ── Fetch nhà cung cấp ──────────────────────────────────
    const fetchNCC = async () => {
        try {
            const res = await axios.get(`${BASE}/HangHoa/GetNhaCungCap`);
            setNccList(res.data?.data || []);
        } catch {
            Alert.alert('Lỗi', 'Không tải được danh sách nhà cung cấp');
        }
    };

    // ── Fetch người dùng ────────────────────────────────────
    const fetchNguoiDung = async () => {
        try {
            const res = await axios.get(`${BASE}/PhieuNhap/GetNguoiDung`);
            // Controller trả về mảng trực tiếp (không bọc trong .data)
            setNguoiDungList(Array.isArray(res.data) ? res.data : []);
        } catch {
            Alert.alert('Lỗi', 'Không tải được danh sách người dùng');
        }
    };

    // ── Fetch sản phẩm theo NCC ─────────────────────────────
    // ✅ Dùng params thay vì query string thủ công
    // Controller: GetSanPhamByNCC(int id) → trả về { id, name, giaNhap }
    const fetchSanPhamByNCC = async (maNCC: number) => {
        setLoadingNCC(true);
        try {
            const res = await axios.get(`${BASE}/PhieuNhap/GetSanPhamByNCC`, {
                params: { id: maNCC },
            });
            const list = Array.isArray(res.data) ? res.data : [];
            setSanPhamList(list);
            if (list.length === 0) {
                Alert.alert('Thông báo', 'Nhà cung cấp này chưa có sản phẩm nào');
            }
        } catch (e: any) {
            setSanPhamList([]);
            const status = e?.response?.status;
            Alert.alert('Lỗi', status === 404
                ? 'Không tìm thấy API GetSanPhamByNCC (404). Kiểm tra lại route controller.'
                : 'Không tải được sản phẩm của nhà cung cấp'
            );
        } finally {
            setLoadingNCC(false);
        }
    };

    // ── Chọn NCC ────────────────────────────────────────────
    const chonNCC = (ncc: NhaCungCap) => {
        setSelectedNCC(ncc);
        setShowNCC(false);
        setDongs([]);          // reset danh sách dòng khi đổi NCC
        setSanPhamList([]);
        fetchSanPhamByNCC(ncc.MaNhaCungCap);
    };

    // ── Chọn người dùng ─────────────────────────────────────
    const chonND = (nd: NguoiDung) => {
        setSelectedND(nd);
        setShowND(false);
    };

    // ── Thêm dòng sản phẩm ──────────────────────────────────
    const themDong = () => {
        if (!selectedNCC) {
            Alert.alert('Lỗi', 'Vui lòng chọn nhà cung cấp trước');
            return;
        }
        if (sanPhamList.length === 0) {
            Alert.alert('Lỗi', 'Nhà cung cấp này chưa có sản phẩm nào');
            return;
        }
        const newDong: DongSanPham = {
            id: Date.now().toString(),
            MaSanPham: 0,
            TenSanPham: '',
            SoLuong: '1',
            GiaNhap: '0',
        };
        setDongs(prev => [...prev, newDong]);
    };

    // ── Xóa dòng ────────────────────────────────────────────
    const xoaDong = (id: string) => {
        setDongs(prev => prev.filter(d => d.id !== id));
    };

    // ── Chọn sản phẩm cho 1 dòng ────────────────────────────
    // ✅ Lấy giaNhap thẳng từ sanPhamList — KHÔNG gọi API riêng
    const chonSanPham = (dongId: string, sp: SanPham) => {
        // Kiểm tra trùng sản phẩm trong các dòng khác
        const trung = dongs.find(d => d.id !== dongId && d.MaSanPham === sp.id);
        if (trung) {
            Alert.alert('Trùng sản phẩm', `"${sp.name}" đã có trong danh sách rồi`);
            return;
        }
        setDongs(prev =>
            prev.map(d =>
                d.id === dongId
                    ? { ...d, MaSanPham: sp.id, TenSanPham: sp.name, GiaNhap: String(sp.giaNhap ?? 0) }
                    : d
            )
        );
    };

    // ── Cập nhật số lượng / giá nhập ────────────────────────
    const updateDong = (id: string, field: 'SoLuong' | 'GiaNhap', val: string) => {
        // Chỉ cho nhập số
        if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;
        setDongs(prev =>
            prev.map(d => (d.id === id ? { ...d, [field]: val } : d))
        );
    };

    // ── Tổng tiền ────────────────────────────────────────────
    const tongTien = dongs.reduce((sum, d) => {
        return sum + (Number(d.SoLuong) || 0) * (Number(d.GiaNhap) || 0);
    }, 0);

    // ── Lưu phiếu nhập ──────────────────────────────────────
    const handleLuu = async () => {
        if (!selectedNCC) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn nhà cung cấp');
        if (!selectedND)  return Alert.alert('Thiếu thông tin', 'Vui lòng chọn người dùng');
        if (dongs.length === 0) return Alert.alert('Thiếu thông tin', 'Vui lòng thêm ít nhất 1 sản phẩm');
        if (dongs.some(d => d.MaSanPham === 0))
            return Alert.alert('Thiếu thông tin', 'Vui lòng chọn sản phẩm cho tất cả các dòng');
        if (dongs.some(d => Number(d.SoLuong) <= 0))
            return Alert.alert('Thiếu thông tin', 'Số lượng phải lớn hơn 0');

        // Build application/x-www-form-urlencoded đúng cách
        const bodyParts: string[] = [
            `MaNhaCungCap=${selectedNCC.MaNhaCungCap}`,
            `MaNguoiDung=${selectedND.MaNguoiDung}`,
        ];
        dongs.forEach(dong => {
            bodyParts.push(`SanPhamId=${dong.MaSanPham}`);
            bodyParts.push(`SoLuong=${Number(dong.SoLuong) || 1}`);
            bodyParts.push(`GiaNhap=${Number(dong.GiaNhap) || 0}`);
        });
        const body = bodyParts.join('&');

        try {
            setLoading(true);
            const res = await axios.post(`${BASE}/PhieuNhap/Create`, body, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (res.data.success) {
                Alert.alert('Thành công', 'Thêm phiếu nhập thành công!', [
                    { text: 'OK', onPress: () => router.replace('/phieunhap') },
                ]);
            } else {
                Alert.alert('Lỗi từ server', res.data.message || 'Thất bại');
            }
        } catch (e: any) {
            console.error('handleLuu error:', e);
            if (e.response) {
                Alert.alert('Lỗi server', `Status ${e.response.status}: ${JSON.stringify(e.response.data)}`);
            } else {
                Alert.alert('Lỗi', 'Không thể kết nối đến server');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── RENDER ───────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

                {/* Title */}
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Quay lại</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Tạo Phiếu Nhập</Text>
                </View>

                {/* ── Nhà cung cấp ── */}
                <Text style={styles.label}>Nhà cung cấp <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                    style={styles.select}
                    onPress={() => { setShowNCC(!showNCC); setShowND(false); }}
                >
                    <Text style={{ color: selectedNCC ? '#000' : '#888', flex: 1 }}>
                        {selectedNCC ? selectedNCC.TenNhaCungCap : 'Chọn nhà cung cấp...'}
                    </Text>
                    <Text style={styles.chevron}>{showNCC ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {showNCC && (
                    <View style={styles.dropdown}>
                        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            {nccList.length === 0
                                ? <Text style={styles.dropdownEmpty}>Không có dữ liệu</Text>
                                : nccList.map(ncc => (
                                    <TouchableOpacity
                                        key={ncc.MaNhaCungCap}
                                        style={styles.dropdownItem}
                                        onPress={() => chonNCC(ncc)}
                                    >
                                        <Text>{ncc.TenNhaCungCap}</Text>
                                    </TouchableOpacity>
                                ))
                            }
                        </ScrollView>
                    </View>
                )}

                {/* ── Người dùng ── */}
                <Text style={styles.label}>Người dùng <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                    style={styles.select}
                    onPress={() => { setShowND(!showND); setShowNCC(false); }}
                >
                    <Text style={{ color: selectedND ? '#000' : '#888', flex: 1 }}>
                        {selectedND ? selectedND.HoTen : 'Chọn người dùng...'}
                    </Text>
                    <Text style={styles.chevron}>{showND ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {showND && (
                    <View style={styles.dropdown}>
                        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            {nguoiDungList.length === 0
                                ? <Text style={styles.dropdownEmpty}>Không có dữ liệu</Text>
                                : nguoiDungList.map(nd => (
                                    <TouchableOpacity
                                        key={nd.MaNguoiDung}
                                        style={styles.dropdownItem}
                                        onPress={() => chonND(nd)}
                                    >
                                        <Text>{nd.HoTen}</Text>
                                    </TouchableOpacity>
                                ))
                            }
                        </ScrollView>
                    </View>
                )}

                {/* ── Danh sách sản phẩm ── */}
                <View style={styles.spHeader}>
                    <Text style={styles.label}>Sản phẩm</Text>
                    <TouchableOpacity
                        style={[styles.addBtn, (!selectedNCC || loadingNCC) && styles.addBtnDisabled]}
                        onPress={themDong}
                        disabled={!selectedNCC || loadingNCC}
                    >
                        {loadingNCC
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.addBtnText}>＋ Thêm dòng</Text>
                        }
                    </TouchableOpacity>
                </View>

                {dongs.length === 0 && (
                    <Text style={styles.emptyText}>
                        {selectedNCC
                            ? 'Nhấn "Thêm dòng" để thêm sản phẩm'
                            : 'Chọn nhà cung cấp trước rồi thêm sản phẩm'}
                    </Text>
                )}

                {dongs.map((dong, index) => (
                    <View key={dong.id} style={styles.dongCard}>
                        {/* Header dòng */}
                        <View style={styles.dongHeader}>
                            <Text style={styles.dongIndex}>Dòng {index + 1}</Text>
                            <TouchableOpacity onPress={() => xoaDong(dong.id)}>
                                <Text style={styles.xoaText}>✕ Xóa</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Chọn sản phẩm */}
                        <Text style={styles.smallLabel}>Sản phẩm</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.spScroll}
                        >
                            {sanPhamList.map(sp => (
                                <TouchableOpacity
                                    key={sp.id}
                                    style={[
                                        styles.spChip,
                                        dong.MaSanPham === sp.id && styles.spChipSelected,
                                    ]}
                                    onPress={() => chonSanPham(dong.id, sp)}
                                >
                                    <Text style={{
                                        color: dong.MaSanPham === sp.id ? '#fff' : '#1976d2',
                                        fontSize: 13,
                                        fontWeight: '600',
                                    }}>
                                        {sp.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {dong.MaSanPham !== 0 && (
                            <Text style={styles.spSelected}>✓ {dong.TenSanPham}</Text>
                        )}

                        {/* Số lượng + Giá nhập */}
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.smallLabel}>Số lượng</Text>
                                <TextInput
                                    style={styles.input}
                                    value={dong.SoLuong}
                                    onChangeText={v => updateDong(dong.id, 'SoLuong', v)}
                                    keyboardType="numeric"
                                    placeholder="1"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.smallLabel}>Giá nhập (đ)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={dong.GiaNhap}
                                    onChangeText={v => updateDong(dong.id, 'GiaNhap', v)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                        </View>

                        <Text style={styles.subtotal}>
                            Thành tiền:{' '}
                            {((Number(dong.SoLuong) || 0) * (Number(dong.GiaNhap) || 0))
                                .toLocaleString('vi-VN')} đ
                        </Text>
                    </View>
                ))}

                {/* Tổng tiền */}
                {dongs.length > 0 && (
                    <View style={styles.totalBox}>
                        <Text style={styles.totalLabel}>Tổng tiền phiếu nhập</Text>
                        <Text style={styles.totalValue}>
                            {tongTien.toLocaleString('vi-VN')} đ
                        </Text>
                    </View>
                )}

                {/* Nút lưu */}
                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                    onPress={handleLuu}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.saveBtnText}>💾 LƯU PHIẾU NHẬP</Text>
                    }
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f2f2f2' },
    container: { padding: 16, paddingBottom: 50 },

    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
    backText: { color: '#1976d2', fontWeight: '600', fontSize: 14 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#0d47a1' },

    label: { fontSize: 15, fontWeight: '600', marginTop: 14, marginBottom: 6, color: '#222' },
    required: { color: '#d32f2f' },
    smallLabel: { fontSize: 13, color: '#555', marginBottom: 6 },
    chevron: { fontSize: 12, color: '#666' },

    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#111',
    },
    select: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdown: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginTop: 4,
        maxHeight: 220,
        zIndex: 999,
        elevation: 5,
    },
    dropdownItem: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownEmpty: {
        padding: 14,
        color: '#888',
        textAlign: 'center',
        fontStyle: 'italic',
    },

    spHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 18,
        marginBottom: 4,
    },
    addBtn: {
        backgroundColor: '#1976d2',
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 8,
        minWidth: 110,
        alignItems: 'center',
    },
    addBtnDisabled: { backgroundColor: '#90caf9' },
    addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    emptyText: {
        color: '#888',
        textAlign: 'center',
        marginVertical: 20,
        fontStyle: 'italic',
        fontSize: 14,
    },

    dongCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
    },
    dongHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dongIndex: { fontWeight: '700', color: '#1976d2', fontSize: 15 },
    xoaText: { color: '#d32f2f', fontWeight: '600', fontSize: 14 },

    spScroll: { marginBottom: 8 },
    spChip: {
        borderWidth: 1.5,
        borderColor: '#1976d2',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        backgroundColor: '#fff',
    },
    spChipSelected: { backgroundColor: '#1976d2', borderColor: '#1976d2' },
    spSelected: {
        color: '#388e3c',
        fontWeight: '600',
        fontSize: 13,
        marginBottom: 8,
    },

    row: { flexDirection: 'row', marginTop: 8 },
    subtotal: {
        textAlign: 'right',
        marginTop: 12,
        fontWeight: '700',
        color: '#d32f2f',
        fontSize: 15,
    },

    totalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        padding: 18,
        borderRadius: 12,
        marginTop: 24,
        marginBottom: 10,
    },
    totalLabel: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
    totalValue: { fontSize: 20, fontWeight: 'bold', color: '#d32f2f' },

    saveBtn: {
        backgroundColor: '#0d47a1',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
        elevation: 3,
    },
    saveBtnDisabled: { backgroundColor: '#90caf9' },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
});