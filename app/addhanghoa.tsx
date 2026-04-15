import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { router } from 'expo-router';

export default function AddHangHoaScreen() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [importPrice, setImportPrice] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [imageUri, setImageUri] = useState('');

  const handleImagePicker = () => {
    launchImageLibrary({ mediaType: 'photo' }, (res) => {
      if (res.assets?.length) {
        setImageUri(res.assets[0].uri || '');
      }
    });
  };

  const handleAdd = async () => {
    if (
      !name ||
      !code ||
      !importPrice ||
      !price ||
      !stock ||
      !minStock ||
      !expirationDate ||
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
    formData.append('HanSuDung', expirationDate);
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
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Lỗi', json.message || 'Thất bại');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không kết nối được server');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thêm Hàng Hóa</Text>

      <TextInput placeholder="Tên" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Mã vạch" value={code} onChangeText={setCode} style={styles.input} />

      <TextInput placeholder="Giá nhập" value={importPrice} onChangeText={setImportPrice} style={styles.input} />
      <TextInput placeholder="Giá bán" value={price} onChangeText={setPrice} style={styles.input} />

      <TextInput placeholder="Số lượng" value={stock} onChangeText={setStock} style={styles.input} />
      <TextInput placeholder="Số lượng tối thiểu" value={minStock} onChangeText={setMinStock} style={styles.input} />

      <TextInput placeholder="Hạn sử dụng" value={expirationDate} onChangeText={setExpirationDate} style={styles.input} />

      <TextInput placeholder="Mã danh mục" value={categoryId} onChangeText={setCategoryId} style={styles.input} />
      <TextInput placeholder="Mã nhà cung cấp" value={supplierId} onChangeText={setSupplierId} style={styles.input} />

      <TouchableOpacity style={styles.btn} onPress={handleImagePicker}>
        <Text style={{ color: '#fff' }}>Chọn ảnh</Text>
      </TouchableOpacity>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.img} />
      ) : null}

      <TouchableOpacity style={styles.btn} onPress={handleAdd}>
        <Text style={{ color: '#fff' }}>Thêm hàng hóa</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
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
  img: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 8,
  },
});