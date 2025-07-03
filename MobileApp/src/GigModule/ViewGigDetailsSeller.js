import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet,StatusBar, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchData } from '../api';

function ViewGigDetailsSeller() {
  const navigation = useNavigation();
  const route = useRoute();
  const { gigId } = route.params;
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const handlePauseGig = async () => {
    try {
      await fetchData(`/gigs/pause/${gigId}`, { method: 'PUT' });
      Alert.alert('Success', 'Gig paused successfully');
      setGig(prev => ({ ...prev, status: 'Paused' }));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleActivateGig = async () => {
    try {
      await fetchData(`/gigs/activate/${gigId}`, { method: 'PUT' });
      Alert.alert('Success', 'Gig activated successfully');
      setGig(prev => ({ ...prev, status: 'Active' }));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDeleteGig = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this gig?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetchData(`/gigs/${gigId}`, { method: 'DELETE' });
              Alert.alert('Success', 'Gig deleted successfully');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleUpdate = () => {
    navigation.navigate("UpdateGig", { gigId });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="dark" />
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!gig) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="dark" />
        <Text style={styles.errorText}>Gig not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.actionsSeller}>
        {gig.status !== "deleted" && (
          <TouchableOpacity style={styles.button} onPress={handleUpdate} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Update Gig</Text>
          </TouchableOpacity>
        )}
        {gig.status !== "deleted" && (
          <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteGig} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Delete Gig</Text>
          </TouchableOpacity>
        )}
        {gig.status === "active" && (
          <TouchableOpacity style={[styles.button, styles.pauseButton]} onPress={handlePauseGig} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Pause Gig</Text>
          </TouchableOpacity>
        )}
        {gig.status === "paused" && (
          <TouchableOpacity style={[styles.button, styles.activateButton]} onPress={handleActivateGig} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Activate Gig</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.gigDetailsSeller}>
        <Text style={styles.title}>{gig.title}</Text>
        {gig.images ? (
          <Image
            source={{ uri: gig.images.startsWith('http') ? gig.images : `http://192.168.1.107:4000${gig.images}` }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <Text style={styles.description}>{gig.description}</Text>
        <Text style={styles.detail}>Category: {gig.category}</Text>
        <Text style={styles.detail}>Rating: {gig.rating || 'N/A'}</Text>
        <Text style={styles.detail}>Status: {gig.status}</Text>

        <Text style={styles.subTitle}>Price Packages</Text>
        {gig.pricePackages && gig.pricePackages.length > 0 ? (
          gig.pricePackages.map((pkg, index) => (
            <View key={index} style={styles.packageItem}>
              <Text style={styles.packageTitle}>{pkg.name}</Text>
              <Text style={styles.packageDescription}>{pkg.description}</Text>
              <Text style={styles.packagePrice}>Price: {pkg.price} USD</Text>
              <Text style={styles.packageDelivery}>Delivery Time: {pkg.deliveryTime} days</Text>
              <Text style={styles.packageRevisions}>Revisions: {pkg.revisions}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noPackagesText}>No price packages available.</Text>
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
  actionsSeller: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    padding: 12,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  pauseButton: {
    backgroundColor: '#ffc107',
  },
  activateButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  gigDetailsSeller: {
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
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
  description: {
    fontSize: 16,
    marginBottom: 15,
    color: '#34495e',
    lineHeight: 24,
  },
  detail: {
    fontSize: 16,
    marginBottom: 8,
    color: '#2c3e50',
  },
  subTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#2c3e50',
  },
  packageItem: {
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
  },
  packageTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
    color: '#2c3e50',
  },
  packageDescription: {
    marginBottom: 8,
    color: '#7f8c8d',
  },
  packagePrice: {
    fontWeight: '500',
    color: '#28a745',
    marginBottom: 4,
  },
  packageDelivery: {
    color: '#34495e',
    marginBottom: 4,
  },
  packageRevisions: {
    color: '#34495e',
  },
  noPackagesText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorText: {
    textAlign: 'center',
    color: '#e74c3c',
    marginTop: 10,
    fontSize: 16,
  },
});

export default ViewGigDetailsSeller;
