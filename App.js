import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import ProgramsScreen from './src/screens/ProgramsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import ExerciseHistoryScreen from './src/screens/ExerciseHistoryScreen';
import CustomProgramScreen from './src/screens/CustomProgramScreen';
import SessionSummaryScreen from './src/screens/SessionSummaryScreen';
import CardioScreen from './src/screens/CardioScreen';

import { colors, spacing } from './src/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Home:     { default: '⌂', active: '⌂' },
  Programs: { default: '▤', active: '▤' },
  Profile:  { default: '◈', active: '◈' },
};

function TabIcon({ name, focused }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>
        {TAB_ICONS[name]?.default ?? '·'}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  iconWrapActive: {
    backgroundColor: colors.bgInput,
  },
  icon: {
    fontSize: 18,
    color: colors.secondary,
  },
  iconActive: {
    color: colors.primary,
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: 22,
          height: 76,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 2,
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     options={{ tabBarLabel: 'HOME' }} />
      <Tab.Screen name="Programs" component={ProgramsScreen} options={{ tabBarLabel: 'PROGRAMS' }} />
      <Tab.Screen name="Profile"  component={ProfileScreen}  options={{ tabBarLabel: 'PROFILE' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              cardStyle: { backgroundColor: colors.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="Main"            component={MainTabs} />
            <Stack.Screen name="Workout"         component={WorkoutScreen} />
            <Stack.Screen name="SessionSummary"  component={SessionSummaryScreen} />
            <Stack.Screen name="Cardio"          component={CardioScreen} />
            <Stack.Screen name="ExerciseHistory" component={ExerciseHistoryScreen} />
            <Stack.Screen name="CustomProgram"   component={CustomProgramScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
