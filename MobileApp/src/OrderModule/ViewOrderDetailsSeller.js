import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator,StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchData } from '../api';
import { getImageUrl } from '../config';

function ViewOrderDetailsSeller() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modificationInput, setModificationInput] = useState({ price: '', deliveryTime: '', reason: '' });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const user = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(user);
      if (!parsedUser || parsedUser.role !== "Seller") {
        Alert.alert("Access Denied", "Please log in as a Seller.", [
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

  const handleModificationSubmit = async () => {
    const { price, deliveryTime, reason } = modificationInput;
    if (!price || !deliveryTime || !reason) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const result = await fetchData(`/orders/${id}/modification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: data.order.sellerId,
          modificationDetails: { price, deliveryTime, reason },
        }),
      });
      Alert.alert("Success", result.message);
      setData((prev) => ({
        ...prev,
        order: { ...prev.order, status: "Modification Requested" },
      }));
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleFileSelect = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        multiple: true,
        selectionLimit: 5,
      });

      if (result.didCancel) return;

      if (result.assets) {
        setFiles(result.assets);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to select files.");
    }
  };

  const handleFileSubmit = async () => {
    if (files.length === 0) {
      Alert.alert("Error", "Please select files to submit.");
      return;
    }

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("deliverables", {
          uri: file.uri,
          name: file.fileName || 'file',
          type: file.type,
        });
      });

      const result = await fetchData(`/orders/${id}/deliver`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
      Alert.alert("Success", "Files uploaded successfully");
      setData((prev) => ({
        ...prev,
        order: { ...prev.order, status: "Delivered" },
      }));
      setFiles([]);
    } catch (err) {
      Alert.alert("Error", err.message);
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
        <TouchableOpacity style={styles.button} onPress={() => navigation.replace('ViewOrderDetailsSeller', { id })}>
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
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { order, gig } = data;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>Order Details</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gig Information</Text>
          {gig && (
            <View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Order ID</Text>
                <Text style={styles.value}>{order._id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Title</Text>
                <Text style={styles.value}>{gig.title}</Text>
              </View>
              {gig.images && (
                <Image
                  source={{ uri: getImageUrl(gig.images) }}
                  style={styles.image}
                  resizeMode="cover"
                />
              )}
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.value}>${order.price}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Delivery Time</Text>
            <Text style={styles.value}>{order.deliveryTime} days</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, styles.statusText]}>{order.status}</Text>
          </View>
        </View>

        {order.status === "Active" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submit Deliverables</Text>
            <View style={styles.fileSection}>
              {files.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <Text style={styles.fileName}>{file.fileName || `File ${index + 1}`}</Text>
                </View>
              ))}
            </View>
            <View style={styles.buttonContainer}>
              <Button 
                title="Select Files" 
                onPress={handleFileSelect}
                color="#007BFF"
              />
              <View style={styles.buttonSpacer} />
              <Button 
                title="Submit Order" 
                onPress={handleFileSubmit}
                color="#28a745"
              />
            </View>
          </View>
        )}

        {(order.status === "Active" || order.status === "Pending") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request Modification</Text>
            <TextInput
              style={styles.input}
              placeholder="New Price"
              keyboardType="numeric"
              value={modificationInput.price}
              onChangeText={(text) => setModificationInput((prev) => ({ ...prev, price: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="New Delivery Time (days)"
              keyboardType="numeric"
              value={modificationInput.deliveryTime}
              onChangeText={(text) => setModificationInput((prev) => ({ ...prev, deliveryTime: text }))}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Reason for modification"
              value={modificationInput.reason}
              onChangeText={(text) => setModificationInput((prev) => ({ ...prev, reason: text }))}
              multiline
              numberOfLines={4}
            />
            <Button 
              title="Submit Modification" 
              onPress={handleModificationSubmit}
              color="#dc3545"
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

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
    borderRadius: 10,
    padding: 20,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  label: {
    fontSize: 16,
    color: '#7f8c8d',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
  },
  statusText: {
    fontWeight: '600',
    color: '#007BFF',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcdde1',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#f5f6fa',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  fileSection: {
    marginBottom: 15,
  },
  fileItem: {
    backgroundColor: '#f5f6fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#dcdde1',
  },
  fileName: {
    fontSize: 14,
    color: '#2c3e50',
  },
  buttonContainer: {
    gap: 10,
  },
  buttonSpacer: {
    height: 10,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default ViewOrderDetailsSeller;
