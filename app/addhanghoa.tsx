import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { router } from 'expo-router';

export default function AddHangHoaScreen() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [importPrice, setImportPrice] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [imageUri, setImageUri] = useState('');

  // CHỌN ẢNH
  const handleImagePicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Lỗi', 'Bạn chưa cấp quyền thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // CHỌN NGÀY
  const handleConfirmDate = (date: Date) => {
    setExpirationDate(date);
    setShowDatePicker(false);
  };

  const handleAdd = async () => {
    if (
      !name ||
      !code ||
      !importPrice ||
      !price ||
      !stock ||
      !minStock ||
      !categoryId ||
      !supplierId
    ) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ dữ liệu');
      return;
    }

    const formData = new FormData();
    formData.append('TenSanPham', name);
    formData.append('MaVach', code);
    formData.append('GiaNhap', importPrice);
    formData.append('GiaBan', price);
    formData.append('SoLuong', stock);
    formData.append('SoLuongToiThieu', minStock);
    formData.append('HanSuDung', expirationDate.toISOString().split('T')[0]);
    formData.append('MaDanhMuc', categoryId);
    formData.append('MaNhaCungCap', supplierId);

    if (imageUri) {
      const fileName = imageUri.split('/').pop();

      formData.append('fileAnh', {
        uri: imageUri,
        name: fileName,
        type: 'image/jpeg',
      } as any);
    }

    try {
      const res = await fetch(
        'http://172.20.10.2/cuahangtaphoa/HangHoa/Create',
        {
          method: 'POST',
          body: formData,
        }
      );

      const json = await res.json();

      if (json.success) {
        Alert.alert('Thành công', 'Đã thêm hàng hóa', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Lỗi', json.message || 'Thất bại');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không kết nối được server');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Thêm Hàng Hóa</Text>

          <TextInput placeholder="Tên" placeholderTextColor="#666" value={name} onChangeText={setName} style={styles.input} />
          <TextInput placeholder="Mã vạch" placeholderTextColor="#666" value={code} onChangeText={setCode} style={styles.input} />
          <TextInput placeholder="Giá nhập" placeholderTextColor="#666" value={importPrice} onChangeText={setImportPrice} style={styles.input} />
          <TextInput placeholder="Giá bán" placeholderTextColor="#666" value={price} onChangeText={setPrice} style={styles.input} />
          <TextInput placeholder="Số lượng" placeholderTextColor="#666" value={stock} onChangeText={setStock} style={styles.input} />
          <TextInput placeholder="Số lượng tối thiểu" placeholderTextColor="#666" value={minStock} onChangeText={setMinStock} style={styles.input} />

          {/* DATE BUTTON (ĐẸP HƠN) */}
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: '#000', fontWeight: '500' }}>
              📅 Hạn sử dụng: {expirationDate.toLocaleDateString('vi-VN')}
            </Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={() => setShowDatePicker(false)}
          />

          <TextInput placeholder="Mã danh mục" placeholderTextColor="#666" value={categoryId} onChangeText={setCategoryId} style={styles.input} />
          <TextInput placeholder="Mã nhà cung cấp" placeholderTextColor="#666" value={supplierId} onChangeText={setSupplierId} style={styles.input} />

          <TouchableOpacity style={styles.btn} onPress={handleImagePicker}>
            <Text style={styles.btnText}>Chọn ảnh</Text>
          </TouchableOpacity>

          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.img} />
          ) : null}

          <TouchableOpacity style={[styles.btn, styles.submitBtn]} onPress={handleAdd}>
            <Text style={styles.btnText}>Thêm hàng hóa</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    color: '#000',
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  btn: {
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtn: {
    backgroundColor: '#0d47a1',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  img: {
    width: 120,
    height: 120,
    marginTop: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
});