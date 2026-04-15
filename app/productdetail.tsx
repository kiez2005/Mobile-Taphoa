import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

type ProductParams = {
  image?: string;
  name?: string;
  code?: string;
  barcode?: string;
  cost?: string;
  price?: string;
  group?: string;
  stock?: string;
};

export default function ProductDetail() {
  const item = useLocalSearchParams<ProductParams>();

  return (
    <ScrollView style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>THÔNG TIN CƠ BẢN</Text>

        <Image source={{ uri: item.image }} style={styles.image} />

        <Text style={styles.name}>{item.name}</Text>
      </View>

      {/* INFO GRID */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Mã hàng</Text>
            <Text style={styles.value}>{item.code}</Text>
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Mã vạch</Text>
            <Text style={styles.value}>{item.barcode}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Giá vốn</Text>
            <Text style={styles.value}>
              {Number(item.cost || 0).toLocaleString('vi-VN')}
            </Text>
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Giá bán</Text>
            <Text style={styles.value}>
              {Number(item.price || 0).toLocaleString('vi-VN')}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Nhóm hàng</Text>
            <Text style={styles.value}>{item.group}</Text>
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Tồn kho</Text>
            <Text style={styles.value}>{item.stock}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },

  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginBottom: 10,
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#fff',
    padding: 16,
  },

  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  col: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },

  value: {
    fontSize: 15,
    fontWeight: '600',
  },
});