import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const PAGES = ['Dashboard', 'Research', 'Studio', 'Schedule', 'Analytics', 'Monitor', 'WhatsApp'];

export default function App() {
  const [page, setPage] = useState('Dashboard');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#334155' }}>AI Content Empire</Text>
      </View>
      <ScrollView horizontal style={{ backgroundColor: '#fff' }} contentContainerStyle={{ padding: 8 }}>
        {PAGES.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setPage(item)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginRight: 8,
              borderRadius: 8,
              backgroundColor: page === item ? '#e0e7ff' : '#f1f5f9',
            }}
          >
            <Text style={{ color: page === item ? '#4338ca' : '#334155', fontWeight: '600' }}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#334155' }}>{page}</Text>
          <Text style={{ color: '#64748b', lineHeight: 22 }}>
            Mobile scaffold for the {page} module. Connect this screen to API services and backend storage to match web functionality.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
