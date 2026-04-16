import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const productId = Array.isArray(id) ? id[0] : id;

export default function ProductDetail() {
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [data, setData] = useState<any>(null);

  const [tenHang, setTenHang] = useState('');
  const [maHang, setMaHang] = useState('');
  const [giaNhap, setGiaNhap] = useState('');
  const [giaBan, setGiaBan] = useState('');
  const [soLuongTon, setSoLuongTon] = useState('');
  const [hanSuDung, setHanSuDung] = useState('');
  const [maDanhMuc, setMaDanhMuc] = useState('');
  const [maNhaCungCap, setMaNhaCungCap] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(
        `http://172.20.10.2/cuahangtaphoa/HangHoa/Edit?id=${productId}`
        `http://172.20.10.2/cuahangtaphoa/HangHoa/Edit?id=${id}`
      );
      const json = await res.json();

      if (json.success) {
        const d = json.data;
        setData(d);

        setTenHang(d.tenHang);
        setMaHang(d.maHang);
        setGiaNhap(String(d.giaNhap ?? ''));
        setGiaBan(String(d.giaBan ?? ''));
        setSoLuongTon(String(d.soLuongTon ?? ''));

        // ✅ lưu dạng yyyy-MM-dd
        setHanSuDung(
          d.hanSuDung
            ? new Date(d.hanSuDung).toISOString().split('T')[0]
            : ''
        );

        setHanSuDung(d.hanSuDung ?? '');
        setMaDanhMuc(String(d.maDanhMuc ?? ''));
        setMaNhaCungCap(String(d.maNhaCungCap ?? ''));
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không load được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // ✅ chọn ngày
  const handleConfirmDate = (date: Date) => {
    setHanSuDung(date.toISOString().split('T')[0]);
    setShowDatePicker(false);
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();

      formData.append('sp.MaSanPham', String(productId));
      formData.append('sp.TenSanPham', tenHang);
      formData.append('sp.MaVach', maHang);
      formData.append('sp.SoLuong', soLuongTon);
      formData.append('sp.MaDanhMuc', maDanhMuc);
      formData.append('sp.MaNhaCungCap', maNhaCungCap);

      formData.append('GiaNhap', giaNhap);
      formData.append('GiaBan', giaBan);

      if (hanSuDung) {
        formData.append(
          'sp.HanSuDung',
          new Date(hanSuDung).toISOString()
        );
      }
      formData.append('MaSanPham', String(id));
      formData.append('TenSanPham', tenHang);
      formData.append('MaVach', maHang);
      formData.append('GiaNhap', giaNhap);
      formData.append('GiaBan', giaBan);
      formData.append('SoLuong', soLuongTon);
      formData.append('HanSuDung', hanSuDung);
      formData.append('MaDanhMuc', maDanhMuc);
      formData.append('MaNhaCungCap', maNhaCungCap);

      const res = await fetch(
        'http://172.20.10.2/cuahangtaphoa/HangHoa/EditPost',
        {
          method: 'POST',
          body: formData,
        }
      );

      const json = await res.json();

      if (json.success) {
        Alert.alert('OK', 'Cập nhật thành công');
        setEditMode(false);
        fetchData();
      } else {
        Alert.alert('Lỗi', json.message);
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Lỗi', 'Server lỗi');
    }
  };

  const handleDelete = async () => {
    Alert.alert('Xoá', 'Bạn có chắc muốn xoá?', [
      { text: 'Huỷ' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            const formData = new FormData();
            formData.append('id', String(productId));

            const res = await fetch(
              'http://172.20.10.2/cuahangtaphoa/HangHoa/Delete',
              {
                method: 'POST',
                body: formData,
            const res = await fetch(
              `http://172.20.10.2/cuahangtaphoa/HangHoa/Delete?id=${id}`,
              {
                method: 'POST',
              }
            );

            const json = await res.json();

            if (json.success) {
              Alert.alert('OK', 'Đã xoá');
              router.back();
            } else {
              Alert.alert('Lỗi', json.message);
            }
          } catch (err) {
            console.log(err);
            Alert.alert('Lỗi', 'Không kết nối server');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: data?.hinhAnh }} style={styles.image} />

      {!editMode ? (
        <Text style={styles.name}>{data?.tenHang}</Text>
      ) : (
        <TextInput value={tenHang} onChangeText={setTenHang} style={styles.input} />
      )}

      <View style={styles.card}>
        <Text>Mã hàng</Text>
        <TextInput value={maHang} onChangeText={setMaHang} style={styles.input} />

        <Text>Giá nhập</Text>
        <TextInput value={giaNhap} onChangeText={setGiaNhap} style={styles.input} />

        <Text>Giá bán</Text>
        <TextInput value={giaBan} onChangeText={setGiaBan} style={styles.input} />

        <Text>Số lượng</Text>
        <TextInput value={soLuongTon} onChangeText={setSoLuongTon} style={styles.input} />

        {/* ✅ DATE PICKER */}
        <Text>Hạn sử dụng</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>
            {hanSuDung
              ? new Date(hanSuDung).toLocaleDateString('vi-VN')
              : 'Chọn ngày'}
          </Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={() => setShowDatePicker(false)}
        />
        <Text>Hạn sử dụng</Text>
        <TextInput value={hanSuDung} onChangeText={setHanSuDung} style={styles.input} />

        <Text>Danh mục</Text>
        <TextInput value={maDanhMuc} onChangeText={setMaDanhMuc} style={styles.input} />

        <Text>Nhà cung cấp</Text>
        <TextInput value={maNhaCungCap} onChangeText={setMaNhaCungCap} style={styles.input} />
      </View>

      <View style={styles.row}>
        {!editMode ? (
          <TouchableOpacity style={styles.btn} onPress={() => setEditMode(true)}>
            <Text style={styles.btnText}>Sửa</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={handleUpdate}>
            <Text style={styles.btnText}>Lưu</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.btnText}>Xoá</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  image: { width: 120, height: 120, borderRadius: 10 },
  name: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },

  card: { backgroundColor: '#fff', padding: 16, borderRadius: 10 },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginVertical: 5,
    borderRadius: 6,
    backgroundColor: '#fff',
    padding: 8,
    marginVertical: 5,
    borderRadius: 6,
  },

  row: { flexDirection: 'row', marginTop: 20, gap: 10 },

  btn: {
    flex: 1,
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  deleteBtn: {
    flex: 1,
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  btnText: { color: '#fff', fontWeight: '600' },
});