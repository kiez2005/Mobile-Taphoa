import React, { useEffect, useState, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as ImagePicker from 'expo-image-picker';

export default function ProductDetail() {
  const params = useLocalSearchParams<any>();
  const productId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [data, setData] = useState<any>(null);

  const [tenHang, setTenHang] = useState('');
  const [maHang, setMaHang] = useState('');
  const [giaNhap, setGiaNhap] = useState('');
  const [giaBan, setGiaBan] = useState('');
  const [soLuongTon, setSoLuongTon] = useState('');
  const [hanSuDung, setHanSuDung] = useState('');           // yyyy-MM-dd
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [maDanhMuc, setMaDanhMuc] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [maNhaCungCap, setMaNhaCungCap] = useState('');
  const [supplierName, setSupplierName] = useState('');

  const [imageUri, setImageUri] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      if (params?.categoryId) {
        setMaDanhMuc(String(params.categoryId));
        setCategoryName(String(params.categoryName || ''));
      }
      if (params?.supplierId) {
        setMaNhaCungCap(String(params.supplierId));
        setSupplierName(String(params.supplierName || ''));
      }
      if ((global as any).selectedCategory) {
        setMaDanhMuc((global as any).selectedCategory.id);
        setCategoryName((global as any).selectedCategory.name);
        (global as any).selectedCategory = null;
      }
      if ((global as any).selectedSupplier) {
        setMaNhaCungCap((global as any).selectedSupplier.id);
        setSupplierName((global as any).selectedSupplier.name);
        (global as any).selectedSupplier = null;
      }
    }, [params?.categoryId, params?.supplierId])
  );

  // Đồng bộ selectedDate an toàn
  useEffect(() => {
    if (hanSuDung) {
      const dateObj = new Date(hanSuDung);
      if (!isNaN(dateObj.getTime())) {
        setSelectedDate(dateObj);
      } else {
        setSelectedDate(new Date()); // fallback nếu ngày invalid
      }
    }
  }, [hanSuDung]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://taphoacuakien.runasp.net/HangHoa/GetById?id=${productId}`);
      const json = await res.json();

      if (json.success) {
        const d = json.data;
        setData(d);

        setTenHang(d.tenHang || '');
        setMaHang(d.maHang || '');
        setGiaNhap(String(d.giaNhap ?? ''));
        setGiaBan(String(d.giaBan ?? ''));
        setSoLuongTon(String(d.soLuongTon ?? ''));

        let hsd = '';
        if (d.hanSuDung) {
          const parsed = new Date(d.hanSuDung);
          if (!isNaN(parsed.getTime())) {
            hsd = parsed.toISOString().split('T')[0];
          }
        }
        setHanSuDung(hsd);
      } else {
        Alert.alert('Lỗi', json.message || 'Không tìm thấy sản phẩm');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không load được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setHanSuDung(dateStr);
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const handleImagePicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Lỗi', 'Bạn chưa cấp quyền ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);

      // BƯỚC 1: Cập nhật thông tin text
      const updateBody = new URLSearchParams();
      updateBody.append('sp.MaSanPham', String(productId));
      updateBody.append('sp.TenSanPham', tenHang || '');
      updateBody.append('sp.MaVach', maHang || '');
      updateBody.append('sp.SoLuong', soLuongTon || '0');
      updateBody.append('sp.MaDanhMuc', maDanhMuc || '');
      updateBody.append('sp.MaNhaCungCap', maNhaCungCap || '');
      updateBody.append('GiaNhap', giaNhap || '0');
      updateBody.append('GiaBan', giaBan || '0');
      if (hanSuDung) {
        updateBody.append('sp.HanSuDung', new Date(hanSuDung).toISOString());
      }

      const res = await fetch('http://taphoacuakien.runasp.net/HangHoa/EditPost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: updateBody.toString(),
      });

      if (!res.ok) {
        Alert.alert('Lỗi', `Server lỗi: ${res.status}`);
        return;
      }

      const json = JSON.parse(await res.text());
      if (!json.success) {
        Alert.alert('Lỗi', json.message || 'Cập nhật thất bại');
        return;
      }
      // BƯỚC 2: Upload ảnh
      if (imageUri) {
        const formData = new FormData();

        let uri = imageUri;
        if (Platform.OS === 'android' && !uri.startsWith('file://')) {
          uri = `file://${uri}`;
        }
        
        formData.append('fileAnh', {
          uri,
          name: `product_${productId}.jpg`,
          type: 'image/jpeg',
        } as any);

        // ✅ Truyền id qua query string, KHÔNG đưa vào FormData
        const imgRes = await fetch(
          `http://taphoacuakien.runasp.net/HangHoa/UpdateImage?id=${productId}`,
          {
            method: 'POST',
            body: formData,
            // ❌ Không set Content-Type
          }
        );

        const imgText = await imgRes.text();
        console.log('Upload status:', imgRes.status, imgText.substring(0, 300));

        if (!imgRes.ok) {
          Alert.alert('Lưu OK', `Thông tin đã lưu nhưng upload ảnh lỗi HTTP ${imgRes.status}`);
          setEditMode(false);
          fetchData();
          return;
        }

        let imgJson;
        try {
          imgJson = JSON.parse(imgText);
        } catch {
          Alert.alert('Lưu OK', 'Server trả về response không hợp lệ:\n' + imgText.substring(0, 150));
          setEditMode(false);
          fetchData();
          return;
        }

        if (!imgJson.success) {
          Alert.alert('Lưu OK', 'Thông tin đã lưu nhưng ảnh lỗi: ' + imgJson.message);
          setEditMode(false);
          fetchData();
          return;
        }
      }

      Alert.alert('Thành công', 'Cập nhật thành công', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      setEditMode(false);
      setImageUri('');
      fetchData();

    } catch (err: any) {
      console.error('Update error:', err);
      Alert.alert('Lỗi kết nối', err?.message || 'Không kết nối server');
    } finally {
      setSaving(false);
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
            setSaving(true);

            const res = await fetch(
              'http://taphoacuakien.runasp.net/HangHoa/Delete',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `id=${productId}`,
              }
            );

            // Check HTTP status trước
            if (!res.ok) {
              Alert.alert('Lỗi', `Server trả về lỗi: ${res.status}`);
              return;
            }

            const responseText = await res.text();
            console.log('🗑️ Delete response:', responseText.substring(0, 300));

            // Parse JSON an toàn
            let json;
            try {
              json = JSON.parse(responseText);
            } catch {
              Alert.alert('Lỗi', 'Server không trả về JSON hợp lệ:\n' + responseText.substring(0, 100));
              return;
            }

            if (json.success) {
              Alert.alert('OK', 'Đã xoá');
              router.back();
            } else {
              Alert.alert('Lỗi', json.message || 'Xoá thất bại');
            }
          } catch (err: any) {
            console.error('Delete error:', err);
            // Hiện lỗi chi tiết hơn để debug
            Alert.alert('Lỗi kết nối', err?.message || 'Không kết nối server');
          } finally {
            setSaving(false);
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
      <TouchableOpacity
        onPress={editMode ? handleImagePicker : undefined}
        disabled={!editMode}
      >
        <Image 
          source={{ uri: imageUri || data?.hinhAnh }} 
          style={styles.image} 
        />
        {editMode && <Text style={styles.editImageText}>Chọn ảnh</Text>}
      </TouchableOpacity>

      {!editMode ? (
        <Text style={styles.name}>{data?.tenHang}</Text>
      ) : (
        <TextInput 
          value={tenHang} 
          onChangeText={setTenHang} 
          style={styles.input}
          editable={editMode}
        />
      )}

      <View style={styles.card}>
        <Text>Mã hàng</Text>
        <TextInput 
          value={maHang} 
          onChangeText={setMaHang} 
          style={styles.input}
          editable={editMode}
        />

        <Text>Giá nhập</Text>
        <TextInput 
          value={giaNhap} 
          onChangeText={setGiaNhap} 
          style={styles.input}
          editable={editMode}
        />

        <Text>Giá bán</Text>
        <TextInput 
          value={giaBan} 
          onChangeText={setGiaBan} 
          style={styles.input}
          editable={editMode}
        />

        <Text>Số lượng</Text>
        <TextInput 
          value={soLuongTon} 
          onChangeText={setSoLuongTon} 
          style={styles.input}
          editable={editMode}
        />

        <Text>Hạn sử dụng</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => editMode && setShowDatePicker(true)}
          disabled={!editMode}
        >
          <Text style={{ color: editMode ? '#000' : '#999' }}>
            {hanSuDung
              ? new Date(hanSuDung).toLocaleDateString('vi-VN')
              : 'Chọn ngày'}
          </Text>
        </TouchableOpacity>

        {/* Date Picker - Đã fix lỗi out of bounds */}
        <DateTimePickerModal
          key={selectedDate.getTime()}           
          isVisible={showDatePicker}
          mode="date"
          date={selectedDate}                   
          onConfirm={handleConfirmDate}
          onCancel={() => setShowDatePicker(false)}
          minimumDate={new Date(2020, 0, 1)}
          maximumDate={new Date(2050, 11, 31)}
        />

        <Text>Danh mục</Text>
        <TouchableOpacity
          style={styles.box}
          onPress={() =>
            editMode &&
            router.push({
              pathname: '/SelectCategory',
              params: { target: 'productdetail', id: productId },
            })
          }
          disabled={!editMode}
        >
          <Text style={{ color: editMode ? '#000' : '#666' }}>
            {categoryName ? `Danh mục: ${categoryName}` : `ID: ${maDanhMuc || 'Chọn danh mục'}`}
          </Text>
        </TouchableOpacity>

        <Text>Nhà cung cấp</Text>
        <TouchableOpacity
          style={styles.box}
          onPress={() =>
            editMode &&
            router.push({
              pathname: '/SelectSupplier',
              params: { target: 'productdetail', id: productId },
            })
          }
          disabled={!editMode}
        >
          <Text style={{ color: editMode ? '#000' : '#666' }}>
            {supplierName ? `NCC: ${supplierName}` : `ID: ${maNhaCungCap || 'Chọn nhà cung cấp'}`}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {!editMode ? (
          <TouchableOpacity style={styles.btn} onPress={() => setEditMode(true)} disabled={saving}>
            <Text style={styles.btnText}>Sửa</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={handleUpdate} disabled={saving}>
            <Text style={styles.btnText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
          <Text style={styles.btnText}>{saving ? 'Đang xoá...' : 'Xoá'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  image: { width: 120, height: 120, borderRadius: 10 },
  editImageText: { 
    color: '#1976d2', 
    textAlign: 'center', 
    marginTop: 5, 
    fontSize: 12, 
    fontWeight: '600' 
  },
  name: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },

  card: { backgroundColor: '#fff', padding: 16, borderRadius: 10 },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginVertical: 5,
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#000',
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

  box: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginVertical: 5,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});