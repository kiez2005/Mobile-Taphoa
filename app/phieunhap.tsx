import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Alert } from 'react-native';
import axios from 'axios';

const API_URL_PHIEUNHAP = 'http://172.20.10.2/cuahangtaphoa/PhieuNhap'; // Địa chỉ API cho phiếu nhập

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
            const response = await axios.get(`${API_URL_PHIEUNHAP}/index`); // Gọi API để lấy danh sách phiếu nhập
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        const newPhieuNhap = {
            MaNhaCungCap: 1, 
            MaNguoiDung: 1,  
        };

        try {
            const response = await axios.post(`${API_URL_PHIEUNHAP}/create`, newPhieuNhap); // Gọi API để tạo phiếu nhập
            if (response.data.success) {
                Alert.alert('Thành công', 'Thêm phiếu nhập thành công');
                fetchData(); // Tải lại dữ liệu
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không thể thêm phiếu nhập");
        }
    };

    const handleEdit = async (id: number) => {
        const updatedPhieuNhap = {
            MaPhieuNhap: id,
            MaNhaCungCap: 1,
            MaNguoiDung: 1,  
        };

        try {
            const response = await axios.post(`${API_URL_PHIEUNHAP}/editpost`, updatedPhieuNhap); // Gọi API để chỉnh sửa phiếu nhập
            if (response.data.success) {
                Alert.alert('Thành công', 'Cập nhật phiếu nhập thành công');
                fetchData(); 
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không thể cập nhật phiếu nhập");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await axios.post(`${API_URL_PHIEUNHAP}/delete`, { id }); // Gọi API để xóa phiếu nhập
            if (response.data.success) {
                Alert.alert('Thành công', 'Xóa phiếu nhập thành công');
                fetchData(); // Tải lại dữ liệu
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không thể xóa phiếu nhập");
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(`${API_URL_PHIEUNHAP}/export`); // Gọi API để xuất phiếu nhập
            if (response.data.success) {
                // Giả định bạn muốn hiển thị CSV trong Alert
                Alert.alert('Dữ liệu xuất', response.data.data);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không thể xuất phiếu nhập");
        }
    };

    const handleDetail = async (id: number) => {
        try {
            const response = await axios.get(`${API_URL_PHIEUNHAP}/getphieunhap/${id}`); // Gọi API để lấy chi tiết phiếu nhập
            if (response.data) {
                Alert.alert('Chi tiết Phiếu Nhập', `Mã Phiếu Nhập: ${response.data.MaPhieuNhap}\nNhà Cung Cấp: ${response.data.MaNhaCungCap}\nNgười Dùng: ${response.data.MaNguoiDung}`);
            } else {
                Alert.alert("Lỗi", "Không tìm thấy phiếu nhập");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không thể lấy chi tiết phiếu nhập");
        }
    };

    if (loading) {
        return <Text>Loading...</Text>;
    }

    return (
        <View style={{ padding: 20 }}>
            <Button title="Thêm Phiếu Nhập" onPress={handleCreate} />
            <Button title="Xuất Phiếu Nhập" onPress={handleExport} />
            <FlatList
                data={data}
                keyExtractor={(item) => item.MaPhieuNhap.toString()}
                renderItem={({ item }) => (
                    <View style={{ marginVertical: 10 }}>
                        <Text>Ma Phieu Nhap: {item.MaPhieuNhap}</Text>
                        <Text>Ma Phieu: {item.MaPhieu}</Text>
                        <Text>Ngay Nhap: {item.NgayNhap}</Text>
                        <Text>Tong Tien: {item.TongTien}</Text>
                        <Button title="Chi Tiết" onPress={() => handleDetail(item.MaPhieuNhap)} />
                        <Button title="Chỉnh Sửa" onPress={() => handleEdit(item.MaPhieuNhap)} />
                        <Button title="Xóa" onPress={() => handleDelete(item.MaPhieuNhap)} />
                    </View>
                )}
            />
        </View>
    );
}
