import React, { useState, useCallback } from 'react';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

// ─── Cấu hình Cloudinary ──────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = 'dpfwmgmpi';      
const CLOUDINARY_UPLOAD_PRESET = 'cuahangtaphoa'; 
const CLOUDINARY_FOLDER = 'cuahang/sanpham';

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// ─── Hàm upload ảnh lên Cloudinary, trả về URL ───────────────────────────────
async function uploadToCloudinary(
  uri: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  // Expo trả về URI dạng file:// hoặc content://
  // Cần đọc file thành blob để upload
  const formData = new FormData();

  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: `sanpham_${Date.now()}.jpg`,
  } as any);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', CLOUDINARY_FOLDER);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Theo dõi tiến trình upload
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url); // URL HTTPS của ảnh trên Cloudinary
      } else {
        reject(new Error(`Cloudinary lỗi ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Không kết nối được Cloudinary'));
    xhr.ontimeout = () => reject(new Error('Upload ảnh quá thời gian chờ'));
    xhr.timeout = 30000;

    xhr.open('POST', CLOUDINARY_URL);
    xhr.send(formData);
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────
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

  // imageUri: URI local để hiển thị preview
  // imageUrl: URL Cloudinary sau khi upload xong
  const [imageUri, setImageUri] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  // Sync category & supplier từ params hoặc global state
  useFocusEffect(
    useCallback(() => {
      if (params?.categoryId) {
        setCategoryId(String(params.categoryId));
        setCategoryName(String(params.categoryName || ''));
      }
      if (params?.supplierId) {
        setSupplierId(String(params.supplierId));
        setSupplierName(String(params.supplierName || ''));
      }
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

  // ── Chọn ảnh rồi upload ngay lên Cloudinary ──────────────────────────────
  const handleImagePicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Lỗi', 'Bạn chưa cấp quyền truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets?.[0]) return;

    const localUri = result.assets[0].uri;
    setImageUri(localUri);  // Hiển thị preview ngay
    setImageUrl('');         // Xóa URL cũ (nếu đổi ảnh)

    // Upload lên Cloudinary
    try {
      setUploading(true);
      setUploadProgress(0);

      const cloudUrl = await uploadToCloudinary(localUri, setUploadProgress);
      setImageUrl(cloudUrl);
      console.log('✅ Upload thành công:', cloudUrl);
    } catch (err: any) {
      Alert.alert('Lỗi upload ảnh', err.message);
      // Vẫn giữ preview nhưng không có URL — sẽ báo lỗi khi lưu
      setImageUri('');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageUri('');
    setImageUrl('');
    setUploadProgress(0);
  };

  // ── Lưu sản phẩm lên server PHP ──────────────────────────────────────────
  const handleAdd = async () => {
    if (!name.trim() || !code.trim() || !categoryId || !supplierId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ tên, mã vạch, danh mục và nhà cung cấp');
      return;
    }

    // Nếu người dùng chọn ảnh nhưng upload chưa xong
    if (imageUri && !imageUrl) {
      Alert.alert('Chờ chút', 'Ảnh đang được upload, vui lòng đợi...');
      return;
    }

    const API_URL = 'http://taphoacuakien.runasp.net/HangHoa/Create';

    // Gửi dữ liệu dạng JSON thay vì FormData (vì ảnh đã trên Cloudinary)
    const body = {
      TenSanPham: name.trim(),
      MaVach: code.trim(),
      GiaNhap: importPrice || '0',
      GiaBan: price || '0',
      SoLuong: stock || '0',
      SoLuongToiThieu: minStock || '0',
      MaDanhMuc: categoryId,
      MaNhaCungCap: supplierId,
      AnhUrl: imageUrl || '',  // URL Cloudinary, rỗng nếu không có ảnh
    };

    setLoading(true);
    try {
      console.log('📤 Gửi request:', API_URL);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('Status:', res.status);
      const responseText = await res.text();
      console.log('Response:', responseText.substring(0, 600));

      if (!res.ok) {
        Alert.alert('Lỗi Server', `Mã lỗi: ${res.status}\n\n${responseText.substring(0, 400)}`);
        return;
      }

      const json = JSON.parse(responseText);

      if (json.success) {
        Alert.alert('Thành công', 'Thêm hàng hóa thành công!', [
          {
            text: 'OK',
            onPress: () => {
              setName(''); setCode(''); setImportPrice(''); setPrice('');
              setStock(''); setMinStock(''); setImageUri(''); setImageUrl('');
              router.back();
            },
          },
        ]);
      } else {
        Alert.alert('Lỗi', json.message || 'Thêm thất bại');
      }
    } catch (error: any) {
      console.error('Lỗi:', error);
      Alert.alert('Lỗi', `Không thể kết nối server\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Thêm Hàng Hóa Mới</Text>

          <TextInput style={styles.input} placeholder="Tên sản phẩm *"
            placeholderTextColor="#888" value={name} onChangeText={setName} />

          <TextInput style={styles.input} placeholder="Mã vạch *"
            placeholderTextColor="#888" value={code} onChangeText={setCode} />

          <TextInput style={styles.input} placeholder="Giá nhập"
            placeholderTextColor="#888" keyboardType="numeric"
            value={importPrice} onChangeText={setImportPrice} />

          <TextInput style={styles.input} placeholder="Giá bán"
            placeholderTextColor="#888" keyboardType="numeric"
            value={price} onChangeText={setPrice} />

          <TextInput style={styles.input} placeholder="Số lượng"
            placeholderTextColor="#888" keyboardType="numeric"
            value={stock} onChangeText={setStock} />

          <TextInput style={styles.input} placeholder="Số lượng tối thiểu"
            placeholderTextColor="#888" keyboardType="numeric"
            value={minStock} onChangeText={setMinStock} />

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
          <TouchableOpacity
            style={[styles.btn, uploading && { opacity: 0.6 }]}
            onPress={handleImagePicker}
            disabled={uploading}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>
              {uploading ? `⏳ Đang upload... ${uploadProgress}%` : '📷 Chọn ảnh sản phẩm'}
            </Text>
          </TouchableOpacity>

          {/* Preview ảnh */}
          {imageUri ? (
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <View style={styles.imageWrapper}>
                <Image source={{ uri: imageUri }} style={styles.img} />

                {/* Overlay progress khi đang upload */}
                {uploading && (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator color="#fff" size="large" />
                    <Text style={styles.overlayText}>{uploadProgress}%</Text>
                  </View>
                )}

                {/* Badge thành công */}
                {!uploading && imageUrl ? (
                  <View style={styles.successBadge}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓ Đã upload</Text>
                  </View>
                ) : null}
              </View>

              {!uploading && (
                <TouchableOpacity onPress={removeImage} style={styles.removeBtn}>
                  <Text style={{ color: 'red', fontWeight: 'bold' }}>Xóa ảnh</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* Nút lưu */}
          <TouchableOpacity
            style={[styles.saveBtn, (loading || uploading) && { opacity: 0.7 }]}
            onPress={handleAdd}
            disabled={loading || uploading}
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
    backgroundColor: '#fff', padding: 14, borderRadius: 10,
    marginBottom: 12, fontSize: 16, color: '#000',
    borderWidth: 1, borderColor: '#ddd',
  },
  box: {
    backgroundColor: '#fff', padding: 14, borderRadius: 10,
    marginBottom: 12, borderWidth: 1, borderColor: '#ddd',
  },
  btn: {
    backgroundColor: '#1976d2', padding: 14, borderRadius: 10,
    alignItems: 'center', marginVertical: 8,
  },
  saveBtn: {
    backgroundColor: '#0d47a1', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 20,
  },

  imageWrapper: { position: 'relative' },
  img: { width: 160, height: 160, borderRadius: 12, borderWidth: 1, borderColor: '#ddd' },

  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  overlayText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  successBadge: {
    position: 'absolute', bottom: 8, left: 8, right: 8,
    backgroundColor: '#2e7d32',
    borderRadius: 6, paddingVertical: 4,
    alignItems: 'center',
  },

  removeBtn: { marginTop: 8, padding: 8 },
});