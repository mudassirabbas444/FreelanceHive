import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  StatusBar
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const IdeaDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { ideaId } = route.params;
  const [ideaDetails, setIdeaDetails] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [shareholderRequests, setShareholderRequests] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (!userData || JSON.parse(userData).role !== 'Buyer') {
        Alert.alert('Access Denied', 'Please log in as a Buyer.');
        navigation.navigate('Login');
        return;
      }
      setUser(JSON.parse(userData));
    };
    loadUser();
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('token');
      
      const [ideaRes, repliesRes] = await Promise.all([
        fetch(`${API_URL}/api/idea/${ideaId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/idea/${ideaId}/replies`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (!ideaRes.ok) throw new Error("Failed to fetch idea details");
      if (!repliesRes.ok) throw new Error("Failed to fetch replies");

      const ideaData = await ideaRes.json();
      const repliesData = await repliesRes.json();

      const completedReplies = repliesData.filter(reply => reply.status === 'completed');

      const repliesWithRequests = await Promise.all(completedReplies.map(async (reply) => {
        try {
          const requestRes = await fetch(`${API_URL}/api/shareholder-request/reply/${reply.replyId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (requestRes.ok) {
            const requestData = await requestRes.json();
            return { ...reply, shareholderRequest: requestData };
          }
          return reply;
        } catch (error) {
          console.error("Error fetching shareholder request:", error);
          return reply;
        }
      }));

      setIdeaDetails(ideaData);
      setReplies(repliesWithRequests);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [ideaId]);

  const handleAction = async (action) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this idea?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setSubmitting(true);
              setError(null);
              const token = await AsyncStorage.getItem('token');

              const response = await fetch(`${API_URL}/api/idea/${action}/${ideaId}`, {
                method: "PUT",
                headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                }
              });

              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Failed to ${action} idea`);
              }

              navigation.navigate("Ideas", {
                message: `Idea ${action}d successfully`,
                type: "success"
              });
            } catch (error) {
              console.error("Error:", error);
              setError(error.message || "An error occurred. Please try again.");
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleFileSelect = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });
      setSelectedFile(res[0]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
      } else {
        console.error(err);
      }
    }
  };

  const handleUploadSignedAgreement = async (requestId) => {
    try {
      if (!selectedFile) {
        Alert.alert('Error', 'Please select a file to upload');
        return;
      }

      const formData = new FormData();
      formData.append('pdf', {
        uri: selectedFile.uri,
        type: selectedFile.type,
        name: selectedFile.name,
      });
      formData.append('requestId', requestId);
      formData.append('userId', user.id);
      formData.append('role', 'Buyer');

      const response = await fetch(`${API_URL}/api/shareholder-request/upload-pdf`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error uploading signed agreement');
      }

      Alert.alert('Success', 'Your signed agreement has been uploaded successfully');
      setSelectedFile(null);
      await fetchData();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Error uploading signed agreement');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-triangle" size={30} color="red" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!ideaDetails) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome name="times-circle" size={30} color="red" />
        <Text style={styles.emptyText}>Idea Not Found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Ideas")}
        >
          <FontAwesome name="arrow-left" size={20} color="#000" />
          <Text style={styles.backButtonText}>Back to Ideas</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Ideas")}
        >
          <FontAwesome name="arrow-left" size={20} color="#000" />
          <Text style={styles.backButtonText}>Back to Ideas</Text>
        </TouchableOpacity>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ideaDetails.status) }]}>
          <Text style={styles.statusText}>{ideaDetails.status}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.categoryPill}>
          <FontAwesome name="tag" size={16} color="#666" />
          <Text style={styles.categoryText}>{ideaDetails.category}</Text>
        </View>

        <Text style={styles.title}>{ideaDetails.title}</Text>

        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <FontAwesome name="user" size={16} color="#666" />
            <Text style={styles.metaLabel}>Created by</Text>
            <Text style={styles.metaValue}>{ideaDetails.buyerName}</Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome name="clock-o" size={16} color="#666" />
            <Text style={styles.metaLabel}>Created on</Text>
            <Text style={styles.metaValue}>
              {new Date(ideaDetails.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <FontAwesome name="info-circle" size={16} color="#666" /> Description
          </Text>
          <Text style={styles.description}>{ideaDetails.description}</Text>
        </View>

        {/* Add the rest of your components here */}
        
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
  },
  content: {
    padding: 15,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  categoryText: {
    marginLeft: 5,
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  metaLabel: {
    marginLeft: 5,
    color: '#666',
  },
  metaValue: {
    marginLeft: 5,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
});

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'open': return '#28a745';
    case 'rejected': return '#dc3545';
    case 'closed': return '#6c757d';
    default: return '#17a2b8';
  }
};

export default IdeaDetail; 