import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from "react-native";

import { useRouter } from "expo-router";

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();  
  const handleLogin = async () => {
    // Validate
    if (!username) {
      Alert.alert("Lỗi", "Vui lòng nhập tên đăng nhập");
      return;
    }
    if (!password) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu");
      return;
    }

    try {
        const response = await fetch("http://170.20.10.4/cuahangtaphoa", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `TenDangNhap=${encodeURIComponent(username)}&MatKhau=${encodeURIComponent(password)}`,
        });

      const data = await response.json();

      if (data.success) {
        Alert.alert("Thành công", data.message);
        router.replace("/(tabs)");      
      } 
      else {
        Alert.alert("Lỗi", data.message);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Lỗi", "Không kết nối được server");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <Text style={styles.logo}>Cửa hàng</Text>

      <TextInput
        placeholder="Tên đăng nhập"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Mật khẩu"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.checkboxRow}>
        <Text>☑ Duy trì đăng nhập</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Quản lý</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    padding: 20,
  },

  logo: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#1e88e5",
  },

  input: {
    backgroundColor: "#fff",
    padding: 10,
    height: 40,
    width: "80%",
    alignSelf: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
  },

  checkboxRow: {
    marginBottom: 20,
    width: "80%",
    alignSelf: "center",
  },

  button: {
    backgroundColor: "#1e88e5",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "40%",
    alignSelf: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});