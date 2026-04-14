import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, Image, Keyboard, TouchableWithoutFeedback
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username) { Alert.alert("Lỗi", "Vui lòng nhập tên đăng nhập"); return; }
    if (!password) { Alert.alert("Lỗi", "Vui lòng nhập mật khẩu"); return; }

    try {
      const response = await fetch("http://170.20.10.2/Login/Login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `TenDangNhap=${encodeURIComponent(username)}&MatKhau=${encodeURIComponent(password)}`,
      });
      const data = await response.json();
      if (data.success) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("Lỗi", data.message);
      }
    } catch {
      Alert.alert("Lỗi", "Không kết nối được server");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {/* Logo */}
        <View style={styles.logoBox}>
          <Ionicons name="bag-handle" size={30} color="#fff" />
        </View>

        {/* Username */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Tên đăng nhập</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên đăng nhập"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Mật khẩu"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18} color="#999"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nút đăng nhập */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Đăng nhập</Text>
        </TouchableOpacity>

        
      </View>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const BLUE = "#1565c0";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#9ac8fc", justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 24,
    width: "80%", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  logoBox: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: BLUE,
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  inputWrapper: { marginBottom: 10, width: "100%" },
  label: { fontSize: 11, color: "#666", marginBottom: 3 },
  input: {
    backgroundColor: "#fff", height: 36, borderRadius: 7,
    borderWidth: 1, borderColor: "#ccc", paddingHorizontal: 10,
    fontSize: 13, marginBottom: 0,
  },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  eyeBtn: { position: "absolute", right: 10 },
  button: {
    backgroundColor: BLUE, height: 38, borderRadius: 7,
    justifyContent: "center", alignItems: "center",
    marginBottom: 16, width: "60%", alignSelf: "center",
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  footer: {
    borderTopWidth: 0.5, borderTopColor: "#ccc",
    paddingTop: 16, alignItems: "center", gap: 8, marginTop: 6, width: "100%",
  },
  brand: { fontSize: 15, fontWeight: "500", color: "#333" },
  footerLinks: { flexDirection: "row", gap: 20 },
  footerLink: { fontSize: 13, color: BLUE },
});