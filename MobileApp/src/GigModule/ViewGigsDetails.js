import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, FlatList, Alert, TouchableOpacity, ScrollView, ActivityIndicator, TextInput,StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchData } from '../api';
import { Ionicons } from '@expo/vector-icons';

function ViewGigDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { gigId } = route.params;
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const user = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(user);
      if (!parsedUser || parsedUser.role !== "Buyer") {
        Alert.alert("Access Denied", "Please log in as a Buyer.", [
          { text: "OK", onPress: () => navigation.navigate("Login") }
        ]);
      }
    };
    checkUser();
  }, [navigation]);

  useEffect(() => {
    const fetchGigDetails = async () => {
      try {
        const data = await fetchData(`/gigs/${gigId}`);
        setGig(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGigDetails();
  }, [gigId]);

  const handleOrder = async (pkg) => {
    try {
      const user = JSON.parse(await AsyncStorage.getItem('user'));
      if (!user) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Login');
        return;
      }

      // Create order directly
      const result = await fetchData('/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId,
          sellerId: gig.sellerId,
          buyerId: user.id,
          price: pkg.price,
          deliveryTime: pkg.deliveryTime,
          packageId: pkg._id,
        }),
      });

      Alert.alert('Success', 'Order placed successfully');
      navigation.navigate('Orders');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleSendMessage = async () => {
    try {
      const user = JSON.parse(await AsyncStorage.getItem('user'));
      if (!user) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Login');
        return;
      }

      if (!messageContent.trim()) {
        Alert.alert('Error', 'Please enter a message');
        return;
      }

      const response = await fetch(`http://192.168.1.107:4000/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: gig.sellerId,
          content: messageContent,
          gigId: gig._id,
        }),
      });

      if (response.ok) {
        // Navigate to chat after sending
        navigation.navigate('Chat', { receiverId: gig.sellerId });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading gig details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="dark" />
        <Ionicons name="warning" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!gig) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="dark" />
        <Ionicons name="information-circle" size={50} color="#8E8E93" />
        <Text style={styles.errorText}>No gig found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>{gig.title}</Text>
      
      {/* Gig Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{gig.description}</Text>
      </View>

      {/* Packages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Packages</Text>
        {gig.packages && gig.packages.map((pkg, index) => (
          <View key={pkg._id || index} style={styles.packageCard}>
            <Text style={styles.packageTitle}>{pkg.name}</Text>
            <Text style={styles.packageDescription}>{pkg.description}</Text>
            <View style={styles.packageMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#8E8E93" />
                <Text style={styles.metaText}>{pkg.deliveryTime} days</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="cash-outline" size={16} color="#8E8E93" />
                <Text style={styles.metaText}>${pkg.price}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.orderButton}
              onPress={() => handleOrder(pkg)}
              activeOpacity={0.8}
            >
              <Text style={styles.orderButtonText}>Order Now</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Message Seller */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Seller</Text>
        <TextInput
          style={styles.messageInput}
          value={messageContent}
          onChangeText={setMessageContent}
          placeholder="Type your message..."
          multiline
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.messageButton}
          onPress={handleSendMessage}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={16} color="#fff" />
          <Text style={styles.messageButtonText}>Send Message</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    padding: 16,
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#3C3C43',
    lineHeight: 24,
  },
  packageCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 12,
  },
  packageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#3C3C43',
  },
  orderButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    height: 100,
    marginBottom: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    color: '#3C3C43',
  },
  messageButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ViewGigDetails;
