/**
 * Navigation Types
 * Centralized type definitions for React Navigation
 */

import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// App Stack (Authenticated)
export type AppStackParamList = {
  MainTabs: undefined;
  DocumentDetail: { id: string };
  Processing: { documentId: string };
};

// Main Tabs (Bottom Tabs)
export type MainTabParamList = {
  Home: undefined;
  Documents: undefined;
  Upload: undefined;
  Expiring: undefined;
  Profile: undefined;
};

// Navigation prop for screens inside MainTabs that need to navigate to AppStack screens
export type MainTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<AppStackParamList>
>;