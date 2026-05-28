import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";

import { router, useRouter } from "expo-router";

const BASE_URL = "http://172.20.10.5/cuahangtaphoa";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Supplier {
  id: number;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  date?: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "error";
  key: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseDate = (raw: string): string => {
  if (!raw) return "—";
  const m = /\/Date\((-?\d+)\)\//.exec(raw);
  if (m) return new Date(parseInt(m[1])).toLocaleDateString("vi-VN");
  return new Date(raw).toLocaleDateString("vi-VN");
};

const initials = (name = "") =>
  name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const AVATAR_COLORS: [string, string][] = [
  ["#EEF2FF", "#4F46E5"],
  ["#F0FDF4", "#16A34A"],
  ["#FFF7ED", "#EA580C"],
  ["#FDF4FF", "#9333EA"],
  ["#F0F9FF", "#0284C7"],
];
const avatarColor = (id: number): [string, string] =>
  AVATAR_COLORS[id % AVATAR_COLORS.length];

// ─── Toast ─────────────────────────────────────────────────────────────────────
interface ToastProps {
  visible: boolean;
  message: string;
  type: "success" | "error";
}

function Toast({ visible, message, type }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [visible, message]);

  if (!visible) return null;
  return (
    <Animated.View
      style={[
        styles.toast,
        { opacity, backgroundColor: type === "success" ? "#16A34A" : "#DC2626" },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

// ─── Supplier Card ─────────────────────────────────────────────────────────────
interface SupplierCardProps {
  item: Supplier;
  onEdit: (item: Supplier) => void;
  onDelete: (item: Supplier) => void;
}

function SupplierCard({ item, onEdit, onDelete }: SupplierCardProps) {
  const [bg, fg] = avatarColor(item.id);
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={press} style={styles.cardInner}>
        {/* Avatar + Name */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: bg }]}>
            <Text style={[styles.avatarText, { color: fg }]}>{initials(item.name)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardCode}>{item.code}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit(item)}>
              <Text style={styles.iconBtnText}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: "#FEF2F2" }]}
              onPress={() => onDelete(item)}
            >
              <Text style={[styles.iconBtnText, { color: "#DC2626" }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info rows */}
        <View style={styles.cardBody}>
          <InfoRow icon="📞" value={item.phone} muted={false} />
          <InfoRow icon="✉" value={item.email} muted={false} />
          <InfoRow icon="📍" value={item.address} muted={false} />
          <InfoRow icon="📅" value={parseDate(item.date ?? "")} muted={true} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface InfoRowProps {
  icon: string;
  value?: string;
  muted: boolean;
}

function InfoRow({ icon, value, muted }: InfoRowProps) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text
        style={[styles.infoValue, muted && { color: "#9CA3AF" }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboard?: "default" | "phone-pad" | "email-address";
}

function Field({ label, value, onChange, placeholder, keyboard }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#D1D5DB"
        keyboardType={keyboard ?? "default"}
        autoCapitalize="none"
      />
    </View>
  );
}

// ─── Form Modal ────────────────────────────────────────────────────────────────
interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (form: FormData) => Promise<void>;
  initial: Supplier | null;
}

function FormModal({ visible, onClose, onSave, initial }: FormModalProps) {
  const [form, setForm] = useState<FormData>({ name: "", phone: "", email: "", address: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(
        initial
          ? {
              name: initial.name || "",
              phone: initial.phone || "",
              email: initial.email || "",
              address: initial.address || "",
            }
          : { name: "", phone: "", email: "", address: "" }
      );
    }
  }, [visible, initial]);

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert("Lỗi", "Tên nhà cung cấp không được để trống");
    if (!form.phone.trim()) return Alert.alert("Lỗi", "Số điện thoại không được để trống");
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>
            {initial ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp"}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Field
              label="Tên nhà cung cấp *"
              value={form.name}
              onChange={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="Nhập tên..."
            />
            <Field
              label="Số điện thoại *"
              value={form.phone}
              onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
              placeholder="0xxx..."
              keyboard="phone-pad"
            />
            <Field
              label="Email"
              value={form.email}
              onChange={(v) => setForm((p) => ({ ...p, email: v }))}
              placeholder="example@email.com"
              keyboard="email-address"
            />
            <Field
              label="Địa chỉ"
              value={form.address}
              onChange={(v) => setForm((p) => ({ ...p, address: v }))}
              placeholder="Số nhà, đường, quận..."
            />
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnSaveText}>{initial ? "Lưu thay đổi" : "Thêm mới"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function NhaCungCapScreen({ navigation }: { navigation?: any }) {
  
  const [data, setData] = useState<Supplier[]>([]);
  const [filtered, setFiltered] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "success",
    key: 0,
  });

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast((p) => ({ visible: true, message, type, key: p.key + 1 }));

  // Load
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/NhaCungCap/GetAll`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setFiltered(json.data);
      } else showToast(json.message || "Lỗi tải dữ liệu", "error");
    } catch {
      showToast("Không kết nối được server", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  // Search
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? data.filter(
          
            (x) =>
              (x.name || "").toLowerCase().includes(q) ||
              (x.phone || "").includes(q) ||
              (x.email || "").toLowerCase().includes(q)
          )
        : data
    );
  }, [search, data]);

  // Save
  const handleSave = async (form: FormData) => {
    const payload = {
      TenNhaCungCap: form.name,
      SoDienThoai: form.phone,
      Email: form.email,
      DiaChi: form.address,
      ...(editItem ? { MaNhaCungCap: editItem.id } : {}),
    };
    try {
      const res = await fetch(`${BASE_URL}/NhaCungCap/${editItem ? "Edit" : "Create"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Thành công");
        setModalVisible(false);
        loadData(true);
      } else showToast(json.message || "Có lỗi xảy ra", "error");
    } catch {
      showToast("Lỗi kết nối", "error");
    }
  };

  // Delete
  const handleDelete = (item: Supplier) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa "${item.name}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/NhaCungCap/DeleteMultiple`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([item.id]),
              });
              const json = await res.json();
              if (json.success) {
                showToast("Đã xóa thành công");
                loadData(true);
              } else showToast(json.message || "Lỗi xóa", "error");
            } catch {
              showToast("Lỗi kết nối", "error");
            }
          },
        },
      ]
    );
  };

  const openCreate = () => { setEditItem(null); setModalVisible(true); };
  const openEdit = (item: Supplier) => { setEditItem(item); setModalVisible(true); };

  // Stats
  const statEmail = data.filter((x) => x.email).length;
  const statAddr = data.filter((x) => x.address).length;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        {/* Nút Back */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nhà Cung Cấp</Text>
          <Text style={styles.headerSub}>{data.length} nhà cung cấp</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Tổng số" value={data.length} color="#4F46E5" bg="#EEF2FF" />
        <StatCard label="Có email" value={statEmail} color="#16A34A" bg="#F0FDF4" />
        <StatCard label="Có địa chỉ" value={statAddr} color="#EA580C" bg="#FFF7ED" />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm theo tên, SĐT, email..."
          placeholderTextColor="#9CA3AF"
          clearButtonMode="while-editing"
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <SupplierCard item={item} onEdit={openEdit} onDelete={handleDelete} />
          )}
          contentContainerStyle={[styles.list, !filtered.length && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(); }}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 40 }}>📦</Text>
              <Text style={styles.emptyText}>
                {search ? "Không tìm thấy kết quả" : "Chưa có nhà cung cấp nào"}
              </Text>
              {!search && (
                <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
                  <Text style={styles.emptyBtnText}>Thêm ngay</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Form Modal */}
      <FormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        initial={editItem}
      />

      {/* Toast */}
      <Toast key={toast.key} visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  color: string;
  bg: string;
}

function StatCard({ label, value, color, bg }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 16 : 56,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111827", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  // Back button
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  backBtnText: {
    fontSize: 26,
    color: "#374151",
    fontWeight: "400",
    lineHeight: 30,
    marginTop: -2,
  },

  addBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  // Stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statVal: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2, fontWeight: "500" },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, height: 42, fontSize: 14, color: "#111827" },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardInner: { padding: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "700", fontSize: 14 },
  cardName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  cardCode: {
    fontSize: 11,
    color: "#4F46E5",
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  cardActions: { flexDirection: "row", gap: 6, marginLeft: 8 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: { fontSize: 13, color: "#374151" },
  cardBody: { borderTopWidth: 0.5, borderTopColor: "#F3F4F6", paddingTop: 10, gap: 5 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoIcon: { fontSize: 12, width: 20 },
  infoValue: { fontSize: 13, color: "#4B5563", flex: 1 },

  // Empty / Loading
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  loadingText: { color: "#9CA3AF", marginTop: 12, fontSize: 14 },
  emptyText: { fontSize: 15, color: "#9CA3AF", marginTop: 10 },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 20 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: "#6B7280", fontWeight: "500", marginBottom: 6 },
  fieldInput: {
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FAFAFA",
  },
  modalFooter: { flexDirection: "row", gap: 10, marginTop: 8 },
  btnCancel: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 13,
  },
  btnCancelText: { fontSize: 15, color: "#6B7280", fontWeight: "500" },
  btnSave: {
    flex: 2,
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 13,
  },
  btnSaveText: { fontSize: 15, color: "#fff", fontWeight: "600" },

  // Toast
  toast: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 99,
  },
  toastText: { color: "#fff", fontSize: 13, fontWeight: "500" },
});