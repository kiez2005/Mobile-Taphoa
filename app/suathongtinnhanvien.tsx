import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_URL = 'http://taphoacuakien.runasp.net';

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

export default function SuaThongTinNhanVien() {
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showJob, setShowJob] = useState(false);
  const [showPersonal, setShowPersonal] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState(2);
  const [status, setStatus] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${BASE_URL}/NhanVien/GetById?id=${id}`);
        const json = await res.json();

        if (json.success) {
          const d: Employee = json.data;
          setName(d.name);
          setCode(d.code);
          setPhone(d.phone);
          setAddress(d.address);
          setUsername(d.username);
          setRole(d.role);
          setStatus(d.status);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhân viên');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        MaNguoiDung: Number(id),
        HoTen: name,
        SoDienThoai: phone,
        DiaChi: address,
        TenDangNhap: username,
        MaVaiTro: role,
        TrangThai: status,
      };

      console.log('URL:', `${BASE_URL}/NhanVien/Edit`);  
      console.log('Payload:', JSON.stringify(payload));   

      const res = await fetch(`${BASE_URL}/NhanVien/Edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },  // ← đổi lại
          body: JSON.stringify(payload),
      });

      console.log('Status:', res.status);
      const text = await res.text();
      console.log('Response:', text);
      const json = JSON.parse(text);

      if (json.success) {
        Alert.alert('Thành công', 'Cập nhật nhân viên thành công', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Lỗi', json.message ?? 'Cập nhật thất bại');
      }
    } catch (err) {
      const error = err as any;
      console.log('Lỗi name:', error?.name);
      console.log('Lỗi message:', error?.message);
      console.log('Lỗi full:', JSON.stringify(error));
      Alert.alert('Lỗi', error?.message ?? 'Không thể kết nối server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>  
        <ActivityIndicator size="large" color="#2979FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Sửa thông tin nhân viên</Text>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar (chỉ icon) */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={44} color="#4A90D9" />
          </View>
        </View>

        {/* BASIC INFO */}
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Tên nhân viên"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.separator} />

          <TextInput
            style={[styles.input, { color: '#999' }]}
            value={code}
            editable={false}
            placeholder="Mã nhân viên"
          />

          <View style={styles.separator} />

          <TextInput
            style={styles.input}
            placeholder="Số điện thoại"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* JOB */}
        <TouchableOpacity
          style={styles.expandRow}
          onPress={() => setShowJob(!showJob)}
        >
          <Text style={styles.expandText}>Thêm thông tin công việc</Text>
          <Ionicons name={showJob ? 'chevron-up' : 'chevron-down'} size={18} color="#007AFF" />
        </TouchableOpacity>

        {showJob && (
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Tên đăng nhập"
              value={username}
              onChangeText={setUsername}
            />

            <View style={styles.separator} />

            <View style={styles.row}>
              <Text style={styles.label}>Chức vụ</Text>
              <View style={styles.chips}>
                <TouchableOpacity
                  style={[styles.chip, role === 2 && styles.chipActive]}
                  onPress={() => setRole(2)}
                >
                  <Text style={[styles.chipText, role === 2 && styles.chipTextActive]}>
                    Nhân viên
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, role === 1 && styles.chipActive]}
                  onPress={() => setRole(1)}
                >
                  <Text style={[styles.chipText, role === 1 && styles.chipTextActive]}>
                    Quản lý
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.row}>
              <Text style={styles.label}>Trạng thái</Text>
              <View style={styles.chips}>
                <TouchableOpacity
                  style={[styles.chip, status && styles.chipActive]}
                  onPress={() => setStatus(true)}
                >
                  <Text style={[styles.chipText, status && styles.chipTextActive]}>
                    Đang làm
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, !status && styles.chipActive]}
                  onPress={() => setStatus(false)}
                >
                  <Text style={[styles.chipText, !status && styles.chipTextActive]}>
                    Nghỉ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* PERSONAL */}
        <TouchableOpacity
          style={styles.expandRow}
          onPress={() => setShowPersonal(!showPersonal)}
        >
          <Text style={styles.expandText}>Thông tin cá nhân</Text>
          <Ionicons name={showPersonal ? 'chevron-up' : 'chevron-down'} size={18} color="#007AFF" />
        </TouchableOpacity>

        {showPersonal && (
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Địa chỉ"
              value={address}
              onChangeText={setAddress}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingTop: 8,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: {
    paddingBottom: 80,
    paddingTop: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },

  closeBtn: { padding: 4, marginRight: 8 },

  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },

  saveBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },

  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: 18,
  },

  avatarCircle: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: '#D6E8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  inputGroup: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
  },

  input: {
    padding: 14,
    fontSize: 15,
  },

  separator: {
    height: 0.5,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },

  expandRow: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  expandText: {
    color: '#007AFF',
    fontWeight: '500',
  },

  row: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },

  label: {
    width: 80,
    color: '#888',
  },

  chips: {
    flexDirection: 'row',
    gap: 8,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  chipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  chipText: {
    fontSize: 13,
  },

  chipTextActive: {
    color: '#fff',
  },
});