import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from './authNavigation';

// User Module
import ViewProfile from '../UserModule/ViewProfile';
import UpdateProfile from '../UserModule/UpdateProfile';

// Gig Module
import ViewGigs from '../GigModule/ViewGigs';
import ViewGigsSeller from '../GigModule/ViewGigsSeller';
import ViewGigsDetails from '../GigModule/ViewGigsDetails';
import ViewGigDetailsSeller from '../GigModule/ViewGigDetailsSeller';

// Order Module
import ViewOrders from '../OrderModule/ViewOrders';
import ViewOrdersSeller from '../OrderModule/ViewOrdersSeller';
import ViewOrderDetails from '../OrderModule/ViewOrderDetails';
import ViewOrderDetailsSeller from '../OrderModule/ViewOrderDetailsSeller';

// Chat Module
import Chat from '../ChatModule/Chat';
import ChatList from '../ChatModule/ChatList';
import Meeting from '../ChatModule/Meeting';

// Buyer Request Module
import BuyerRequest from '../BuyerRequestModule/BuyerRequest';
import CreateBuyerRequest from '../BuyerRequestModule/CreateBuyerRequest';
import BuyerRequestDetail from '../BuyerRequestModule/BuyerRequestDetail';
import AllBuyerRequests from '../BuyerRequestModule/AllBuyerRequests';
import BuyerRequestDetailSeller from '../BuyerRequestModule/BuyerRequestDetailSeller';

// Idea Pitching Module - Updated paths
import AllIdeas from '../IdeaPitching/AllIdeas';
import CreateIdea from '../IdeaPitching/CreateIdea';
import Ideas from '../IdeaPitching/Ideas';
import IdeaDetailSeller from '../IdeaPitching/IdeaDetailSeller';
import IdeaDetailAdmin from '../IdeaPitching/IdeaDetailAdmin';
import IdeaDetail from '../IdeaPitching/IdeaDetail';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack navigators for each tab section (Buyer)
const BuyerGigsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Gigs" component={ViewGigs} />
    <Stack.Screen name="GigDetails" component={ViewGigsDetails} />
  </Stack.Navigator>
);
const BuyerOrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Orders" component={ViewOrders} />
    <Stack.Screen name="OrderDetails" component={ViewOrderDetails} />
  </Stack.Navigator>
);
const BuyerIdeasStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Ideas" component={Ideas} />
    <Stack.Screen name="CreateIdea" component={CreateIdea} />
    <Stack.Screen name="IdeaDetail" component={IdeaDetail} />
  </Stack.Navigator>
);
const BuyerProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ViewProfile} />
    <Stack.Screen name="UpdateProfile" component={UpdateProfile} />
  </Stack.Navigator>
);

const BuyerTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Gigs') iconName = 'briefcase-outline';
        else if (route.name === 'Orders') iconName = 'list-outline';
        else if (route.name === 'Ideas') iconName = 'bulb-outline';
        else if (route.name === 'Profile') iconName = 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Gigs" component={BuyerGigsStack} />
    <Tab.Screen name="Orders" component={BuyerOrdersStack} />
    <Tab.Screen name="Ideas" component={BuyerIdeasStack} />
    <Tab.Screen name="Profile" component={BuyerProfileStack} />
  </Tab.Navigator>
);


const SellerGigsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="My Gigs" component={ViewGigsSeller} />
    <Stack.Screen name="GigSellerDetails" component={ViewGigDetailsSeller} />
  </Stack.Navigator>
);
const SellerOrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Orders" component={ViewOrdersSeller} />
    <Stack.Screen name="SellerOrderDetails" component={ViewOrderDetailsSeller} />
  </Stack.Navigator>
);
const SellerIdeasStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Ideas" component={AllIdeas} />
    <Stack.Screen name="IdeaDetailSeller" component={IdeaDetailSeller} />
    <Stack.Screen name="IdeaDetailAdmin" component={IdeaDetailAdmin} />
  </Stack.Navigator>
);
const SellerProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ViewProfile} />
    <Stack.Screen name="UpdateProfile" component={UpdateProfile} />
  </Stack.Navigator>
);

const SellerTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'My Gigs') iconName = 'briefcase-outline';
        else if (route.name === 'Orders') iconName = 'list-outline';
        else if (route.name === 'Ideas') iconName = 'bulb-outline';
        else if (route.name === 'Profile') iconName = 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="My Gigs" component={SellerGigsStack} />
    <Tab.Screen name="Orders" component={SellerOrdersStack} />
    <Tab.Screen name="Ideas" component={SellerIdeasStack} />
    <Tab.Screen name="Profile" component={SellerProfileStack} />
  </Tab.Navigator>
);

const MainNavigator = () => {
  const [userRole, setUserRole] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUserRole = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const { role } = JSON.parse(userData);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error loading user role:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserRole();
  }, []);

  if (loading) return null;

  return userRole === 'Seller' ? <SellerTabNavigator /> : <BuyerTabNavigator />;
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Auth">
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;