/**
 * App Navigator - Premium SaaS Design
 * Main navigation with bottom tabs
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { colors } from '../styles/theme';

export type AppStackParamList = {
  MainTabs: undefined;
  DocumentDetail: { id: string };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DocumentDetail" 
        component={PlaceholderDetailScreen}
        options={{ title: 'Detalhes do Documento' }}
      />
    </Stack.Navigator>
  );
}

// Placeholder for document detail screen
function PlaceholderDetailScreen() {
  return null;
}

export default AppNavigator;
