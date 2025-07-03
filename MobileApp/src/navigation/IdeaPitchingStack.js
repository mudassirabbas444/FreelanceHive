import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import AllIdeas from '../IdeaPitching/AllIdeas';
import CreateIdea from '../IdeaPitching/CreateIdea';
import Ideas from '../IdeaPitching/Ideas';
import IdeaDetailSeller from '../IdeaPitching/IdeaDetailSeller';
import IdeaDetail from '../IdeaPitching/IdeaDetail';
import IdeaDetailAdmin from '../IdeaPitching/IdeaDetailAdmin';

const Stack = createStackNavigator();

const IdeaPitchingStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
        headerStyle: {
          backgroundColor: '#007BFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="AllIdeas" component={AllIdeas} />
      <Stack.Screen name="CreateIdea" component={CreateIdea} />
      <Stack.Screen name="Ideas" component={Ideas} />
      <Stack.Screen name="IdeaDetailSeller" component={IdeaDetailSeller} />
      <Stack.Screen name="IdeaDetail" component={IdeaDetail} />
      <Stack.Screen name="IdeaDetailAdmin" component={IdeaDetailAdmin} />
    </Stack.Navigator>
  );
};

export default IdeaPitchingStack; 