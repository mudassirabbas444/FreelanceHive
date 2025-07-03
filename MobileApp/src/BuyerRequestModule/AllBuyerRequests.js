import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const BASE_URL = 'http://192.168.1.107:4000';

function AllBuyerRequests() {
  const [buyerRequests, setBuyerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchAllBuyerRequests();
  }, []);

  const fetchAllBuyerRequests = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        Alert.alert('Error', 'Please login first');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/buyer-requests`);
      if (!response.ok) throw new Error('Failed to fetch buyer requests');
      const data = await response.json();
      setBuyerRequests(data);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: '#FFA500',
      active: '#4CD964',
      completed: '#007AFF'
    };
    return statusColors[status.toLowerCase()] || '#8E8E93';
  };

  const renderRequestItem = ({ item }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => navigation.navigate('BuyerRequestDetailSeller', { requestId: item.requestId })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Icon name="tag" size={14} color="#8E8E93" />
          <Text style={styles.metaText}>{item.category}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="dollar" size={14} color="#8E8E93" />
          <Text style={styles.metaText}>${item.price}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="clock-o" size={14} color="#8E8E93" />
          <Text style={styles.metaText}>{item.deliveryTime} days</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.viewButton}
        onPress={() => navigation.navigate('BuyerRequestDetailSeller', { requestId: item.requestId })}
      >
        <Text style={styles.viewButtonText}>View Details</Text>
        <Icon name="chevron-right" size={14} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Requests</Text>
        <Text style={styles.headerSubtitle}>Browse buyer requests to send offers</Text>
      </View>

      {buyerRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={60} color="#C7C7CC" />
          <Text style={styles.emptyText}>No Requests Available</Text>
          <Text style={styles.emptySubtext}>
            Check back later for new requests
          </Text>
        </View>
      ) : (
        <FlatList
          data={buyerRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.requestId.toString()}
          contentContainerStyle={styles.requestsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  requestsList: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AllBuyerRequests; 