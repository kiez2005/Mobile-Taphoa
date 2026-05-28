import React, { useState, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

// =============================================
// ⚙️ CẤU HÌNH API
// =============================================
const BASE_URL = 'http://172.20.10.5/cuahangtaphoa';

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
// 🧩 Types
// =============================================
type FormErrors = {
  hoTen?: string;
  soDienThoai?: string;
  tenDangNhap?: string;
  matKhau?: string;
};

// =============================================
// 🧩 Animated Input Field
// =============================================
function InputField({
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  error,
  rightElement,
  onFocus,
  onBlur,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  icon: any;
  keyboardType?: any;
  autoCapitalize?: any;
  secureTextEntry?: boolean;
  error?: string;
  rightElement?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? '#FF3B30' : '#E5E5EA', error ? '#FF3B30' : '#2979FF'],
  });

  return (
    <View style={fieldStyles.wrapper}>
      <Animated.View
        style={[
          fieldStyles.container,
          { borderColor },
          error && fieldStyles.containerError,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={focused ? '#2979FF' : error ? '#FF3B30' : '#AEAEB2'}
          style={fieldStyles.icon}
        />
        <TextInput
          style={fieldStyles.input}
          placeholder={placeholder}
          placeholderTextColor="#C7C7CC"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'words'}
          secureTextEntry={secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {rightElement}
      </Animated.View>
      {error ? (
        <View style={fieldStyles.errorRow}>
          <Ionicons name="alert-circle" size={13} color="#FF3B30" />
          <Text style={fieldStyles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  containerError: {},
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, marginLeft: 4, gap: 4 },
  errorText: { fontSize: 12, color: '#FF3B30', flex: 1 },
});

// =============================================
// 🧩 Section Card
// =============================================
function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={sectionStyles.card}>{children}</View>;
}

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F9FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBEBF0',
    marginBottom: 4,
  },
});

// =============================================
// 🧩 Collapsible Section
// =============================================
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.spring(rotateAnim, { toValue, useNativeDriver: true, tension: 120, friction: 8 }).start();
    setOpen(v => !v);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={colStyles.wrapper}>
      <TouchableOpacity style={colStyles.header} onPress={toggle} activeOpacity={0.7}>
        <View style={colStyles.headerLeft}>
          <View style={colStyles.iconBox}>
            <Ionicons name={icon} size={16} color="#2979FF" />
          </View>
          <Text style={colStyles.title}>{title}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={16} color="#2979FF" />
        </Animated.View>
      </TouchableOpacity>
      {open && <View style={colStyles.body}>{children}</View>}
    </View>
  );
}

const colStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBEBF0',
    marginBottom: 12,
    shadowColor: '#2979FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, color: '#1A1A2E', fontWeight: '600' },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
    paddingTop: 16,
  },
});

// =============================================
// 🧩 Chip Selector
// =============================================
function ChipSelector<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T; icon?: any; color?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={chipStyles.wrapper}>
      <Text style={chipStyles.label}>{label}</Text>
      <View style={chipStyles.row}>
        {options.map((opt, i) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={i}
              style={[
                chipStyles.chip,
                active && { backgroundColor: opt.color ?? '#2979FF', borderColor: opt.color ?? '#2979FF' },
              ]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.8}
            >
              {opt.icon && (
                <Ionicons
                  name={opt.icon}
                  size={14}
                  color={active ? '#fff' : '#888'}
                  style={{ marginRight: 5 }}
                />
              )}
              <Text style={[chipStyles.chipText, active && chipStyles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: {
    fontSize: 11,
    color: '#8A8A8E',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DDDDE0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F7',
  },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
});

// =============================================
// 📱 Main Screen
// =============================================
export default function CreateEmployeeScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form fields
  const [hoTen, setHoTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [tenDangNhap, setTenDangNhap] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [maVaiTro, setMaVaiTro] = useState<1 | 2>(2);
  const [trangThai, setTrangThai] = useState(true);
  const [showPass, setShowPass] = useState(false);

  // ── Clear error on edit ──
  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // ── Validate ──
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!hoTen.trim()) {
      newErrors.hoTen = 'Họ tên không được để trống';
    } else if (hoTen.trim().length < 2) {
      newErrors.hoTen = 'Họ tên phải có ít nhất 2 ký tự';
    }

    if (!soDienThoai.trim()) {
      newErrors.soDienThoai = 'Số điện thoại không được để trống';
    } else if (!/^(0|\+84)[3-9]\d{8}$/.test(soDienThoai.trim())) {
      newErrors.soDienThoai = 'Số điện thoại không hợp lệ (VD: 0912345678)';
    }

    if (!tenDangNhap.trim()) {
      newErrors.tenDangNhap = 'Tên đăng nhập không được để trống';
    } else if (tenDangNhap.trim().length < 4) {
      newErrors.tenDangNhap = 'Tên đăng nhập phải có ít nhất 4 ký tự';
    } else if (!/^[a-zA-Z0-9_.]+$/.test(tenDangNhap.trim())) {
      newErrors.tenDangNhap = 'Chỉ dùng chữ, số, dấu . và _';
    }

    if (!matKhau.trim()) {
      newErrors.matKhau = 'Mật khẩu không được để trống';
    } else if (matKhau.trim().length < 6) {
      newErrors.matKhau = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      Alert.alert('✅ Thành công', 'Thêm nhân viên thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('❌ Lỗi', err?.message ?? 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tạo nhân viên</Text>
          <Text style={styles.headerSub}>Điền thông tin bên dưới</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.saveBtnText}>Lưu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Error Banner ── */}
      {hasErrors && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color="#FF3B30" />
          <Text style={styles.errorBannerText}>Vui lòng kiểm tra lại các trường bị lỗi</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Thông tin cơ bản ── */}
          <CollapsibleSection title="Thông tin cơ bản" icon="person-outline" defaultOpen>
            <InputField
              placeholder="Họ và tên *"
              value={hoTen}
              onChangeText={v => { setHoTen(v); clearError('hoTen'); }}
              icon="person-outline"
              error={errors.hoTen}
            />
            <InputField
              placeholder="Số điện thoại *"
              value={soDienThoai}
              onChangeText={v => { setSoDienThoai(v); clearError('soDienThoai'); }}
              icon="call-outline"
              keyboardType="phone-pad"
              autoCapitalize="none"
              error={errors.soDienThoai}
            />

            {/* Mã nhân viên (chỉ đọc) */}
            <View style={styles.autoCodeBox}>
              <Ionicons name="barcode-outline" size={18} color="#AEAEB2" style={{ marginRight: 10 }} />
              <Text style={styles.autoCodeText}>Mã nhân viên (tự động)</Text>
              <View style={styles.autoBadge}>
                <Text style={styles.autoBadgeText}>AUTO</Text>
              </View>
            </View>
          </CollapsibleSection>

          {/* ── Thông tin công việc ── */}
          <CollapsibleSection title="Thông tin công việc" icon="briefcase-outline">
            <ChipSelector
              label="Vai trò"
              value={maVaiTro}
              onChange={v => setMaVaiTro(v as 1 | 2)}
              options={[
                { label: 'Nhân viên', value: 2 as const, icon: 'person-outline', color: '#2979FF' },
                { label: 'Quản lý', value: 1 as const, icon: 'shield-checkmark-outline', color: '#FF6B35' },
              ]}
            />
            <ChipSelector
              label="Trạng thái"
              value={trangThai}
              onChange={v => setTrangThai(v as boolean)}
              options={[
                { label: 'Đang làm việc', value: true as const, icon: 'checkmark-circle-outline', color: '#34C759' },
                { label: 'Nghỉ việc', value: false as const, icon: 'close-circle-outline', color: '#FF3B30' },
              ]}
            />
          </CollapsibleSection>

          {/* ── Thông tin cá nhân & liên hệ ── */}
          <CollapsibleSection title="Tài khoản & Địa chỉ" icon="lock-closed-outline">
            <InputField
              placeholder="Địa chỉ"
              value={diaChi}
              onChangeText={setDiaChi}
              icon="location-outline"
            />
            <InputField
              placeholder="Tên đăng nhập *"
              value={tenDangNhap}
              onChangeText={v => { setTenDangNhap(v); clearError('tenDangNhap'); }}
              icon="at-outline"
              autoCapitalize="none"
              error={errors.tenDangNhap}
            />
            <InputField
              placeholder="Mật khẩu *"
              value={matKhau}
              onChangeText={v => { setMatKhau(v); clearError('matKhau'); }}
              icon="lock-closed-outline"
              autoCapitalize="none"
              secureTextEntry={!showPass}
              error={errors.matKhau}
              rightElement={
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ padding: 4 }}>
                  <Ionicons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#AEAEB2"
                  />
                </TouchableOpacity>
              }
            />
            {matKhau.length > 0 && (
              <PasswordStrength password={matKhau} />
            )}
          </CollapsibleSection>

          {/* ── Footer note ── */}
          <View style={styles.footerNote}>
            <Ionicons name="information-circle-outline" size={14} color="#AEAEB2" />
            <Text style={styles.footerNoteText}>
              Các trường có dấu * là bắt buộc nhập
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =============================================
// 🔐 Password Strength Indicator
// =============================================
function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const labels = ['', 'Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
  const colors = ['#E5E5EA', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF'];

  return (
    <View style={pwStyles.wrapper}>
      <View style={pwStyles.bars}>
        {[1, 2, 3, 4, 5].map(i => (
          <View
            key={i}
            style={[
              pwStyles.bar,
              { backgroundColor: i <= strength ? colors[strength] : '#E5E5EA' },
            ]}
          />
        ))}
      </View>
      <Text style={[pwStyles.label, { color: colors[strength] }]}>
        {labels[strength]}
      </Text>
    </View>
  );
}

const pwStyles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -4, marginBottom: 8 },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '600', minWidth: 60, textAlign: 'right' },
});

// =============================================
// 🎨 Main Styles
// =============================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F7' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  headerSub: { fontSize: 11, color: '#AEAEB2', marginTop: 1 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2979FF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 70,
    justifyContent: 'center',
    shadowColor: '#2979FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD5D2',
  },
  errorBannerText: { fontSize: 13, color: '#FF3B30', fontWeight: '500' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48, gap: 12 },

  // Auto code row
  autoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  autoCodeText: { flex: 1, fontSize: 15, color: '#C7C7CC' },
  autoBadge: {
    backgroundColor: '#E8F0FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  autoBadgeText: { fontSize: 10, color: '#2979FF', fontWeight: '800', letterSpacing: 0.5 },

  // Footer note
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
  },
  footerNoteText: { fontSize: 12, color: '#AEAEB2' },
});