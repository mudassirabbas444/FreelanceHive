import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const IdeaDetailAdmin = () => (
  <View style={styles.container}>
    <StatusBar style="auto" />
    <View style={styles.content}>
      <Ionicons name="construct" size={64} color="#007bff" />
      <Text style={styles.title}>Admin Panel</Text>
      <Text style={styles.subtitle}>Idea Detail Admin - Coming Soon</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#212529',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default IdeaDetailAdmin;