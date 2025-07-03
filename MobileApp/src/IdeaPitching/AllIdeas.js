import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  RefreshControl,
  StatusBar
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');

const AllIdeas = () => {
  const navigation = useNavigation();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  const categories = [
    "Web Development",
    "Mobile Development",
    "UI/UX Design",
    "Graphic Design",
    "Content Writing",
    "Digital Marketing",
    "Data Science",
    "Machine Learning",
    "Other"
  ];

  const fetchIdeas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('token');
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`${API_URL}/api/ideas?${queryParams}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ideas");
      }

      const data = await response.json();
      setIdeas(data);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      setError("Failed to fetch ideas. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

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
        if (!['Admin', 'Seller'].includes(parsedUser.role)) {
          Alert.alert('Access Denied', 'Unauthorized access.');
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
  }, []);

  useEffect(() => {
    if (user) {
      fetchIdeas();
    }
  }, [user, fetchIdeas]);

  const handleViewDetails = (idea) => {
    if (!user || !user.role) {
      Alert.alert('Error', 'Unauthorized: No role assigned.');
      return;
    }

    if (user.role === 'Admin') {
      navigation.navigate('IdeaDetailAdmin', { ideaId: idea.ideaId });
    } else if (user.role === 'Seller') {
      navigation.navigate('IdeaDetailSeller', { ideaId: idea.ideaId });
    } else {
      Alert.alert('Error', 'Unauthorized: Invalid role.');
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIdeas();
  }, [fetchIdeas]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#ffc107';
      case 'approved':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      case 'closed':
        return '#6c757d';
      case 'open':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const renderIdeaCard = ({ item: idea }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleViewDetails(idea)}
    >
      <View style={styles.cardContent}>
        <View style={styles.categoryPill}>
          <FontAwesome name="coffee" size={14} color="#666" />
          <Text style={styles.categoryText}>{idea.category}</Text>
        </View>

        <Text style={styles.title}>{idea.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {idea.description}
        </Text>

        <View style={styles.metaInfo}>
          <View style={styles.statusContainer}>
            <Text style={styles.metaLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(idea.status) }]}>
              <Text style={styles.statusText}>{idea.status}</Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.metaLabel}>Created</Text>
            <View style={styles.dateWrapper}>
              <FontAwesome name="calendar" size={12} color="#666" />
              <Text style={styles.dateText}>
                {new Date(idea.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.viewDetailsContainer}>
          <FontAwesome name="chevron-right" size={14} color="#007bff" />
          <Text style={styles.viewDetailsText}>View Details</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💡</Text>
      <Text style={styles.emptyTitle}>No Ideas Found</Text>
      <Text style={styles.emptyText}>
        Try adjusting your filters or pull to refresh
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Explore Ideas</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="ios-filter" size={16} color="#007bff" />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.ideaCount}>{ideas.length} ideas found</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <FlatList
        data={ideas}
        renderItem={renderIdeaCard}
        keyExtractor={item => item.ideaId.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={styles.closeButton}
              >
                <Ionicons name="ios-close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <FlatList
                data={categories}
                horizontal={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      filters.category === item && styles.categoryButtonActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, category: item }))}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        filters.category === item && styles.categoryButtonTextActive
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={item => item}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={() => {
                  setFilters({ category: '' });
                  setShowFilters(false);
                  fetchIdeas();
                }}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={() => {
                  setShowFilters(false);
                  fetchIdeas();
                }}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  filterButtonText: {
    color: '#007bff',
    marginLeft: 5,
    fontWeight: '500',
  },
  ideaCount: {
    color: '#666',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 15,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  categoryText: {
    color: '#495057',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212529',
  },
  description: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 15,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flex: 1,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetailsText: {
    color: '#007bff',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212529',
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
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
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  categoryButtonActive: {
    backgroundColor: '#007bff',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#212529',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  clearButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  clearButtonText: {
    color: '#212529',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#007bff',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AllIdeas; 