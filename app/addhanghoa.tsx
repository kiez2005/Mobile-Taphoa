import React, { useState, useEffect } from 'react';
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
import { Picker } from '@react-native-picker/picker';

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

  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [imageUri, setImageUri] = useState('');

  // LOAD DANH MỤC + NCC
  useEffect(() => {
    fetchDanhMuc();
    fetchNhaCungCap();
  }, []);

  const fetchDanhMuc = async () => {
    try {
      const res = await fetch('http://172.20.10.2/cuahangtaphoa/HangHoa/GetDanhMuc');
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch (e) {
      console.log('Lỗi danh mục');
    }
  };

  const fetchNhaCungCap = async () => {
    try {
      const res = await fetch('http://172.20.10.2/cuahangtaphoa/HangHoa/GetNhaCungCap');
      const json = await res.json();
      if (json.success) setSuppliers(json.data);
    } catch (e) {
      console.log('Lỗi NCC');
    }
  };

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
    formData.append('sp.TenSanPham', name);
    formData.append('sp.MaVach', code);
    formData.append('sp.GiaNhap', String(importPrice));
    formData.append('sp.GiaBan', String(price));
    formData.append('sp.SoLuong', String(stock));
    formData.append('sp.SoLuongToiThieu', String(minStock));
    formData.append('sp.HanSuDung', expirationDate.toISOString());
    formData.append('sp.MaDanhMuc', String(categoryId));
    formData.append('sp.MaNhaCungCap', String(supplierId));

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
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Thêm Hàng Hóa</Text>

          <TextInput placeholder="Tên" value={name} onChangeText={setName} style={styles.input} />
          <TextInput placeholder="Mã vạch" value={code} onChangeText={setCode} style={styles.input} />
          <TextInput placeholder="Giá nhập" value={importPrice} onChangeText={setImportPrice} style={styles.input} />
          <TextInput placeholder="Giá bán" value={price} onChangeText={setPrice} style={styles.input} />
          <TextInput placeholder="Số lượng" value={stock} onChangeText={setStock} style={styles.input} />
          <TextInput placeholder="Số lượng tối thiểu" value={minStock} onChangeText={setMinStock} style={styles.input} />

          {/* DATE */}
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Text>📅 {expirationDate.toLocaleDateString('vi-VN')}</Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={() => setShowDatePicker(false)}
          />

          {/* DANH MỤC */}
          <Text>Danh mục</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={categoryId}
              onValueChange={(val) => setCategoryId(val)}
            >
              <Picker.Item label="-- Chọn danh mục --" value="" />
              {categories.map((item) => (
                <Picker.Item
                  key={item.MaDanhMuc}
                  label={item.TenDanhMuc}
                  value={item.MaDanhMuc}
                />
              ))}
            </Picker>
          </View>

          {/* NHÀ CUNG CẤP */}
          <Text>Nhà cung cấp</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={supplierId}
              onValueChange={(val) => setSupplierId(val)}
            >
              <Picker.Item label="-- Chọn NCC --" value="" />
              {suppliers.map((item) => (
                <Picker.Item
                  key={item.MaNhaCungCap}
                  label={item.TenNhaCungCap}
                  value={item.MaNhaCungCap}
                />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleImagePicker}>
            <Text style={styles.btnText}>Chọn ảnh</Text>
          </TouchableOpacity>

          {imageUri && <Image source={{ uri: imageUri }} style={styles.img} />}

          <TouchableOpacity style={[styles.btn, styles.submitBtn]} onPress={handleAdd}>
            <Text style={styles.btnText}>Thêm hàng hóa</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f2f2f2' },
  container: { padding: 16 },

  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },

  pickerBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },

  dateBtn: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
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

  submitBtn: { backgroundColor: '#0d47a1' },

  btnText: { color: '#fff' },

  img: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginTop: 10,
  },
});