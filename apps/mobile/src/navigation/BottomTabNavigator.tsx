/**
 * BottomTabNavigator - Premium SaaS Design
 * Mobile bottom navigation with 5 tabs + center FAB
 */

import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../styles/theme';

// Import screens (placeholder for now)
import { HomeScreen } from '../screens/HomeScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { UploadScreen } from '../screens/UploadScreen';
import { ExpiringScreen } from '../screens/ExpiringScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.zinc[400],
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          tabBarLabel: 'Documentos',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'folder' : 'folder-outline'} color={color} />
          ),
        }}
      />
      
      {/* Center FAB - Add Button */}
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => (
            <CenterFAB {...props} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Expiring"
        component={ExpiringScreen}
        options={{
          tabBarLabel: 'Vencimentos',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'time' : 'time-outline'} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Tab Icon Component
function TabIcon({ name, color }: { name: keyof typeof Ionicons.glyphMap; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

// Center FAB Button
function CenterFAB({ onPress, accessibilityState }: any) {
  const isSelected = accessibilityState?.selected;
  
  return (
    <TouchableOpacity
      style={styles.fabContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[
        styles.fab,
        isSelected && styles.fabSelected,
      ]}>
        <Ionicons 
          name="camera" 
          size={28} 
          color={colors.white}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 0,
    height: layout.tabBar.height,
    paddingBottom: layout.tabBar.paddingBottom,
    ...shadows.lg,
  },
  tabLabel: {
    fontSize: typography.fontSize['2xs'],
    fontWeight: typography.fontWeight.medium,
    marginTop: -2,
  },
  fabContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  fabSelected: {
    backgroundColor: colors.primary[600],
    transform: [{ scale: 1.05 }],
  },
});

// Need layout import
import { layout } from '../styles/theme';

export default BottomTabNavigator;
