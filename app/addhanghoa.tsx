import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function AddHangHoaScreen() {
  const params = useLocalSearchParams<any>();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [importPrice, setImportPrice] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');

  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [imageUri, setImageUri] = useState<string>('');

  const [loading, setLoading] = useState(false);

  // Sync category & supplier từ params hoặc global state
  useFocusEffect(
    React.useCallback(() => {
      if (params?.categoryId) {
        setCategoryId(String(params.categoryId));
        setCategoryName(String(params.categoryName || ''));
      }
      if (params?.supplierId) {
        setSupplierId(String(params.supplierId));
        setSupplierName(String(params.supplierName || ''));
      }

      // Global state (nếu bạn dùng cách này)
      if ((global as any).selectedCategory) {
        setCategoryId((global as any).selectedCategory.id);
        setCategoryName((global as any).selectedCategory.name);
        (global as any).selectedCategory = null;
      }
      if ((global as any).selectedSupplier) {
        setSupplierId((global as any).selectedSupplier.id);
        setSupplierName((global as any).selectedSupplier.name);
        (global as any).selectedSupplier = null;
      }
    }, [JSON.stringify(params)])
  );

  const handleImagePicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Lỗi', 'Bạn chưa cấp quyền truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,        // giảm nhẹ để upload nhanh hơn
      allowsEditing: true,
      aspect: [1, 1],      // vuông (tùy chọn)
    });

    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImageUri('');
  };

  const handleAdd = async () => {
    if (!name.trim() || !code.trim() || !categoryId || !supplierId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ tên, mã vạch, danh mục và nhà cung cấp');
      return;
    }

    const API_URL = 'http://172.20.10.5/cuahangtaphoa/HangHoa/Create';

    const formData = new FormData();
    formData.append('TenSanPham', name.trim());
    formData.append('MaVach', code.trim());
    formData.append('GiaNhap', importPrice || '0');
    formData.append('GiaBan', price || '0');
    formData.append('SoLuong', stock || '0');
    formData.append('SoLuongToiThieu', minStock || '0');
    formData.append('MaDanhMuc', categoryId);
    formData.append('MaNhaCungCap', supplierId);

    if (imageUri) {
      formData.append('fileAnh', {
        uri: imageUri,
        name: 'sanpham.jpg',
        type: 'image/jpeg',
      } as any);
    }

    setLoading(true);

    try {
      console.log('Đang gửi request đến:', API_URL);

      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      console.log('Status code:', res.status);

      const responseText = await res.text();
      console.log('Response body:', responseText.substring(0, 600));

      if (!res.ok) {
        Alert.alert(
          'Lỗi Server',
          `Mã lỗi: ${res.status}\n\n${responseText.substring(0, 400)}...`
        );
        return;
      }

      const json = JSON.parse(responseText);

      if (json.success) {
        Alert.alert('Thành công', 'Thêm hàng hóa thành công!', [
          { 
            text: 'OK', 
            onPress: () => {
              // Reset form sau khi thêm thành công
              setName('');
              setCode('');
              setImportPrice('');
              setPrice('');
              setStock('');
              setMinStock('');
              setImageUri('');
              router.back();
            }
          },
        ]);
      } else {
        Alert.alert('Lỗi', json.message || 'Thêm thất bại');
      }
    } catch (error: any) {
      console.error('Lỗi chi tiết:', error);
      Alert.alert('Lỗi', `Không thể kết nối server hoặc parse dữ liệu\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Thêm Hàng Hóa Mới</Text>

          <TextInput
            style={styles.input}
            placeholder="Tên sản phẩm *"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Mã vạch *"
            placeholderTextColor="#888"
            value={code}
            onChangeText={setCode}
          />

          <TextInput
            style={styles.input}
            placeholder="Giá nhập"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={importPrice}
            onChangeText={setImportPrice}
          />

          <TextInput
            style={styles.input}
            placeholder="Giá bán"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          <TextInput
            style={styles.input}
            placeholder="Số lượng"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={stock}
            onChangeText={setStock}
          />

          <TextInput
            style={styles.input}
            placeholder="Số lượng tối thiểu"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={minStock}
            onChangeText={setMinStock}
          />

          {/* Danh mục */}
          <TouchableOpacity style={styles.box} onPress={() => router.push('/SelectCategory')}>
            <Text style={{ color: categoryName ? '#000' : '#888' }}>
              {categoryName ? `Danh mục: ${categoryName}` : 'Chọn danh mục *'}
            </Text>
          </TouchableOpacity>

          {/* Nhà cung cấp */}
          <TouchableOpacity style={styles.box} onPress={() => router.push('/SelectSupplier')}>
            <Text style={{ color: supplierName ? '#000' : '#888' }}>
              {supplierName ? `Nhà cung cấp: ${supplierName}` : 'Chọn nhà cung cấp *'}
            </Text>
          </TouchableOpacity>

          {/* Chọn ảnh */}
          <TouchableOpacity style={styles.btn} onPress={handleImagePicker}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>📷 Chọn ảnh sản phẩm</Text>
          </TouchableOpacity>

          {imageUri ? (
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <Image source={{ uri: imageUri }} style={styles.img} />
              <TouchableOpacity onPress={removeImage} style={styles.removeBtn}>
                <Text style={{ color: 'red', fontWeight: 'bold' }}>Xóa ảnh</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Nút lưu */}
          <TouchableOpacity 
            style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
            onPress={handleAdd}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                💾 LƯU HÀNG HÓA
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f2f2f2' },
  container: { padding: 16 },

  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },

  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#ddd',
  },

  box: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  btn: {
    backgroundColor: '#1976d2',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 8,
  },

  saveBtn: {
    backgroundColor: '#0d47a1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },

  img: {
    width: 160,
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  removeBtn: {
    marginTop: 8,
    padding: 8,
  },
});