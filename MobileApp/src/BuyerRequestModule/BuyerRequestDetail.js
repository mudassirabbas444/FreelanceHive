import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const BASE_URL = 'http://192.168.1.107:4000';

function BuyerRequestDetail() {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { requestId } = route.params;

  useEffect(() => {
    fetchRequestDetails();
  }, []);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Login');
        return;
      }

      const user = JSON.parse(userStr);
      const response = await fetch(`${BASE_URL}/api/buyer-requests/${requestId}`);
      if (!response.ok) throw new Error('Failed to fetch request details');
      
      const data = await response.json();
      setRequest(data);
      setIsOwner(data.userId === user.id);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BASE_URL}/api/buyer-requests/${requestId}`, {
                method: 'DELETE'
              });

              if (!response.ok) throw new Error('Failed to delete request');
              
              Alert.alert('Success', 'Request deleted successfully');
              navigation.navigate('BuyerRequests');
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'Failed to delete request');
            }
          }
        }
      ]
    );
  };

  const handleSendOffer = () => {
    // Navigate to send offer screen or show offer modal
    Alert.alert('Info', 'Send offer functionality to be implemented');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.centerContainer}>
        <Text>Request not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{request.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: request.status === 'active' ? '#4CD964' : '#FFA500' }]}>
          <Text style={styles.statusText}>{request.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{request.description}</Text>
      </View>

      <View style={styles.metaSection}>
        <View style={styles.metaItem}>
          <Icon name="tag" size={16} color="#8E8E93" />
          <Text style={styles.metaText}>{request.category}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="dollar" size={16} color="#8E8E93" />
          <Text style={styles.metaText}>${request.price}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="clock-o" size={16} color="#8E8E93" />
          <Text style={styles.metaText}>{request.deliveryTime} days</Text>
        </View>
      </View>

      {isOwner ? (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Icon name="trash" size={16} color="#fff" />
          <Text style={styles.buttonText}>Delete Request</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.offerButton} onPress={handleSendOffer}>
          <Icon name="paper-plane" size={16} color="#fff" />
          <Text style={styles.buttonText}>Send Offer</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#3C3C43',
    lineHeight: 24,
  },
  metaSection: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 16,
    color: '#3C3C43',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  offerButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default BuyerRequestDetail; 