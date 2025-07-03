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

const Stack = createStackNavigator();

const BuyerNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#007BFF',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    {/* Buyer-specific screens */}
    <Stack.Screen 
      name="Gigs" 
      component={ViewGigs}
      options={{ title: 'Available Gigs' }}
    />
    <Stack.Screen 
      name="GigDetails" 
      component={ViewGigsDetails}
      options={{ title: 'Gig Details' }}
    />
    <Stack.Screen 
      name="Orders" 
      component={ViewOrders}
      options={{ title: 'My Orders' }}
    />
    <Stack.Screen 
      name="OrderDetails" 
      component={ViewOrderDetails}
      options={{ title: 'Order Details' }}
    />
    <Stack.Screen 
      name="CreateIdea" 
      component={CreateIdea}
      options={{ title: 'Create New Idea' }}
    />
    <Stack.Screen 
      name="Ideas" 
      component={Ideas}
      options={{ title: 'My Ideas' }}
    />
    <Stack.Screen 
      name="IdeaDetail" 
      component={IdeaDetail}
      options={{ title: 'Idea Details' }}
    />
    <Stack.Screen 
      name="BuyerRequests" 
      component={BuyerRequest}
      options={{ title: 'My Requests' }}
    />
    <Stack.Screen 
      name="CreateBuyerRequest" 
      component={CreateBuyerRequest}
      options={{ title: 'Create Request' }}
    />
    <Stack.Screen 
      name="BuyerRequestDetail" 
      component={BuyerRequestDetail}
      options={{ title: 'Request Details' }}
    />
    {/* Common screens */}
    <Stack.Screen name="Chat" component={Chat} />
    <Stack.Screen 
      name="ChatList" 
      component={ChatList}
      options={{ title: 'Chats' }}
    />
    <Stack.Screen 
      name="Meeting" 
      component={Meeting}
      options={{ title: 'Meeting' }}
    />
    <Stack.Screen 
      name="Profile" 
      component={ViewProfile}
      options={{ title: 'My Profile' }}
    />
    <Stack.Screen 
      name="UpdateProfile" 
      component={UpdateProfile}
      options={{ title: 'Edit Profile' }}
    />
  </Stack.Navigator>
);

const SellerNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#007BFF',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    {/* Seller-specific screens */}
    <Stack.Screen 
      name="SellerGigs" 
      component={ViewGigsSeller}
      options={{ title: 'My Gigs' }}
    />
    <Stack.Screen 
      name="GigSellerDetails" 
      component={ViewGigDetailsSeller}
      options={{ title: 'Gig Details' }}
    />
    <Stack.Screen 
      name="SellerOrders" 
      component={ViewOrdersSeller}
      options={{ title: 'Orders Received' }}
    />
    <Stack.Screen 
      name="SellerOrderDetails" 
      component={ViewOrderDetailsSeller}
      options={{ title: 'Order Details' }}
    />
    <Stack.Screen 
      name="AllIdeas" 
      component={AllIdeas}
      options={{ title: 'Available Ideas' }}
    />
    <Stack.Screen 
      name="IdeaDetailSeller" 
      component={IdeaDetailSeller}
      options={{ title: 'Idea Details' }}
    />
    <Stack.Screen 
      name="AllBuyerRequests" 
      component={AllBuyerRequests}
      options={{ title: 'Available Requests' }}
    />
    <Stack.Screen 
      name="BuyerRequestDetailSeller" 
      component={BuyerRequestDetailSeller}
      options={{ title: 'Request Details' }}
    />
    {/* Common screens */}
    <Stack.Screen name="Chat" component={Chat} />
    <Stack.Screen 
      name="ChatList" 
      component={ChatList}
      options={{ title: 'Chats' }}
    />
    <Stack.Screen 
      name="Meeting" 
      component={Meeting}
      options={{ title: 'Meeting' }}
    />
    <Stack.Screen 
      name="Profile" 
      component={ViewProfile}
      options={{ title: 'My Profile' }}
    />
    <Stack.Screen 
      name="UpdateProfile" 
      component={UpdateProfile}
      options={{ title: 'Edit Profile' }}
    />
  </Stack.Navigator>
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

  return userRole === 'Seller' ? <SellerNavigator /> : <BuyerNavigator />;
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