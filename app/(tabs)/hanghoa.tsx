import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'http://172.20.10.2/HangHoa/GetHangHoa';

export default function HangHoaScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}?search=${encodeURIComponent(search)}`);
      const json = await res.json();

      // ✅ FIX: dùng json.data (backend mới)
      const list = json.data || [];

      const formatted = list.map((item: any) => ({
        id: item.id?.toString() || Math.random().toString(),
        name: item.tenHang || 'Không tên',
        code: item.maHang || '',
        price: Number(item.giaBan) || 0,
        stock: Number(item.soLuongTon) || 0,
        image: item.hinhAnh
          ? `http://172.20.10.2/cuahangtaphoa${item.hinhAnh}`
          : 'https://via.placeholder.com/50',
      }));

      setData(formatted);
    } catch (error) {
      console.log('Lỗi API:', error);
    } finally {
      setLoading(false);
    }
  };

  // debounce search (đỡ spam API)
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  return (
    <SafeAreaView style={styles.container}>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Tìm hàng hóa..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 50 }}>
              Không có dữ liệu
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Image
                source={{ uri: item.image }}
                style={styles.img}
                onError={() => console.log('Ảnh lỗi:', item.image)}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.code}>{item.code}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.price}>
                  {item.price.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.stock}>Tồn: {item.stock}</Text>
              </View>
            </View>
          )}
        />
      )}

      {/* REFRESH */}
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
        <Text style={{ color: '#fff' }}>🔄</Text>
      </TouchableOpacity>

      {/* ADD */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },

  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 10,
  },

  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  img: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },

  name: { fontSize: 14, fontWeight: '600' },
  code: { fontSize: 12, color: '#888' },
  price: { fontSize: 14, fontWeight: '600' },
  stock: { fontSize: 12, color: '#888' },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#1976d2',
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  fabText: { color: '#fff', fontSize: 28 },

  refreshBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: '#4caf50',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});