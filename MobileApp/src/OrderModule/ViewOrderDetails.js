import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet,StatusBar, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchData } from '../api';
import { getImageUrl } from '../config';

function ViewOrderDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState({});
  const [error, setError] = useState(null);

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
    const fetchOrderAndGigDetails = async () => {
      try {
        const orderData = await fetchData(`/orders/${id}`);
        const gigData = await fetchData(`/gigs/${orderData.gigId}`);
        setData({ order: orderData, gig: gigData });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndGigDetails();
  }, [id]);

  const handleInputChange = (name, value) => {
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleApiCall = async (endpoint, options = {}) => {
    try {
      const result = await fetchData(endpoint, options);
      Alert.alert('Success', result.message || 'Operation successful');
      // Refresh order details
      const orderData = await fetchData(`/orders/${id}`);
      const gigData = await fetchData(`/gigs/${orderData.gigId}`);
      setData({ order: orderData, gig: gigData });
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleStatusUpdate = async (status, extraUpdates = {}) => {
    await handleApiCall(`/orders/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, extraUpdates }),
    });
    setData((prev) => ({
      ...prev,
      order: { ...prev.order, status, ...extraUpdates },
    }));
  };

  const handleOpenDispute = async () => {
    if (!input.reason) {
      Alert.alert("Error", "Please provide a reason for the dispute.");
      return;
    }
    const result = await handleApiCall(`/orders/${id}/dispute`, {
      method: "POST",
      body: JSON.stringify({
        disputeDetails: input.reason,
        userId: data.order.buyerId,
      }),
    });
    if (result) {
      setData((prev) => ({
        ...prev,
        order: { ...prev.order, status: "Disputed", disputeDetails: input.reason },
      }));
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading details...</Text>
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
          onPress={() => navigation.replace('ViewOrderDetails', { id })}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="dark" />
        <Text style={styles.noDataText}>No details found.</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { order, gig } = data;

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.header}>Order and Gig Details</Text>

      {order.disputeDetails && (
        <View style={styles.disputeSection}>
          <Text style={styles.subHeader}>Dispute Opened</Text>
          <Text style={styles.disputeText}>
            <Text style={styles.bold}>Reason:</Text> {order.disputeDetails}
          </Text>
        </View>
      )}

      {order.modificationRequests?.length > 0 && (
        <View style={styles.modificationSection}>
          <Text style={styles.subHeader}>Modification Request</Text>
          <Text style={styles.modificationText}>
            <Text style={styles.bold}>Requested Price:</Text> ${order.modificationRequests[0]?.price}
          </Text>
          <Text style={styles.modificationText}>
            <Text style={styles.bold}>Requested Delivery Time:</Text> {order.modificationRequests[0]?.deliveryTime} days
          </Text>
          <Text style={styles.modificationText}>
            <Text style={styles.bold}>Reason:</Text> {order.modificationRequests[0]?.reason}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.subHeader}>Order Details</Text>
        {gig && (
          <View style={styles.gigSection}>
            <Text style={styles.detailText}>
              <Text style={styles.bold}>Order ID:</Text> {order._id}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.bold}>Title:</Text> {gig.title}
            </Text>
            {gig.images ? (
              <Image
                source={{ uri: getImageUrl(gig.images) }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No image available for this gig.</Text>
              </View>
            )}
          </View>
        )}
        <Text style={styles.detailText}>
          <Text style={styles.bold}>Price:</Text> ${order.price}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.bold}>Delivery Time:</Text> {order.deliveryTime} days
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.bold}>Status:</Text> {order.status}
        </Text>
      </View>

      <View style={styles.actionSection}>
        {order.status === "Active" && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => handleStatusUpdate("Cancel Request")}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {order.status === "Delivered" && (
          <TouchableOpacity
            style={[styles.button, styles.completeButton]}
            onPress={() => handleStatusUpdate("Completed")}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Complete</Text>
          </TouchableOpacity>
        )}

        {order.status === "Disputed" && (
          <TouchableOpacity
            style={[styles.button, styles.resolveButton]}
            onPress={() => handleStatusUpdate("Active")}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Close Dispute</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.subHeader}>Review</Text>
        {order.status === "Completed" && (
          <View style={styles.reviewSection}>
            <TextInput
              style={styles.input}
              placeholder="Write your review"
              value={input.review}
              onChangeText={(text) => handleInputChange("review", text)}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
            <TextInput
              style={styles.input}
              placeholder="Rating (1-5)"
              keyboardType="numeric"
              value={input.rating}
              onChangeText={(text) => handleInputChange("rating", text)}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={() => handleApiCall(`/orders/${id}/review`, {
                method: "POST",
                body: JSON.stringify({
                  userId: data.order.buyerId,
                  role: "Buyer",
                  rating: input.rating,
                  reviewText: input.review,
                }),
              })}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  section: {
    marginBottom: 25,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#34495e',
    borderBottomWidth: 1,
    borderBottomColor: '#dcdde1',
    paddingBottom: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
    borderRadius: 10,
  },
  placeholderText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcdde1',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    color: '#2c3e50',
  },
  disputeSection: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#f8d7da',
    borderRadius: 10,
    backgroundColor: '#f8d7da',
  },
  disputeText: {
    fontSize: 16,
    color: '#721c24',
  },
  modificationSection: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#fff3cd',
    borderRadius: 10,
    backgroundColor: '#fff3cd',
  },
  modificationText: {
    fontSize: 16,
    color: '#856404',
    marginBottom: 5,
  },
  gigSection: {
    marginBottom: 15,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#2c3e50',
  },
  actionSection: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  completeButton: {
    backgroundColor: '#28a745',
  },
  resolveButton: {
    backgroundColor: '#17a2b8',
  },
  submitButton: {
    backgroundColor: '#007BFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewSection: {
    marginTop: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ViewOrderDetails;
