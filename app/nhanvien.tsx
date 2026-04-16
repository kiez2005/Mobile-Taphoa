import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// =============================================
// ⚙️ CẤU HÌNH API
// =============================================
const BASE_URL = 'http://172.20.10.2/cuahangtaphoa';
const API_ENDPOINT = `${BASE_URL}/NhanVien/GetAll`;

// =============================================
// 📦 Types
// =============================================
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

// =============================================
// 🔄 Hàm gọi API
// =============================================
async function fetchEmployees(): Promise<Employee[]> {
  const response = await fetch(API_ENDPOINT, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Lỗi server: ${response.status}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.message ?? 'Lỗi không xác định');
  }

  const list: any[] = json.data ?? [];

  return list.map((item: any) => ({
    id:       String(item.id),
    name:     item.name     ?? '—',
    code:     item.code     ?? '',
    phone:    item.phone    ?? '',
    address:  item.address  ?? '',
    username: item.username ?? '',
    role:     item.role     ?? 0,
    status:   item.status   ?? false,
  }));
}

// =============================================
// 🧩 Avatar
// =============================================
function Avatar() {
  return (
    <View style={styles.avatar}>
      <Ionicons name="person" size={22} color="#4A90D9" />
    </View>
  );
}

// =============================================
// 🧩 Employee Item
// =============================================
function EmployeeItem({ item }: { item: Employee }) {
  return (
    <TouchableOpacity style={styles.employeeItem} activeOpacity={0.6}>
      <Avatar />
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <Text style={styles.employeeCode}>{item.code}</Text>
        {item.phone ? (
          <Text style={styles.employeePhone}>
            <Ionicons name="call-outline" size={11} color="#8A8A8E" /> {item.phone}
          </Text>
        ) : null}
      </View>
      <View style={styles.rightCol}>
        <View style={[styles.statusBadge, item.status ? styles.statusActive : styles.statusInactive]}>
          <Text style={[styles.statusText, item.status ? styles.statusActiveText : styles.statusInactiveText]}>
            {item.status ? 'Đang làm' : 'Nghỉ việc'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#C7C7CC" style={{ marginTop: 6 }} />
      </View>
    </TouchableOpacity>
  );
}

// =============================================
// 🧩 Empty State
// =============================================
function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centered}>
      <Ionicons name="people-outline" size={52} color="#C7C7CC" />
      <Text style={styles.emptyText}>Không có nhân viên nào</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>Tải lại</Text>
      </TouchableOpacity>
    </View>
  );
}

// =============================================
// 🧩 Error State
// =============================================
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.centered}>
      <Ionicons name="cloud-offline-outline" size={52} color="#FF3B30" />
      <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
      <Text style={styles.errorDetail}>{message}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
}

// =============================================
// 📱 Main Screen
// =============================================
export default function EmployeeScreen({ navigation }: any) {
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [filtered, setFiltered]     = useState<Employee[]>([]);
  const [filter, setFilter]         = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Gọi API ──
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else { setLoading(true); setError(null); }

      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err: any) {
      const msg = err?.message ?? 'Lỗi không xác định';
      setError(msg);
      if (isRefresh) Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filter ──
  useEffect(() => {
    if (filter === 'all')      setFiltered(employees);
    else if (filter === 'active')   setFiltered(employees.filter(e => e.status));
    else if (filter === 'inactive') setFiltered(employees.filter(e => !e.status));
  }, [employees, filter]);

  // ── Render nội dung ──
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2979FF" />
          <Text style={styles.loadingText}>Đang tải nhân viên...</Text>
        </View>
      );
    }
    if (error) {
      return <ErrorState message={error} onRetry={() => loadData()} />;
    }
    if (filtered.length === 0) {
      return <EmptyState onRetry={() => loadData()} />;
    }
    return (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor="#2979FF"
          />
        }
        ListHeaderComponent={
          <Text style={styles.sectionLabel}>{filtered.length} NHÂN VIÊN</Text>
        }
        renderItem={({ item, index }) => (
          <View style={styles.listCard}>
            <EmployeeItem item={item} />
            {index < filtered.length - 1 && <View style={styles.separator} />}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.headerBack}
      >
        <Ionicons name="chevron-back" size={24} color="#007AFF" />
      </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhân viên</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search-outline" size={22} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => loadData()}>
            <Ionicons name="refresh-outline" size={22} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterIconBtn}>
          <Ionicons name="options-outline" size={18} color="#555" />
        </TouchableOpacity>
        {(['all', 'active', 'inactive'] as const).map((f) => {
          const label = f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang làm việc' : 'Nghỉ việc';
          const active = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => router.push('/addnhanvien')} 
>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// =============================================
// 🎨 Styles
// =============================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 8, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0',
  },
  headerBack:    { padding: 4 },
  headerTitle:   { flex: 1, fontSize: 17, fontWeight: '600', color: '#000', marginLeft: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn:       { padding: 6, marginLeft: 4 },

  // Filter
  filterBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0',
  },
  filterIconBtn:       { padding: 4 },
  filterChip:          { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#fff' },
  filterChipActive:    { backgroundColor: '#2979FF', borderColor: '#2979FF' },
  filterChipText:      { fontSize: 13, color: '#333' },
  filterChipTextActive:{ fontSize: 13, color: '#fff', fontWeight: '600' },

  // Content
  content:      { flex: 1 },
  listContent:  { paddingTop: 12, paddingBottom: 100 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#8A8A8E', letterSpacing: 0.4, paddingHorizontal: 20, marginBottom: 8, textTransform: 'uppercase' },
  listCard:     { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 12, overflow: 'hidden', marginBottom: 1 },

  // Employee item
  employeeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16 },
  avatar:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#D6E8F8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  employeeInfo: { flex: 1 },
  employeeName: { fontSize: 15, fontWeight: '500', color: '#111' },
  employeeCode: { fontSize: 13, color: '#8A8A8E', marginTop: 2 },
  employeePhone:{ fontSize: 12, color: '#8A8A8E', marginTop: 2 },
  rightCol:     { alignItems: 'flex-end' },

  // Status badge
  statusBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusActive:       { backgroundColor: '#E8F5E9' },
  statusInactive:     { backgroundColor: '#FFEBEE' },
  statusText:         { fontSize: 11, fontWeight: '600' },
  statusActiveText:   { color: '#2E7D32' },
  statusInactiveText: { color: '#C62828' },

  separator: { height: 0.5, backgroundColor: '#E5E5EA', marginLeft: 68 },

  // States
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#8A8A8E' },
  emptyText:   { marginTop: 12, fontSize: 15, color: '#8A8A8E' },
  errorTitle:  { marginTop: 12, fontSize: 15, fontWeight: '600', color: '#FF3B30' },
  errorDetail: { marginTop: 4, fontSize: 13, color: '#8A8A8E', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:    { marginTop: 16, backgroundColor: '#2979FF', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryBtnText:{ color: '#fff', fontSize: 14, fontWeight: '600' },

  // FAB
  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#2979FF', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#2979FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
});