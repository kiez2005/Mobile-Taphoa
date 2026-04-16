// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      
      {/* Tab 1: Tổng quan */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      {/* Tab 2: Bán hàng */}
      <Tabs.Screen
        name="banhang"
        options={{
          title: 'Bán hàng',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />

      {/* Tab 3: Hàng hoá */}
      <Tabs.Screen
        name="hanghoa"
        options={{
          title: 'Hàng hoá',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cube.box.fill" color={color} />,
        }}
      />

       {/* Tab 4: Hoá đơn */}
      <Tabs.Screen
        name="hoadon"
        options={{
          title: 'Hoá đơn',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="doc.plaintext.fill" color={color} />,
        }}
      />    

      {/* Tab 5: Báo cáo */}
      <Tabs.Screen
        name="baocao"
        options={{
          title: 'Báo cáo',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />

      {/* Tab 6: Nhiều hơn*/}

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Nhiều hơn',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="line.3.horizontal" color={color} />,
        }}
      />
    </Tabs>
  );
}