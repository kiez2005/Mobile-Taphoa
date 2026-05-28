import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

declare global {
  var selectedSupplier: { id: string; name: string } | null;
}

type Supplier = {
  MaNhaCungCap: number;
  TenNhaCungCap: string;
};

export default function SelectSupplierScreen() {
  const params = useLocalSearchParams<any>();

  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://172.20.10.5/cuahangtaphoa/HangHoa/GetNhaCungCap');
      const json = await res.json();
      setData(json?.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const select = (item: Supplier) => {
    (global as any).selectedSupplier = {
      id: item.MaNhaCungCap.toString(),
      name: item.TenNhaCungCap,
    };
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Nhà cung cấp</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.MaNhaCungCap.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => select(item)}>
              <Text style={styles.itemText}>{item.TenNhaCungCap}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f2f2f2' },
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, paddingHorizontal: 16 },
  item: { padding: 12, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 8 },
  itemText: { color: '#000' },
});