import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Alert,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    RefreshControl,
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import axios from 'axios';

// ============================================================
// CONFIG
// ============================================================
const BASE_URL = 'http://taphoacuakien.runasp.net/PhieuNhap';

// ============================================================
// TYPES
// ============================================================
interface PhieuNhap {
    MaPhieuNhap: number;
    MaPhieu: string;
    NgayNhap: string;   // /Date(...)/ format từ ASP.NET
    TongTien: number;
}

interface ChiTiet {
    MaChiTiet: number;
    MaSanPham: number;
    TenSanPham: string;
    GiaNhap: number;
    SoLuong: number;
}

// ============================================================
// HELPER
// ============================================================

/** Parse chuỗi /Date(timestamp)/ của ASP.NET JSON */
const parseDotNetDate = (raw: string): Date => {
    if (!raw) return new Date();
    const match = raw.match(/\/Date\((\d+)(?:[+-]\d+)?\)\//);
    if (match) return new Date(parseInt(match[1]));
    // fallback nếu server trả về ISO string
    return new Date(raw);
};

const formatDate = (raw: string): string => {
    try {
        const date = parseDotNetDate(raw);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return raw;
    }
};

const formatCurrency = (value: number): string => {
    return value.toLocaleString('vi-VN') + ' đ';
};

// ============================================================
// COMPONENT
// ============================================================
export default function PhieuNhapScreen() {
    const [data, setData]           = useState<PhieuNhap[]>([]);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch]       = useState('');

    // Modal chi tiết
    const [modalVisible, setModalVisible]   = useState(false);
    const [chiTietData, setChiTietData]     = useState<ChiTiet[]>([]);
    const [chiTietLoading, setChiTietLoading] = useState(false);
    const [selectedPhieu, setSelectedPhieu] = useState<PhieuNhap | null>(null);

    // ── Fetch danh sách ──────────────────────────────────────
    const fetchData = useCallback(async (keyword = '') => {
        try {
            const response = await axios.get(`${BASE_URL}/GetList`, {
                params: keyword ? { search: keyword } : {},
            });
            console.log('Status:', response.status);
            console.log('Data:', JSON.stringify(response.data));
            if (response.data.success) {
                setData(response.data.data || []);
            } else {
                Alert.alert('Lỗi', response.data.message || 'Không thể tải danh sách');
            }
        } catch (error) {
            console.error('fetchData error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Tìm kiếm ────────────────────────────────────────────
    const handleSearch = () => {
        setLoading(true);
        fetchData(search.trim());
    };

    const handleClearSearch = () => {
        setSearch('');
        setLoading(true);
        fetchData('');
    };

    // ── Refresh ──────────────────────────────────────────────
    const handleRefresh = () => {
        setRefreshing(true);
        fetchData(search.trim());
    };

    // ── Thêm mới ─────────────────────────────────────────────
    const handleCreate = () => {
        router.push('/addphieunhap' as any);
    };

    // ── Chi tiết ─────────────────────────────────────────────
    const handleDetail = async (item: PhieuNhap) => {
        setSelectedPhieu(item);
        setModalVisible(true);
        setChiTietLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/GetChiTiet`, {
                params: { id: item.MaPhieuNhap },
            });
            if (response.data.success) {
                setChiTietData(response.data.data || []);
            } else {
                Alert.alert('Lỗi', 'Không thể tải chi tiết phiếu nhập');
                setModalVisible(false);
            }
        } catch (error) {
            console.error('handleDetail error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
            setModalVisible(false);
        } finally {
            setChiTietLoading(false);
        }
    };

    // ── Sửa ──────────────────────────────────────────────────
    const handleEdit = (id: number) => {
        router.push(`/editphieunhap/${id}` as any);
    };

    // ── Xóa ──────────────────────────────────────────────────
    const handleDelete = (id: number) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc muốn xóa phiếu nhập này?\nHành động này sẽ hoàn trả số lượng hàng về kho.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => confirmDelete(id),
                },
            ]
        );
    };

    const confirmDelete = async (id: number) => {
        try {
            // Dùng FormData để ASP.NET MVC nhận được int id đúng cách
            const formData = new FormData();
            formData.append('id', id.toString());

            const response = await axios.post(`${BASE_URL}/Delete`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                Alert.alert('Thành công', 'Xóa phiếu nhập thành công');
                fetchData(search.trim());
            } else {
                Alert.alert('Lỗi', response.data.message || 'Không thể xóa phiếu nhập');
            }
        } catch (error) {
            console.error('confirmDelete error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        }
    };

    // ── Xuất CSV ─────────────────────────────────────────────
    const handleExport = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/Export`);
            if (response.data.success) {
                // Trong môi trường thực tế, dùng expo-file-system + expo-sharing
                // Ở đây tạm log để demo
                console.log('CSV Data:\n', response.data.data);
                Alert.alert(
                    'Xuất thành công',
                    'Dữ liệu CSV đã được tạo.\n(Tích hợp expo-file-system để lưu file thực sự)'
                );
            } else {
                Alert.alert('Lỗi', 'Không thể xuất dữ liệu');
            }
        } catch (error) {
            console.error('handleExport error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        }
    };

    // ── Render item ──────────────────────────────────────────
    const renderItem = ({ item }: { item: PhieuNhap }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                    <Text style={styles.cardCode}>{item.MaPhieu}</Text>
                    <Text style={styles.cardDate}>📅 {formatDate(item.NgayNhap)}</Text>
                </View>
                <View style={styles.cardRight}>
                    <Text style={styles.cardPrice}>{formatCurrency(item.TongTien)}</Text>
                    <Text style={styles.cardId}>#{item.MaPhieuNhap}</Text>
                </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.detailBtn]}
                    onPress={() => handleDetail(item)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.actionBtnText}>👁 Chi Tiết</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleEdit(item.MaPhieuNhap)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.actionBtnText}>✏️ Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item.MaPhieuNhap)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.actionBtnText}>🗑️ Xóa</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ── Loading screen ────────────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#1976d2" />
                    <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── MAIN ─────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>📋 Quản lý Phiếu Nhập</Text>
                <Text style={styles.subtitle}>{data.length} phiếu</Text>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo mã phiếu..."
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                {search.length > 0 && (
                    <TouchableOpacity style={styles.clearBtn} onPress={handleClearSearch}>
                        <Text style={styles.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                    <Text style={styles.searchBtnText}>🔍</Text>
                </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
                <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={handleCreate}
                    activeOpacity={0.8}
                >
                    <Text style={styles.btnText}>➕ Thêm Mới</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.btn, styles.btnSuccess]}
                    onPress={handleExport}
                    activeOpacity={0.8}
                >
                    <Text style={styles.btnText}>📊 Xuất CSV</Text>
                </TouchableOpacity>
            </View>

            {/* Danh sách */}
            <FlatList
                data={data}
                keyExtractor={(item) => item.MaPhieuNhap.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 16 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#1976d2']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>Không có phiếu nhập nào</Text>
                        <TouchableOpacity onPress={() => fetchData('')}>
                            <Text style={styles.emptyRetry}>Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Modal Chi Tiết */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Chi Tiết Phiếu Nhập</Text>
                                {selectedPhieu && (
                                    <Text style={styles.modalSubtitle}>
                                        {selectedPhieu.MaPhieu} — {formatDate(selectedPhieu.NgayNhap)}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeBtn}
                            >
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.cardDivider} />

                        {/* Modal Body */}
                        {chiTietLoading ? (
                            <View style={styles.centerBox}>
                                <ActivityIndicator size="large" color="#1976d2" />
                            </View>
                        ) : chiTietData.length === 0 ? (
                            <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
                        ) : (
                            <ScrollView style={{ maxHeight: 380 }}>
                                {/* Table Header */}
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableCell, styles.tableHeadText, { flex: 3 }]}>Sản Phẩm</Text>
                                    <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1.5, textAlign: 'right' }]}>Giá Nhập</Text>
                                    <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1, textAlign: 'right' }]}>SL</Text>
                                    <Text style={[styles.tableCell, styles.tableHeadText, { flex: 2, textAlign: 'right' }]}>Thành Tiền</Text>
                                </View>

                                {chiTietData.map((ct) => (
                                    <View key={ct.MaChiTiet} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, { flex: 3 }]} numberOfLines={2}>
                                            {ct.TenSanPham}
                                        </Text>
                                        <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>
                                            {ct.GiaNhap.toLocaleString('vi-VN')}
                                        </Text>
                                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                                            {ct.SoLuong}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.tablePriceText, { flex: 2, textAlign: 'right' }]}>
                                            {(ct.GiaNhap * ct.SoLuong).toLocaleString('vi-VN')}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        {/* Total */}
                        {selectedPhieu && !chiTietLoading && (
                            <View style={styles.modalFooter}>
                                <Text style={styles.totalLabel}>Tổng Tiền:</Text>
                                <Text style={styles.totalValue}>
                                    {formatCurrency(selectedPhieu.TongTien)}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.modalCloseFullBtn}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalCloseFullText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },

    centerBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    loadingText: { marginTop: 12, color: '#666', fontSize: 14 },

    // Header
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#1976d2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 13, color: '#bbdefb' },

    // Search
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        color: '#222',
    },
    clearBtn: {
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    clearBtnText: { fontSize: 14, color: '#555' },
    searchBtn: {
        backgroundColor: '#1976d2',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    searchBtnText: { fontSize: 16 },

    // Buttons
    buttonGroup: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
    },
    btn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 8,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
    },
    btnPrimary: { backgroundColor: '#1976d2' },
    btnSuccess: { backgroundColor: '#388e3c' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginVertical: 6,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardLeft: { flex: 1 },
    cardRight: { alignItems: 'flex-end' },
    cardCode: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    cardDate: { fontSize: 13, color: '#757575', marginTop: 4 },
    cardPrice: { fontSize: 16, fontWeight: 'bold', color: '#d32f2f' },
    cardId: { fontSize: 12, color: '#aaa', marginTop: 3 },
    cardDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },

    // Action buttons
    actionButtons: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 7,
        alignItems: 'center',
    },
    detailBtn: { backgroundColor: '#e3f2fd' },
    editBtn: { backgroundColor: '#fff8e1' },
    deleteBtn: { backgroundColor: '#ffebee' },
    actionBtnText: { fontSize: 12, fontWeight: '700', color: '#333' },

    // Empty state
    emptyBox: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 15, color: '#888', marginBottom: 12, textAlign: 'center' },
    emptyRetry: { color: '#1976d2', fontWeight: '600', fontSize: 14 },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalBox: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    modalSubtitle: { fontSize: 13, color: '#888', marginTop: 3 },
    closeBtn: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: { fontSize: 14, color: '#555', fontWeight: 'bold' },

    // Table
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e3f2fd',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 8,
        marginBottom: 4,
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    tableCell: { fontSize: 13, color: '#333' },
    tableHeadText: { fontWeight: '700', color: '#1565c0' },
    tablePriceText: { fontWeight: '700', color: '#c62828' },

    // Modal Footer
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 14,
        marginTop: 14,
    },
    totalLabel: { fontSize: 15, fontWeight: '700', color: '#333' },
    totalValue: { fontSize: 17, fontWeight: 'bold', color: '#d32f2f' },

    modalCloseFullBtn: {
        backgroundColor: '#1976d2',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 14,
    },
    modalCloseFullText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});