import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from './app/screens/HomeScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerStyle: {
            backgroundColor: '#00aced',
          },
          headerTintColor: '#fff',
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={ HomeScreen } 
          options={{
            title: 'Blue Connect'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
