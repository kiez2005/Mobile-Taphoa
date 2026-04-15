import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BLUE = "#1565c0";
const LIGHT_BLUE = "#e8f0fe";
const BG = "#dce8fb";

type ToastType = "error" | "success" | "warning";

function Toast({ message, type }: { message: string; type: ToastType }) {
  const cfg = {
    error:   { bg: "#fdeded", border: "#f44336", icon: "close-circle"     as const, color: "#c62828" },
    success: { bg: "#edf7ed", border: "#4caf50", icon: "checkmark-circle" as const, color: "#2e7d32" },
    warning: { bg: "#fff8e1", border: "#ff9800", icon: "warning"           as const, color: "#e65100" },
  }[type];

  return (
    <View style={[toastStyles.box, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Ionicons name={cfg.icon} size={18} color={cfg.color} />
      <Text style={[toastStyles.text, { color: cfg.color }]}>{message}</Text>
    </View>
  );
}

const toastStyles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    width: "100%",
  },
  text: { fontSize: 13, flex: 1, lineHeight: 18 },
});

export default function LoginScreen() {
  const [username, setUsername]           = useState("");
  const [password, setPassword]           = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [focusedField, setFocusedField]   = useState<string | null>(null);
  const [toast, setToast]                 = useState<{ message: string; type: ToastType } | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const router    = useRouter();

  const showToast = (message: string, type: ToastType, autoDismiss = true) => {
    setToast({ message, type });
    if (autoDismiss) setTimeout(() => setToast(null), 4000);
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setToast(null);

    if (!username.trim()) {
      shake();
      showToast("Vui lòng nhập tên đăng nhập", "warning");
      return;
    }
    if (!password.trim()) {
      shake();
      showToast("Vui lòng nhập mật khẩu", "warning");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://172.20.10.2/cuahangtaphoa/Login/Login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TenDangNhap: username.trim(),
          MatKhau:     password.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Hiện thông báo thành công rồi chuyển trang
        showToast("Đăng nhập thành công! Đang chuyển trang...", "success", false);
        setTimeout(() => router.replace("/(tabs)"), 900);
      } else {
        shake();
        showToast(data.message ?? "Sai tên đăng nhập hoặc mật khẩu", "error");
      }
    } catch {
      shake();
      // Lỗi kết nối server
      showToast("Không kết nối được máy chủ. Kiểm tra lại mạng hoặc địa chỉ IP server.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.circleTopRight} />
        <View style={styles.circleBottomLeft} />

        <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Ionicons name="bag-handle" size={28} color="#fff" />
            </View>
            <Text style={styles.appName}>Cửa Hàng Tạp Hóa</Text>
            <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>
          </View>

          <View style={styles.divider} />

          {/* Username */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <View style={[styles.inputRow, focusedField === "user" && styles.inputRowFocused]}>
              <Ionicons
                name="person-outline" size={16}
                color={focusedField === "user" ? BLUE : "#aaa"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor="#bbb"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                onFocus={() => setFocusedField("user")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={[styles.inputRow, focusedField === "pass" && styles.inputRowFocused]}>
              <Ionicons
                name="lock-closed-outline" size={16}
                color={focusedField === "pass" ? BLUE : "#aaa"}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#bbb"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("pass")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18} color="#aaa"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Thông báo inline (toast) */}
          {toast && <Toast message={toast.message} type={toast.type} />}

          {/* Nút đăng nhập */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Đăng nhập</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footerText}>© 2025 Cửa Hàng Tạp Hóa</Text>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: BG,
    justifyContent: "center", alignItems: "center",
  },
  circleTopRight: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(21,101,192,0.12)", top: -50, right: -60,
  },
  circleBottomLeft: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(21,101,192,0.08)", bottom: 60, left: -50,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 20,
    paddingHorizontal: 28, paddingVertical: 32,
    width: "85%", maxWidth: 380,
    shadowColor: "#1565c0", shadowOpacity: 0.13, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  header:   { alignItems: "center", marginBottom: 24 },
  logoBox: {
    width: 58, height: 58, borderRadius: 18, backgroundColor: BLUE,
    justifyContent: "center", alignItems: "center", marginBottom: 12,
    shadowColor: BLUE, shadowOpacity: 0.4, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  appName:  { fontSize: 18, fontWeight: "700", color: "#1a1a2e", letterSpacing: 0.3 },
  subtitle: { fontSize: 12, color: "#999", marginTop: 3 },
  divider:  { height: 1, backgroundColor: "#f0f0f0", marginBottom: 22 },

  inputWrapper:    { marginBottom: 16 },
  label: {
    fontSize: 11, fontWeight: "600", color: "#555",
    marginBottom: 6, letterSpacing: 0.3, textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#e0e0e0",
    borderRadius: 10, backgroundColor: "#fafafa",
    paddingHorizontal: 12, height: 46,
  },
  inputRowFocused: { borderColor: BLUE, backgroundColor: LIGHT_BLUE },
  inputIcon: { marginRight: 8 },
  input:     { flex: 1, fontSize: 14, color: "#222", height: "100%" },
  eyeBtn:    { padding: 4 },

  button: {
    backgroundColor: BLUE, height: 48, borderRadius: 12,
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    marginTop: 20,
    shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },
  footerText: { position: "absolute", bottom: 24, fontSize: 11, color: "#aaa" },
});