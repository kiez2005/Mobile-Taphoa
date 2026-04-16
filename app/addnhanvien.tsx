import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// =============================================
// ⚙️ CẤU HÌNH API
// =============================================
const BASE_URL = 'http://172.20.10.2/cuahangtaphoa';

// =============================================
// 🔄 Hàm gọi API tạo nhân viên
// =============================================
async function createEmployee(data: {
  HoTen: string;
  SoDienThoai: string;
  DiaChi: string;
  TenDangNhap: string;
  MatKhau: string;
  MaVaiTro: number;
  TrangThai: boolean;
}) {
  const response = await fetch(`${BASE_URL}/NhanVien/Create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);

  const json = await response.json();
  if (!json.success) throw new Error(json.message ?? 'Tạo thất bại');
  return json;
}

// =============================================
// 📱 Main Screen
// =============================================
export default function CreateEmployeeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [showJobInfo, setShowJobInfo]      = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);

  // Form fields
  const [hoTen, setHoTen]           = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [diaChi, setDiaChi]         = useState('');
  const [tenDangNhap, setTenDangNhap] = useState('');
  const [matKhau, setMatKhau]       = useState('');
  const [maVaiTro, setMaVaiTro]     = useState<1 | 2>(2); // 1=Admin, 2=NV
  const [trangThai, setTrangThai]   = useState(true);
  const [showPass, setShowPass]     = useState(false);

  // ── Validate ──
  const validate = () => {
    if (!hoTen.trim()) {
      Alert.alert('Lỗi', 'Họ tên không được để trống'); return false;
    }
    if (!soDienThoai.trim()) {
      Alert.alert('Lỗi', 'Số điện thoại không được để trống'); return false;
    }
    if (!tenDangNhap.trim()) {
      Alert.alert('Lỗi', 'Tên đăng nhập không được để trống'); return false;
    }
    if (!matKhau.trim()) {
      Alert.alert('Lỗi', 'Mật khẩu không được để trống'); return false;
    }
    return true;
  };

  // ── Submit ──
  const handleSave = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await createEmployee({
        HoTen: hoTen.trim(),
        SoDienThoai: soDienThoai.trim(),
        DiaChi: diaChi.trim(),
        TenDangNhap: tenDangNhap.trim(),
        MatKhau: matKhau.trim(),
        MaVaiTro: maVaiTro,
        TrangThai: trangThai,
      });
      Alert.alert('Thành công', 'Thêm nhân viên thành công', [
        { text: 'OK', onPress: () => navigation?.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message ?? 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerClose}>
          <Ionicons name="close" size={22} color="#555" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo mới nhân viên</Text>
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveBtnText}>Lưu</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Thông tin cơ bản ── */}
          <View style={styles.card}>
            <InputField
              placeholder="Họ tên nhân viên*"
              value={hoTen}
              onChangeText={setHoTen}
              icon="person-outline"
            />
            <Divider />
            <View style={styles.inputRow}>
              <Ionicons name="card-outline" size={18} color="#C7C7CC" style={styles.inputIcon} />
              <Text style={styles.autoCodeText}>Mã nhân viên (Mã tự động)</Text>
            </View>
            <Divider />
            <InputField
              placeholder="Số điện thoại*"
              value={soDienThoai}
              onChangeText={setSoDienThoai}
              icon="call-outline"
              keyboardType="phone-pad"
            />
          </View>

          {/* ── Thông tin công việc ── */}
          <TouchableOpacity
            style={styles.sectionToggle}
            onPress={() => setShowJobInfo(v => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionToggleText}>Thêm thông tin công việc</Text>
            <Ionicons
              name={showJobInfo ? 'chevron-up' : 'chevron-down'}
              size={16} color="#2979FF"
            />
          </TouchableOpacity>

          {showJobInfo && (
            <View style={styles.card}>
              {/* Vai trò */}
              <Text style={styles.fieldLabel}>Vai trò</Text>
              <View style={styles.roleRow}>
                {([{ label: 'Nhân viên', value: 2 }, { label: 'Quản lý', value: 1 }] as const).map(r => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.roleChip, maVaiTro === r.value && styles.roleChipActive]}
                    onPress={() => setMaVaiTro(r.value)}
                  >
                    <Text style={[styles.roleChipText, maVaiTro === r.value && styles.roleChipTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Divider />
              {/* Trạng thái */}
              <Text style={styles.fieldLabel}>Trạng thái</Text>
              <View style={styles.roleRow}>
                {([{ label: 'Đang làm việc', value: true }, { label: 'Nghỉ việc', value: false }] as const).map(s => (
                  <TouchableOpacity
                    key={String(s.value)}
                    style={[styles.roleChip, trangThai === s.value && styles.roleChipActive]}
                    onPress={() => setTrangThai(s.value)}
                  >
                    <Text style={[styles.roleChipText, trangThai === s.value && styles.roleChipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Thông tin cá nhân & liên hệ ── */}
          <TouchableOpacity
            style={styles.sectionToggle}
            onPress={() => setShowPersonalInfo(v => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionToggleText}>Thêm thông tin cá nhân và liên hệ</Text>
            <Ionicons
              name={showPersonalInfo ? 'chevron-up' : 'chevron-down'}
              size={16} color="#2979FF"
            />
          </TouchableOpacity>

          {showPersonalInfo && (
            <View style={styles.card}>
              <InputField
                placeholder="Địa chỉ"
                value={diaChi}
                onChangeText={setDiaChi}
                icon="location-outline"
              />
              <Divider />
              <InputField
                placeholder="Tên đăng nhập*"
                value={tenDangNhap}
                onChangeText={setTenDangNhap}
                icon="at-outline"
                autoCapitalize="none"
              />
              <Divider />
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#C7C7CC" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu*"
                  placeholderTextColor="#C7C7CC"
                  value={matKhau}
                  onChangeText={setMatKhau}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ padding: 4 }}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#C7C7CC" />
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =============================================
// 🧩 Sub-components
// =============================================
function InputField({
  placeholder, value, onChangeText, icon, keyboardType, autoCapitalize,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  icon: any;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={18} color="#C7C7CC" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#C7C7CC"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// =============================================
// 🎨 Styles
// =============================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0',
  },
  headerClose:  { padding: 4 },
  headerTitle:  { flex: 1, fontSize: 17, fontWeight: '600', color: '#000', marginLeft: 8 },
  saveBtn:      { backgroundColor: '#2979FF', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, minWidth: 56, alignItems: 'center' },
  saveBtnText:  { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    paddingHorizontal: 16,
  },

  // Input
  inputRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  inputIcon:  { marginRight: 10 },
  input:      { flex: 1, fontSize: 15, color: '#111' },
  autoCodeText: { flex: 1, fontSize: 15, color: '#C7C7CC' },
  divider:    { height: 0.5, backgroundColor: '#E5E5EA', marginLeft: 28 },

  // Section toggle
  sectionToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  sectionToggleText: { fontSize: 15, color: '#2979FF', fontWeight: '500' },

  // Field label
  fieldLabel: { fontSize: 12, color: '#8A8A8E', fontWeight: '600', marginTop: 14, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Role chips
  roleRow:          { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  roleChip:         { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, backgroundColor: '#F2F2F7' },
  roleChipActive:   { backgroundColor: '#2979FF', borderColor: '#2979FF' },
  roleChipText:     { fontSize: 13, color: '#555' },
  roleChipTextActive:{ fontSize: 13, color: '#fff', fontWeight: '600' },
});