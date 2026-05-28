import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,SafeAreaView,
  TouchableOpacity, ScrollView, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

const BASE_URL = 'http://172.20.10.5/cuahangtaphoa';

type Employee = {
  id: string;
  name: string;
  code: string;
  phone: string;
  address: string;
  username: string;
  role: number;
  status: boolean;
};

export default function ThongTinNhanVien() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${BASE_URL}/NhanVien/GetById?id=${id}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2979FF" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Không tìm thấy nhân viên</Text>
      </View>
    );
  }

  const roleLabel = data.role === 1 ? 'Quản lý' : 'Nhân viên';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết nhân viên</Text>

      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={38} color="#4A90D9" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{data.name}</Text>
            <Text style={styles.profileCode}>{data.code}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push(`/suathongtinnhanvien?id=${data.id}`)}
            >
            <Text style={styles.editBtnText}>Sửa</Text>
          </TouchableOpacity>
        </View>

        {/* Info rows */}
        <View style={styles.section}>
          {/* Số điện thoại */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Số điện thoại</Text>
              <Text style={styles.rowValue}>{data.phone || '—'}</Text>
            </View>
            {data.phone ? (
              <TouchableOpacity
                style={styles.actionCircle}
                onPress={() => Linking.openURL(`tel:${data.phone}`)}
              >
                <Ionicons name="call-outline" size={20} color="#333" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.divider} />

          {/* Địa chỉ */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Địa chỉ</Text>
              <Text style={styles.rowValue}>{data.address || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Tài khoản */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Tài khoản</Text>
              <Text style={styles.rowValue}>{data.username || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Chức vụ */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Chức vụ</Text>
              <Text style={styles.rowValue}>{roleLabel}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Trạng thái */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Trạng thái</Text>
              <Text style={[
                styles.rowValue,
                { color: data.status ? '#2E7D32' : '#C62828', fontWeight: '600' }
              ]}>
                {data.status ? 'Đang làm việc' : 'Nghỉ việc'}
              </Text>
            </View>
            <View style={[
              styles.statusDot,
              { backgroundColor: data.status ? '#4CAF50' : '#EF5350' }
            ]} />
          </View>
        </View>
      </ScrollView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  center:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 15, color: '#8A8A8E' },
  scroll:   { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0',
  },
  backBtn:     { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: '#000', marginLeft: 4 },
  moreBtn:     { padding: 6 },

  // Profile card
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 20,
    borderRadius: 14, padding: 16,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#D6E8F8',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 4 },
  profileCode: { fontSize: 14, color: '#8A8A8E' },
  editBtn:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { fontSize: 16, color: '#007AFF', fontWeight: '500' },

  // Section
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 20,
    borderRadius: 14,
    paddingHorizontal: 16,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
  },
  rowLeft:  { flex: 1 },
  rowLabel: { fontSize: 13, color: '#8A8A8E', marginBottom: 4 },
  rowValue: { fontSize: 16, fontWeight: '600', color: '#111' },
  divider:  { height: 0.5, backgroundColor: '#E5E5EA' },

  // Call button
  actionCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center',
  },

  // Status dot
  statusDot: {
    width: 10, height: 10, borderRadius: 5,
  },
});