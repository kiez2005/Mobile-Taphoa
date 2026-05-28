import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Alert,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView as SafeAreaContainer } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import axios from 'axios';

const API_URL_PHIEUNHAP = 'http://172.20.10.5/cuahangtaphoa/PhieuNhap';

interface PhieuNhap {
    MaPhieuNhap: number;
    MaPhieu: string;
    NgayNhap: string;
    TongTien: number;
}

export default function PhieuNhap() {
    const [data, setData] = useState<PhieuNhap[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL_PHIEUNHAP}/index`);
            if (response.data.success) {
                setData(response.data.data || []);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không thể tải danh sách phiếu nhập");
        } finally {
            setLoading(false);
        }
    };

    // Chuyển sang màn hình tạo phiếu nhập
    const handleCreate = () => {
        router.push('/addphieunhap' as any);
    };

    const handleEdit = async (id: number) => {
        Alert.alert("Thông báo", "Chức năng chỉnh sửa phiếu nhập đang được phát triển");
        // Nếu muốn implement sau, có thể navigate sang màn hình edit
    };

    const handleDelete = async (id: number) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa phiếu nhập này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await axios.post(`${API_URL_PHIEUNHAP}/delete`, { id });
                            if (response.data.success) {
                                Alert.alert('Thành công', 'Xóa phiếu nhập thành công');
                                fetchData();
                            } else {
                                Alert.alert('Lỗi', response.data.message || 'Không thể xóa');
                            }
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Lỗi", "Không thể xóa phiếu nhập");
                        }
                    }
                }
            ]
        );
    };

    const handleDetail = async (id: number) => {
        try {
            const response = await axios.get(`${API_URL_PHIEUNHAP}/getphieunhap/${id}`);
            if (response.data) {
                Alert.alert(
                    'Chi tiết Phiếu Nhập',
                    `Mã Phiếu: ${response.data.MaPhieuNhap}\n` +
                    `Nhà Cung Cấp: ${response.data.MaNhaCungCap}\n` +
                    `Người Dùng: ${response.data.MaNguoiDung}\n` +
                    `Ngày Nhập: ${response.data.NgayNhap || 'N/A'}`
                );
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không thể lấy chi tiết phiếu nhập");
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(`${API_URL_PHIEUNHAP}/export`);
            if (response.data.success) {
                Alert.alert('Xuất dữ liệu thành công', 'Dữ liệu CSV đã được tạo (xem console)');
                console.log('CSV Data:\n', response.data.data);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không thể xuất dữ liệu");
        }
    };

    if (loading) {
        return (
            <SafeAreaContainer style={styles.container}>
                <ActivityIndicator size="large" color="#1976d2" />
            </SafeAreaContainer>
        );
    }

    return (
        <SafeAreaContainer style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý Phiếu Nhập</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleCreate}>
                    <Text style={styles.btnText}>➕ Thêm Phiếu Nhập</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={handleExport}>
                    <Text style={styles.btnText}>📊 Xuất Excel/CSV</Text>
                </TouchableOpacity>
            </View>

            {/* Danh sách */}
            <FlatList
                data={data}
                keyExtractor={(item) => item.MaPhieuNhap.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Không có phiếu nhập nào</Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.cardTitle}>Phiếu #{item.MaPhieu}</Text>
                                <Text style={styles.cardSubtitle}>{item.NgayNhap}</Text>
                            </View>
                            <Text style={styles.cardPrice}>
                                {item.TongTien.toLocaleString('vi-VN')} đ
                            </Text>
                        </View>

                        <View style={styles.cardDivider} />

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.detailBtn]}
                                onPress={() => handleDetail(item.MaPhieuNhap)}
                            >
                                <Text style={styles.actionBtnText}>👁 Chi Tiết</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.editBtn]}
                                onPress={() => handleEdit(item.MaPhieuNhap)}
                            >
                                <Text style={styles.actionBtnText}>✏️ Sửa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.deleteBtn]}
                                onPress={() => handleDelete(item.MaPhieuNhap)}
                            >
                                <Text style={styles.actionBtnText}>🗑️ Xóa</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </SafeAreaContainer>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
    },
    btn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnPrimary: { backgroundColor: '#1976d2' },
    btnSecondary: { backgroundColor: '#4caf50' },
    btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

    card: {
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: { fontSize: 17, fontWeight: 'bold' },
    cardSubtitle: { fontSize: 13, color: '#666', marginTop: 4 },
    cardPrice: { fontSize: 17, fontWeight: 'bold', color: '#d32f2f' },
    cardDivider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
    },
    actionButtons: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    detailBtn: { backgroundColor: '#e3f2fd' },
    editBtn: { backgroundColor: '#fff3e0' },
    deleteBtn: { backgroundColor: '#ffebee' },
    actionBtnText: { fontSize: 13, fontWeight: '600', color: '#000' },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#888',
    },
});