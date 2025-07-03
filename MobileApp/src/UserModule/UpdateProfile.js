import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchData } from '../api';

const UpdateProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const validateForm = () => {
    const nameRegex = /^[a-zA-Z ]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name || !nameRegex.test(formData.name)) {
      Alert.alert('Validation Error', 'Name is required and cannot contain numbers.');
      return false;
    }

    if (!formData.email || !emailRegex.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return false;
    }

    if (
      user.role === 'Seller' &&
      (!formData.expertise || !nameRegex.test(formData.expertise))
    ) {
      Alert.alert('Validation Error', 'Expertise is required and cannot contain numbers.');
      return false;
    }

    if (
      user.role === 'Seller' &&
      (!formData.qualification || !nameRegex.test(formData.qualification))
    ) {
      Alert.alert('Validation Error', 'Qualification is required and cannot contain numbers.');
      return false;
    }

    return true;
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await fetchData(`/profile/view/${userId}`);
        setUser(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          username: data.username || '',
          ...(data.role === 'Seller' && {
            expertise: Array.isArray(data.expertise) ? data.expertise.join(', ') : data.expertise || '',
            description: data.description || '',
            certificates: Array.isArray(data.certificates) ? data.certificates.join(', ') : data.certificates || '',
            address: data.address || '',
            qualification: data.qualification || '',
          }),
        });
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await fetchData(`/profile/update/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...(formData.expertise && {
            expertise: formData.expertise.split(',').map((item) => item.trim()),
          }),
          ...(formData.certificates && {
            certificates: formData.certificates.split(',').map((item) => item.trim()),
          }),
        }),
      });
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="dark" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.replace('UpdateProfile', { userId })}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <Text style={styles.header}>Edit Profile</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              value={formData.username}
              onChangeText={(text) => handleChange('username', text)}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {user.role === 'Seller' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller Information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Expertise (comma-separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your expertise"
                value={formData.expertise}
                onChangeText={(text) => handleChange('expertise', text)}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your description"
                value={formData.description}
                onChangeText={(text) => handleChange('description', text)}
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Certificates (comma-separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your certificates"
                value={formData.certificates}
                onChangeText={(text) => handleChange('certificates', text)}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your address"
                value={formData.address}
                onChangeText={(text) => handleChange('address', text)}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Qualification</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your qualification"
                value={formData.qualification}
                onChangeText={(text) => handleChange('qualification', text)}
                placeholderTextColor="#999"
              />
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
          
          <View style={styles.buttonSpacer} />
          
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f6fa',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#34495e',
    borderBottomWidth: 1,
    borderBottomColor: '#dcdde1',
    paddingBottom: 5,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#34495e',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcdde1',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSpacer: {
    height: 15,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default UpdateProfile;
