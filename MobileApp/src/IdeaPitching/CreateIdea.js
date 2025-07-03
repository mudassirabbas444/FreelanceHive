import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../config';

const CreateIdea = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [ideaCount, setIdeaCount] = useState(0);
  const [user, setUser] = useState(null);

  const categories = [
    "Web Development",
    "Mobile Development",
    "UI/UX Design",
    "Graphic Design",
    "Content Writing",
    "Digital Marketing",
    "Data Science",
    "Machine Learning",
    "Other"
  ];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: ""
  });

  useEffect(() => {
    const loadUserAndCheckIdeas = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (!userData) {
          Alert.alert('Access Denied', 'Please log in first.');
          navigation.navigate('Login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'Buyer') {
          Alert.alert('Access Denied', 'Please log in as a Buyer.');
          navigation.navigate('Login');
          return;
        }

        setUser(parsedUser);

        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/ideas/${parsedUser.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const ideas = await response.json();
          const openIdeas = ideas.filter(idea => idea.status === 'open');
          setIdeaCount(openIdeas.length);
        }
      } catch (error) {
        console.error("Error:", error);
        Alert.alert('Error', 'Failed to load user data or fetch ideas.');
      }
    };

    loadUserAndCheckIdeas();
  }, [navigation]);

  const validateInput = () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.category.trim()) {
      return "All fields are required.";
    }
    if (formData.title.trim().length < 5) {
      return "Title must be at least 5 characters long.";
    }
    if (/\d/.test(formData.title)) {
      return "Title cannot contain numbers.";
    }
    if (formData.title.length > 100) {
      return "Title cannot exceed 100 characters.";
    }
    if (formData.description.length < 20) {
      return "Description must be at least 20 characters long.";
    }
    if (formData.description.length > 500) {
      return "Description cannot exceed 500 characters.";
    }
    if (ideaCount >= 3) {
      return "You have reached the maximum limit of 3 open ideas. Please close or delete some existing ideas before creating new ones.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateInput();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/create-idea`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          buyerId: user.id,
          buyerName: user.name,
          title: formData.title,
          description: formData.description,
          category: formData.category
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create idea");
      }

      Alert.alert(
        'Success',
        'Idea submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Ideas', {
              message: 'Idea submitted successfully!',
              type: 'success'
            })
          }
        ]
      );
    } catch (error) {
      console.error("Error:", error);
      Alert.alert('Error', error.message || 'Failed to submit idea. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome name="arrow-left" size={20} color="#000" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Submit New Idea</Text>
        <Text style={styles.subtitle}>Share your business idea with the community</Text>

        <View style={styles.formGroup}>
          <View style={styles.labelContainer}>
            <FontAwesome name="lightbulb-o" size={16} color="#666" />
            <Text style={styles.label}>Title</Text>
          </View>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            placeholder="Enter a catchy title for your idea (min. 5 characters)"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelContainer}>
            <FontAwesome name="tag" size={16} color="#666" />
            <Text style={styles.label}>Category</Text>
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              style={styles.picker}
            >
              <Picker.Item label="Select a category" value="" />
              {categories.map((category, index) => (
                <Picker.Item key={index} label={category} value={category} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelContainer}>
            <FontAwesome name="paper-plane" size={16} color="#666" />
            <Text style={styles.label}>Description</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Provide a detailed description of your idea (min. 20 characters)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesome name="check" size={16} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Idea</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CreateIdea; 