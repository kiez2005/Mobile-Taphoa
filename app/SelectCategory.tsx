import React, { useEffect, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

declare global {
  var selectedCategory: { id: string; name: string } | null;
}

type Category = {
  MaDanhMuc: number;
  TenDanhMuc: string;
};

export default function SelectCategoryScreen() {
  const params = useLocalSearchParams<any>();

  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://172.20.10.5/cuahangtaphoa/HangHoa/GetDanhMuc');
      const json = await res.json();
      setData(json?.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const select = (item: Category) => {
    (global as any).selectedCategory = {
      id: item.MaDanhMuc.toString(),
      name: item.TenDanhMuc,
    };
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Danh mục</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.MaDanhMuc.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => select(item)}>
              <Text style={styles.itemText}>{item.TenDanhMuc}</Text>
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