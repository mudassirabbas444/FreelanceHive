import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const BASE_URL = 'http://192.168.1.107:4000';

function BuyerRequestDetailSeller() {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerData, setOfferData] = useState({
    price: '',
    deliveryTime: '',
    description: ''
  });
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

      const response = await fetch(`${BASE_URL}/api/buyer-requests/${requestId}`);
      if (!response.ok) throw new Error('Failed to fetch request details');
      
      const data = await response.json();
      setRequest(data);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOffer = async () => {
    try {
      if (!offerData.price || !offerData.deliveryTime || !offerData.description) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Login');
        return;
      }

      const user = JSON.parse(userStr);
      const response = await fetch(`${BASE_URL}/api/buyer-requests/${requestId}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...offerData,
          sellerId: user.id,
          price: parseFloat(offerData.price),
          deliveryTime: parseInt(offerData.deliveryTime)
        })
      });

      if (!response.ok) throw new Error('Failed to send offer');
      
      Alert.alert('Success', 'Offer sent successfully');
      setShowOfferModal(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to send offer');
    }
  };

  const OfferModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showOfferModal}
      onRequestClose={() => setShowOfferModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Offer</Text>
            <TouchableOpacity onPress={() => setShowOfferModal(false)}>
              <Icon name="times" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price ($)</Text>
              <TextInput
                style={styles.input}
                value={offerData.price}
                onChangeText={(text) => setOfferData({ ...offerData, price: text })}
                placeholder="Enter your price"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Delivery Time (days)</Text>
              <TextInput
                style={styles.input}
                value={offerData.deliveryTime}
                onChangeText={(text) => setOfferData({ ...offerData, deliveryTime: text })}
                placeholder="Enter delivery time"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={offerData.description}
                onChangeText={(text) => setOfferData({ ...offerData, description: text })}
                placeholder="Describe your offer"
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSendOffer}>
              <Text style={styles.submitButtonText}>Send Offer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

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
    <>
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

        <TouchableOpacity 
          style={styles.offerButton}
          onPress={() => setShowOfferModal(true)}
        >
          <Icon name="paper-plane" size={16} color="#fff" />
          <Text style={styles.buttonText}>Send Offer</Text>
        </TouchableOpacity>
      </ScrollView>
      <OfferModal />
    </>
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BuyerRequestDetailSeller; 