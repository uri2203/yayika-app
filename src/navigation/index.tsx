import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, typography } from '../config/theme';
import LoadingSpinner from '../components/LoadingSpinner';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main screens
import HomeScreen from '../screens/main/HomeScreen';
import ProductsScreen from '../screens/main/ProductsScreen';
import MembershipScreen from '../screens/main/MembershipScreen';
import AffiliateScreen from '../screens/main/AffiliateScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ChatScreen from '../screens/main/ChatScreen';
import StoreScreen from '../screens/main/StoreScreen';
import CoursesScreen from '../screens/main/CoursesScreen';
import CycleTrackerScreen from '../screens/main/CycleTrackerScreen';
import FinancialTrackerScreen from '../screens/main/FinancialTrackerScreen';
import WalletScreen from '../screens/main/WalletScreen';
import RankingsScreen from '../screens/main/RankingsScreen';
import ChallengesScreen from '../screens/main/ChallengesScreen';
import BadgesScreen from '../screens/main/BadgesScreen';
import SupportScreen from '../screens/main/SupportScreen';
import LegalScreen from '../screens/main/LegalScreen';

const AuthStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();

// Stack navigators for each tab
const HomeStack = createStackNavigator();
const ExploreStack = createStackNavigator();
const ProgressStack = createStackNavigator();
const ProfileStack = createStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="CycleTracker" component={CycleTrackerScreen} />
      <HomeStack.Screen name="FinancialTracker" component={FinancialTrackerScreen} />
      <HomeStack.Screen name="Challenges" component={ChallengesScreen} />
      <HomeStack.Screen name="Badges" component={BadgesScreen} />
      <HomeStack.Screen name="Rankings" component={RankingsScreen} />
    </HomeStack.Navigator>
  );
}

function ExploreStackNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="StoreMain" component={StoreScreen} />
      <ExploreStack.Screen name="Products" component={ProductsScreen} />
      <ExploreStack.Screen name="Courses" component={CoursesScreen} />
      <ExploreStack.Screen name="Membership" component={MembershipScreen} />
    </ExploreStack.Navigator>
  );
}

function ProgressStackNavigator() {
  return (
    <ProgressStack.Navigator screenOptions={{ headerShown: false }}>
      <ProgressStack.Screen name="CycleMain" component={CycleTrackerScreen} />
      <ProgressStack.Screen name="FinanceMain" component={FinancialTrackerScreen} />
      <ProgressStack.Screen name="Wallet" component={WalletScreen} />
      <ProgressStack.Screen name="ChallengesMain" component={ChallengesScreen} />
      <ProgressStack.Screen name="BadgesMain" component={BadgesScreen} />
      <ProgressStack.Screen name="RankingsMain" component={RankingsScreen} />
    </ProgressStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="AffiliateMain" component={AffiliateScreen} />
      <ProfileStack.Screen name="Support" component={SupportScreen} />
      <ProfileStack.Screen name="Legal" component={LegalScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtleText,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          paddingTop: 6,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.medium,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'Inicio':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Explorar':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'Mi Progreso':
              iconName = focused ? 'trending-up' : 'trending-up-outline';
              break;
            case 'Laura':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            case 'Perfil':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeStackNavigator} />
      <Tab.Screen name="Explorar" component={ExploreStackNavigator} />
      <Tab.Screen name="Mi Progreso" component={ProgressStackNavigator} />
      <Tab.Screen name="Laura" component={ChatScreen} />
      <Tab.Screen name="Perfil" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={MainTabs} />
    </RootStack.Navigator>
  );
}

export default function Navigation() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      {session ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
