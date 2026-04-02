import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BaoCaoScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
      <Text style={{ fontSize: 28 }}>📊</Text>
      <Text style={{ fontSize: 22, marginTop: 12, fontWeight: '600' }}>Báo Cáo</Text>
    </SafeAreaView>
  );
}