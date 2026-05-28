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

const BASE = 'http://172.20.10.5/cuahangtaphoa';

type NhaCungCap = { MaNhaCungCap: number; TenNhaCungCap: string };
type SanPham = { id: number; name: string };

type DongSanPham = {
    id: string;
    MaSanPham: number;
    TenSanPham: string;
    SoLuong: string;
    GiaNhap: string;
};

export default function AddPhieuNhapScreen() {
    const [nccList, setNccList] = useState<NhaCungCap[]>([]);
    const [sanPhamList, setSanPhamList] = useState<SanPham[]>([]);
    const [selectedNCC, setSelectedNCC] = useState<NhaCungCap | null>(null);
    const [showNCC, setShowNCC] = useState(false);
    const [maNguoiDung, setMaNguoiDung] = useState('1');
    const [dongs, setDongs] = useState<DongSanPham[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNCC();
    }, []);

    const fetchNCC = async () => {
        try {
            const res = await axios.get(`${BASE}/HangHoa/GetNhaCungCap`);
            setNccList(res.data?.data || []);
        } catch {
            Alert.alert('Lỗi', 'Không tải được danh sách nhà cung cấp');
        }
    };

    const fetchSanPhamByNCC = async (id: number) => {
        try {
            const res = await axios.get(`${BASE}/PhieuNhap/GetSanPhamByNCC?id=${id}`);
            setSanPhamList(res.data || []);
        } catch {
            setSanPhamList([]);
            Alert.alert('Lỗi', 'Không tải được sản phẩm của nhà cung cấp');
        }
    };

    const chonNCC = (ncc: NhaCungCap) => {
        setSelectedNCC(ncc);
        setShowNCC(false);
        setDongs([]);                    // Reset danh sách sản phẩm khi đổi NCC
        fetchSanPhamByNCC(ncc.MaNhaCungCap);
    };

    const themDong = () => {
        if (!selectedNCC) {
            Alert.alert('Lỗi', 'Vui lòng chọn nhà cung cấp trước');
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

    const xoaDong = (id: string) => {
        setDongs(prev => prev.filter(d => d.id !== id));
    };

    const chonSanPham = (dongId: string, sp: SanPham) => {
        setDongs(prev =>
            prev.map(d =>
                d.id === dongId
                    ? { ...d, MaSanPham: sp.id, TenSanPham: sp.name }
                    : d
            )
        );
        fetchGiaNhap(dongId, sp.id);
    };

    const fetchGiaNhap = async (dongId: string, spId: number) => {
        try {
            const res = await axios.get(`${BASE}/PhieuNhap/GetGiaNhap?id=${spId}`);
            setDongs(prev =>
                prev.map(d =>
                    d.id === dongId ? { ...d, GiaNhap: String(res.data || 0) } : d
                )
            );
        } catch (e) {
            console.error(e);
        }
    };

    const updateDong = (id: string, field: 'SoLuong' | 'GiaNhap', val: string) => {
        setDongs(prev =>
            prev.map(d => (d.id === id ? { ...d, [field]: val } : d))
        );
    };

    const tongTien = dongs.reduce((sum, d) => {
        return sum + (Number(d.SoLuong) || 0) * (Number(d.GiaNhap) || 0);
    }, 0);

    // ==================== LƯU PHIẾU NHẬP (ĐÃ SỬA) ====================
    const handleLuu = async () => {
    if (!selectedNCC) {
        Alert.alert('Thiếu thông tin', 'Vui lòng chọn nhà cung cấp');
        return;
    }
    if (dongs.length === 0) {
        Alert.alert('Thiếu thông tin', 'Vui lòng thêm ít nhất 1 sản phẩm');
        return;
    }
    if (dongs.some(d => d.MaSanPham === 0)) {
        Alert.alert('Thiếu thông tin', 'Vui lòng chọn sản phẩm cho tất cả các dòng');
        return;
    }

    const params = new URLSearchParams();
    params.append('MaNhaCungCap', String(selectedNCC.MaNhaCungCap));
    params.append('MaNguoiDung', maNguoiDung || '1');

    dongs.forEach((dong, index) => {
        params.append(`SanPhamId[${index}]`, String(dong.MaSanPham));
        params.append(`SoLuong[${index}]`, dong.SoLuong);
        params.append(`GiaNhap[${index}]`, dong.GiaNhap);
    });

    console.log("Payload gửi đi:", params.toString());

    try {
        setLoading(true);
        const res = await axios.post(`${BASE}/PhieuNhap/Create`, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log("Response từ server:", res.data);

        if (res.data.success) {
            Alert.alert('Thành công', 'Thêm phiếu nhập thành công!', [
                { 
                    text: 'OK', 
                    onPress: () => router.replace('/phieunhap')   // ← Sửa ở đây
                }
            ]);
        } else {
            Alert.alert('Lỗi từ server', res.data.message || 'Thất bại');
        }
    } catch (e: any) {
        console.error("Lỗi đầy đủ:", e);
        let errorMsg = 'Không thể kết nối đến server';
        if (e.response) {
            errorMsg = `Server trả lỗi: ${JSON.stringify(e.response.data)}`;
        } else if (e.request) {
            errorMsg = 'Không nhận được phản hồi từ server (kiểm tra IP server)';
        }
        Alert.alert('Lỗi', errorMsg);
    } finally {
        setLoading(false);
    }
};
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Tạo Phiếu Nhập Mới</Text>

                {/* Nhà cung cấp */}
                <Text style={styles.label}>Nhà cung cấp</Text>
                <TouchableOpacity style={styles.select} onPress={() => setShowNCC(!showNCC)}>
                    <Text style={{ color: selectedNCC ? '#000' : '#888', flex: 1 }}>
                        {selectedNCC ? selectedNCC.TenNhaCungCap : 'Chọn nhà cung cấp...'}
                    </Text>
                    <Text>▼</Text>
                </TouchableOpacity>

                {showNCC && (
                    <View style={styles.dropdown}>
                        {nccList.map(ncc => (
                            <TouchableOpacity
                                key={ncc.MaNhaCungCap}
                                style={styles.dropdownItem}
                                onPress={() => chonNCC(ncc)}
                            >
                                <Text>{ncc.TenNhaCungCap}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Mã người dùng */}
                <Text style={styles.label}>Mã người dùng</Text>
                <TextInput
                    style={styles.input}
                    value={maNguoiDung}
                    onChangeText={setMaNguoiDung}
                    keyboardType="numeric"
                />

                {/* Sản phẩm */}
                <View style={styles.spHeader}>
                    <Text style={styles.label}>Danh sách sản phẩm</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={themDong}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>＋ Thêm dòng</Text>
                    </TouchableOpacity>
                </View>

                {dongs.length === 0 && (
                    <Text style={styles.emptyText}>Chưa có sản phẩm nào. Hãy thêm dòng mới.</Text>
                )}

                {dongs.map((dong, index) => (
                    <View key={dong.id} style={styles.dongCard}>
                        <View style={styles.dongHeader}>
                            <Text style={styles.dongIndex}>Dòng {index + 1}</Text>
                            <TouchableOpacity onPress={() => xoaDong(dong.id)}>
                                <Text style={{ color: 'red', fontWeight: '600' }}>✕ Xóa</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.smallLabel}>Sản phẩm</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.spScroll}>
                            {sanPhamList.map(sp => (
                                <TouchableOpacity
                                    key={sp.id}
                                    style={[
                                        styles.spChip,
                                        dong.MaSanPham === sp.id && styles.spChipSelected
                                    ]}
                                    onPress={() => chonSanPham(dong.id, sp)}
                                >
                                    <Text style={{
                                        color: dong.MaSanPham === sp.id ? '#fff' : '#000',
                                        fontSize: 13
                                    }}>
                                        {sp.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.smallLabel}>Số lượng</Text>
                                <TextInput
                                    style={styles.input}
                                    value={dong.SoLuong}
                                    onChangeText={(v) => updateDong(dong.id, 'SoLuong', v)}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.smallLabel}>Giá nhập</Text>
                                <TextInput
                                    style={styles.input}
                                    value={dong.GiaNhap}
                                    onChangeText={(v) => updateDong(dong.id, 'GiaNhap', v)}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <Text style={styles.subtotal}>
                            Thành tiền: {((Number(dong.SoLuong) || 0) * (Number(dong.GiaNhap) || 0)).toLocaleString('vi-VN')} đ
                        </Text>
                    </View>
                ))}

                {/* Tổng tiền */}
                <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Tổng tiền phiếu nhập</Text>
                    <Text style={styles.totalValue}>
                        {tongTien.toLocaleString('vi-VN')} đ
                    </Text>
                </View>

                {/* Nút lưu */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleLuu} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>💾 LƯU PHIẾU NHẬP</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// Styles giữ nguyên như cũ của bạn, chỉ bổ sung một chút
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f2f2f2' },
    container: { padding: 16, paddingBottom: 40 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#000' },
    label: { fontSize: 15, fontWeight: '600', marginTop: 12, marginBottom: 6 },
    smallLabel: { fontSize: 13, color: '#555', marginBottom: 4 },

    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
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
        maxHeight: 200,
    },
    dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },

    spHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    addBtn: {
        backgroundColor: '#1976d2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },

    emptyText: { color: '#888', textAlign: 'center', marginVertical: 20, fontStyle: 'italic' },

    dongCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dongHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    dongIndex: { fontWeight: '700', color: '#1976d2', fontSize: 15 },

    spScroll: { marginBottom: 10 },
    spChip: {
        borderWidth: 1,
        borderColor: '#1976d2',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 10,
    },
    spChipSelected: { backgroundColor: '#1976d2' },

    row: { flexDirection: 'row', marginTop: 8 },
    subtotal: {
        textAlign: 'right',
        marginTop: 10,
        fontWeight: '600',
        color: '#d32f2f',
        fontSize: 15,
    },

    totalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#e3f2fd',
        padding: 18,
        borderRadius: 12,
        marginTop: 24,
        marginBottom: 10,
    },
    totalLabel: { fontSize: 17, fontWeight: '600' },
    totalValue: { fontSize: 20, fontWeight: 'bold', color: '#d32f2f' },

    saveBtn: {
        backgroundColor: '#0d47a1',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
});