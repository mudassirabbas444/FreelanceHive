import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image,StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchData } from '../api';

function ViewGigsSeller() {
  const navigation = useNavigation();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    price: '',
    status: '',
  });

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
    const fetchGigs = async () => {
      try {
        const sellerId = JSON.parse(await AsyncStorage.getItem("user"))?.id;
        if (!sellerId) {
          throw new Error("Seller ID not found in session.");
        }

        const filterString = JSON.stringify(filters);
        const data = await fetchData(`/gigs/seller?sellerId=${sellerId}&filters=${encodeURIComponent(filterString)}`);
        setGigs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, [filters]);

  const handleViewDetails = (gigId) => {
    navigation.navigate('GigSellerDetails', { gigId });
  };

  const handleCreateGig = () => {
    navigation.navigate('CreateGig');
  };

  const renderGigItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.gigItem}
      onPress={() => handleViewDetails(item._id)}
      activeOpacity={0.8}
    >
      {item.images ? (
        <Image
          source={{ uri: item.images.startsWith('http') ? item.images : `http://192.168.1.107:4000${item.images}` }}
          style={styles.gigImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.gigInfo}>
        <Text style={styles.gigTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.gigDescription} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.gigCategory}>Category: {item.category}</Text>
        <Text style={styles.gigPrice}>Price: ${item.pricePackages && item.pricePackages[0]?.price || 'N/A'}</Text>
        <Text style={styles.gigStatus}>Status: {item.status}</Text>
        <View style={styles.detailsButton}>
          <Text style={styles.buttonText}>View Details</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading your gigs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="dark" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => setLoading(true)}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Gigs</Text>
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={handleCreateGig}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Create New Gig</Text>
        </TouchableOpacity>
      </View>

      {gigs.length > 0 ? (
        <FlatList
          data={gigs}
          renderItem={renderGigItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.noGigsText}>You haven't created any gigs yet</Text>
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={handleCreateGig}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Create Your First Gig</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  createButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listContainer: {
    paddingBottom: 20,
  },
  gigItem: {
    flexDirection: 'row',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 15,
    padding: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  gigImage: {
    width: 120,
    height: 120,
    marginRight: 15,
    borderRadius: 10,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    marginRight: 15,
    borderRadius: 10,
  },
  placeholderText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  gigInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  gigTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#2c3e50',
  },
  gigDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  gigCategory: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 4,
  },
  gigPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2ecc71',
    marginBottom: 4,
  },
  gigStatus: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  detailsButton: {
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noGigsText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
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
  retryButton: {
    padding: 15,
    backgroundColor: '#007BFF',
    borderRadius: 10,
  },
});

export default ViewGigsSeller;
