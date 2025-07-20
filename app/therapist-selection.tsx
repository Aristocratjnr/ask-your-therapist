// Create: app/therapist-selection.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function TherapistSelectionScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#10B981" />
        </TouchableOpacity>
        <Text style={styles.title}>Select Therapist</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.message}>
          This feature will allow clients to select therapists to message.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '600', marginLeft: 16 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
});