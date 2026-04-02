// app/(tabs)/baocao.tsx
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');

const C = {
  blue: '#1565c0',
  blueMid: '#4285f4',
  blueLight: '#e8f0fe',
  orange: '#f57c00',
  orangeLight: '#fff3e0',
  green: '#2e7d32',
  greenLight: '#e8f5e9',
  red: '#c62828',
  purple: '#6a1b9a',
  purpleLight: '#f3e5f5',
  border: '#e8eaed',
  bg: '#f1f3f4',
  text: '#202124',
  muted: '#5f6368',
  white: '#ffffff',
};

export default function BaoCaoScreen() {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [filterType, setFilterType] = useState<'today' | 'yesterday' | 'week' | 'month'>('month');

  const chartData = {
    labels: ['03/04', '04/04', '05/04', '06/04', '07/04', '08/04', '09/04'],
    datasets: [{ data: [12400000, 18500000, 9200000, 23700000, 16800000, 29400000, 21500000] }],
  };

  const stats = {
    doanhThu: 48750000,
    soHoaDon: 142,
    tongNhap: 32500000,
    loiNhuan: 16250000,
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
    labelColor: () => C.muted,
    style: { borderRadius: 12 },
    propsForDots: { r: '5', strokeWidth: '2', stroke: '#4285f4' },
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <Text style={styles.filterLabel}>📅 Lọc theo ngày:</Text>
          
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Từ</Text>
            <TextInput style={styles.dateInput} value="2026-04-01" />
            <Text style={styles.dateLabel}>Đến</Text>
            <TextInput style={styles.dateInput} value="2026-04-09" />
          </View>

          <View style={styles.quickFilters}>
            {[
              { key: 'today', label: 'Hôm nay' },
              { key: 'yesterday', label: 'Hôm qua' },
              { key: 'week', label: '7 ngày' },
              { key: 'month', label: 'Tháng này' },
            ].map(item => (
              <TouchableOpacity
                key={item.key}
                style={[styles.quickBtn, filterType === item.key && styles.quickBtnActive]}
                onPress={() => setFilterType(item.key as any)}
              >
                <Text style={styles.quickBtnText}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.applyBtn}>
            <Text style={{ color: 'white', fontWeight: '600' }}>🔄 Cập nhật báo cáo</Text>
          </TouchableOpacity>
        </View>

        {/* Stat Cards */}
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: C.blueLight }]}><Text style={{fontSize:26}}>📈</Text></View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Doanh thu</Text>
              <Text style={styles.statValue}>{stats.doanhThu.toLocaleString('vi-VN')} ₫</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: C.greenLight }]}><Text style={{fontSize:26}}>🧾</Text></View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Số hóa đơn</Text>
              <Text style={styles.statValue}>{stats.soHoaDon}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: C.orangeLight }]}><Text style={{fontSize:26}}>📦</Text></View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Nhập hàng</Text>
              <Text style={styles.statValue}>{stats.tongNhap.toLocaleString('vi-VN')} ₫</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: C.purpleLight }]}><Text style={{fontSize:26}}>💰</Text></View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Lợi nhuận</Text>
              <Text style={[styles.statValue, {color: C.green}]}>{stats.loiNhuan.toLocaleString('vi-VN')} ₫</Text>
            </View>
          </View>
        </View>

        {/* Biểu đồ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📊 Doanh thu theo ngày</Text>
            
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity 
                style={[styles.chartTypeBtn, chartType === 'bar' && styles.chartTypeActive]}
                onPress={() => setChartType('bar')}
              >
                <Text style={{fontSize:12}}>Cột</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.chartTypeBtn, chartType === 'line' && styles.chartTypeActive]}
                onPress={() => setChartType('line')}
              >
                <Text style={{fontSize:12}}>Đường</Text>
              </TouchableOpacity>
            </View>
          </View>

          {chartType === 'bar' ? (
            <BarChart
              data={chartData}
              width={SW - 48}
              height={220}
              yAxisLabel=""
              yAxisSuffix="k"
              chartConfig={chartConfig}
              style={{ borderRadius: 12, marginVertical: 8 }}
              showValuesOnTopOfBars
              fromZero
            />
          ) : (
            <LineChart
              data={chartData}
              width={SW - 48}
              height={220}
              yAxisLabel=""
              yAxisSuffix="k"
              chartConfig={chartConfig}
              style={{ borderRadius: 12, marginVertical: 8 }}
              bezier
              fromZero
            />
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  filterBar: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  filterLabel: { fontSize: 13.5, fontWeight: '600', color: C.muted },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateLabel: { fontSize: 13, color: C.muted },
  dateInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 36,
    fontSize: 13,
    width: 110,
  },

  quickFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  quickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  quickBtnActive: {
    backgroundColor: C.blueLight,
    borderColor: C.blueMid,
  },
  quickBtnText: { fontSize: 12.5, color: C.muted },

  applyBtn: {
    backgroundColor: C.blue,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },

  statGrid: { gap: 12, marginBottom: 16 },
  statCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statIcon: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 12.5, color: C.muted },
  statValue: { fontSize: 19.5, fontWeight: '700', marginTop: 2 },

  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.text },

  chartTypeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  chartTypeActive: {
    backgroundColor: C.blueLight,
    borderColor: C.blueMid,
  },
});