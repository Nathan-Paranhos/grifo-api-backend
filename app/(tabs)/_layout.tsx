import React from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, Building, ClipboardList, User, Plus, FileText, Cog, ClipboardPlus } from 'lucide-react-native';
import { colors } from '../../../src/theme/colors';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.gray[800],
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <Home 
              color={color} 
              size={focused ? size + 2 : size} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="imoveis"
        options={{
          title: 'Imóveis',
          tabBarIcon: ({ color, size, focused }) => (
            <Building 
              color={color} 
              size={focused ? size + 2 : size}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="nova-vistoria"
        options={{
          title: 'Nova Vistoria',
          tabBarIcon: ({ color, size, focused }) => (
            <ClipboardPlus 
              color={color} 
              size={focused ? size + 2 : size}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vistorias"
        options={{
          title: 'Vistorias',
          tabBarIcon: ({ color, size, focused }) => (
            <ClipboardList 
              color={color} 
              size={focused ? size + 2 : size}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="relatorios"
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color, size, focused }) => (
            <FileText 
              color={color} 
              size={focused ? size + 2 : size}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <User 
              color={color} 
              size={focused ? size + 2 : size}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configurações',
          tabBarIcon: ({ color, size, focused }) => (
            <Cog 
              color={color} 
              size={focused ? size + 2 : size}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}