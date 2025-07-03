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
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_URL } from '../config';

const IdeaDetailSeller = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { ideaId } = route.params;
  
  const [ideaDetails, setIdeaDetails] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newReply, setNewReply] = useState("");
  const [user, setUser] = useState(null);
  const [hasReplied, setHasReplied] = useState(false);
  const [shareholderRequests, setShareholderRequests] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

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

      const [ideaData, repliesData] = await Promise.all([
        ideaRes.json(),
        repliesRes.json()
      ]);

      setIdeaDetails(ideaData);
      setReplies(repliesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [ideaId]);

  const fetchShareholderRequests = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/shareholder-request/seller/${user.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShareholderRequests(data);
      }
    } catch (error) {
      console.error("Error fetching shareholder requests:", error);
    }
  }, [user]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (!userData) {
          Alert.alert('Access Denied', 'Please log in first.');
          navigation.navigate('Login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'Seller') {
          Alert.alert('Access Denied', 'Please log in as a Seller.');
          navigation.navigate('Login');
          return;
        }

        setUser(parsedUser);
      } catch (error) {
        console.error("Error loading user:", error);
        Alert.alert('Error', 'Failed to load user data');
      }
    };

    loadUser();
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user?.id) {
      fetchShareholderRequests();
    }
  }, [user, fetchShareholderRequests]);

  const checkIfSellerHasReplied = useCallback(() => {
    if (replies && user) {
      const hasAlreadyReplied = replies.some(reply => reply.userId === user.id);
      setHasReplied(hasAlreadyReplied);
      if (hasAlreadyReplied) {
        setNewReply("");
      }
    }
  }, [replies, user]);

  useEffect(() => {
    checkIfSellerHasReplied();
  }, [checkIfSellerHasReplied]);

  const handleReplySubmit = async () => {
    if (!newReply.trim() || hasReplied) return;
    if (!user || !user.id || !user.name) {
      Alert.alert('Error', 'User information is missing. Please log in again.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const token = await AsyncStorage.getItem('token');

      const requestData = {
        sellerId: user.id,
        sellerName: user.name,
        content: newReply
      };

      const response = await fetch(`${API_URL}/api/idea/${ideaId}/reply`, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit reply");
      }

      setReplies(prev => [...prev, data.reply]);
      setNewReply("");
      setHasReplied(true);
      Alert.alert(
        'Success',
        'Reply submitted successfully. Please download, sign, and upload the agreement within 24 hours.'
      );
    } catch (error) {
      console.error("Error details:", error);
      Alert.alert('Error', error.message || "Failed to submit reply. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

  const handleAgreementUpload = async (replyId) => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('agreement', {
        uri: selectedFile.uri,
        type: selectedFile.type,
        name: selectedFile.name,
      });

      const response = await fetch(`${API_URL}/api/idea/${ideaId}/reply/${replyId}/agreement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload agreement");
      }

      Alert.alert('Success', 'Agreement uploaded successfully!');
      setSelectedFile(null);
      fetchData();
    } catch (error) {
      console.error("Error uploading agreement:", error);
      Alert.alert('Error', error.message || "Failed to upload agreement. Please try again.");
    }
  };

  const handleAcceptShareholderRequest = async (request) => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/shareholder-request/${request._id}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error accepting shareholder request');
      }

      Alert.alert(
        'Success',
        'Shareholder request accepted. Please download, sign, and upload the agreement.'
      );

      await fetchData();
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectShareholderRequest = async (requestId) => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/shareholder-request/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error rejecting shareholder request');
      }

      Alert.alert('Success', 'Shareholder request rejected successfully.');
      await fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
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
          onPress={() => navigation.goBack()}
        >
          <FontAwesome name="arrow-left" size={20} color="#000" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {ideaDetails && (
          <>
            <View style={styles.ideaHeader}>
              <View style={styles.categoryPill}>
                <FontAwesome name="tag" size={14} color="#666" />
                <Text style={styles.categoryText}>{ideaDetails.category}</Text>
              </View>
              <Text style={styles.title}>{ideaDetails.title}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{ideaDetails.description}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Reply</Text>
              {hasReplied ? (
                <Text style={styles.replySubmitted}>
                  You have already submitted a reply to this idea.
                </Text>
              ) : (
                <View style={styles.replyForm}>
                  <TextInput
                    style={styles.replyInput}
                    value={newReply}
                    onChangeText={setNewReply}
                    placeholder="Write your reply..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleReplySubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <FontAwesome name="paper-plane" size={16} color="#fff" />
                        <Text style={styles.submitButtonText}>Submit Reply</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {replies.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Replies</Text>
                {replies.map((reply, index) => (
                  <View key={reply._id || index} style={styles.replyCard}>
                    <View style={styles.replyHeader}>
                      <FontAwesome name="user" size={14} color="#666" />
                      <Text style={styles.replyAuthor}>{reply.sellerName}</Text>
                    </View>
                    <Text style={styles.replyContent}>{reply.content}</Text>
                    {reply.userId === user?.id && !reply.agreementUrl && (
                      <View style={styles.agreementActions}>
                        <TouchableOpacity
                          style={styles.uploadButton}
                          onPress={handleFileSelect}
                        >
                          <FontAwesome name="file-pdf-o" size={16} color="#007bff" />
                          <Text style={styles.uploadButtonText}>
                            {selectedFile ? selectedFile.name : 'Select Agreement'}
                          </Text>
                        </TouchableOpacity>
                        {selectedFile && (
                          <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={() => handleAgreementUpload(reply._id)}
                          >
                            <FontAwesome name="upload" size={16} color="#28a745" />
                            <Text style={styles.uploadButtonText}>Upload</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
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
    textAlign: 'center',
    marginVertical: 10,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
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
    padding: 15,
  },
  ideaHeader: {
    marginBottom: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  categoryText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#212529',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#495057',
  },
  replyForm: {
    marginTop: 10,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  replySubmitted: {
    fontSize: 16,
    color: '#28a745',
    fontStyle: 'italic',
  },
  replyCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyAuthor: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  replyContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#212529',
  },
  agreementActions: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#007bff',
    marginRight: 10,
  },
  uploadButtonText: {
    marginLeft: 5,
    color: '#007bff',
    fontSize: 14,
  },
});

export default IdeaDetailSeller; 