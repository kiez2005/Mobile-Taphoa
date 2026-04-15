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

const API_URL = "http://172.20.10.2/cuahangtaphoa/HangHoa/GetHangHoa";

export default function HangHoaScreen() {
  const [data, setData] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const json = await res.json();
      console.log('API DATA:', json);

      const formatted = json.data.map((item: any) => ({
        id: item.id?.toString(),
        name: item.tenHang || 'Không tên',
        code: item.maHang || '',
        price: Number(item.giaBan) || 0,
        stock: Number(item.soLuongTon) || 0,
        image: item.hinhAnh
          ? `http://172.20.10.2/cuahangtaphoa${item.hinhAnh}`
          : 'https://via.placeholder.com/50',
      }));

      setData(formatted);
    } catch (err) {
      console.log('Lỗi API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = data.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        {!showSearch ? (
          <>
            <Text style={styles.title}>Hàng hoá</Text>
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <TouchableOpacity onPress={() => setShowSearch(true)}>
                <Text style={{ fontSize: 20 }}>🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={fetchData}>
                <Text style={{ fontSize: 20 }}>🔄</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={{ flexDirection: 'row', flex: 1 }}>
            <TextInput
              placeholder="Tìm hàng hoá..."
              value={search}
              onChangeText={setSearch}
              autoFocus
              style={styles.searchHeader}
            />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearch(''); }}>
              <Text style={{ marginLeft: 10 }}>❌</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* FILTER */}
      <View style={styles.filterRow}>
        <View style={styles.filterBtn}><Text>Tất cả loại hàng ▼</Text></View>
        <View style={styles.filterBtn}><Text>Giá bán ▼</Text></View>
      </View>

      {/* SUMMARY */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Tổng tồn</Text>
        <Text style={styles.summaryValue}>
          {filtered.reduce((sum, i) => sum + i.stock, 0)}
        </Text>
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
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

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
  },
  title: { fontSize: 22, fontWeight: '700' },
  searchHeader: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: '#ddd',
  },
  filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  filterBtn: { backgroundColor: '#e0e0e0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  summary: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#fff', marginHorizontal: 16,
    padding: 12, borderRadius: 10, marginBottom: 10,
  },
  summaryText: { fontSize: 14 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16,
    padding: 12, borderRadius: 10, marginBottom: 10,
  },
  img: { width: 50, height: 50, borderRadius: 8, marginRight: 10 },
  name: { fontSize: 14, fontWeight: '600' },
  code: { fontSize: 12, color: '#888' },
  price: { fontSize: 14, fontWeight: '600' },
  stock: { fontSize: 12, color: '#888' },
  fab: {
    position: 'absolute', bottom: 30, right: 20,
    backgroundColor: '#1976d2', width: 55, height: 55,
    borderRadius: 30, justifyContent: 'center', alignItems: 'center',
  },
  fabText: { color: '#fff', fontSize: 28 },
});