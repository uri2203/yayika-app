import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { typography } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Portal Dashboard
import PortalDashboard from '../screens/portal/PortalDashboard';

// Ciclo Productiva (Course Modules)
import ModuleListScreen from '../screens/courses/ModuleListScreen';
import LessonViewerScreen from '../screens/courses/LessonViewerScreen';

// Ciclo Inteligente (Cycle Intelligence)
import CycleIntelligenceScreen from '../screens/cycle/CycleIntelligenceScreen';
import CycleLogScreen from '../screens/cycle/CycleLogScreen';
import CycleCoachScreen from '../screens/cycle/CycleCoachScreen';

// Retos (Weekly Challenges)
import ChallengesScreen from '../screens/challenges/ChallengesScreen';

// Comunidad (Community)
import CommunityFeedScreen from '../screens/community/CommunityFeedScreen';
import PostDetailScreen from '../screens/community/PostDetailScreen';

// Finanzas (Finance)
import FinanceDashboardScreen from '../screens/finance/FinanceDashboardScreen';
import BudgetScreen from '../screens/finance/BudgetScreen';
import TransactionsScreen from '../screens/finance/TransactionsScreen';

// Badges/Logros
import BadgesScreen from '../screens/gamification/BadgesScreen';
import RankingsScreen from '../screens/gamification/RankingsScreen';

// Onboarding
import OnboardingFlowScreen from '../screens/onboarding/OnboardingFlowScreen';

// Afiliadas (Affiliates)
import AffiliateDashboardScreen from '../screens/affiliates/AffiliateDashboardScreen';

// Profile
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import LegalScreen from '../screens/profile/LegalScreen';

// Shared
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import SupportScreen from '../screens/shared/SupportScreen';

const AuthStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();

// Stack navigators for each tab
const PortalStack = createStackNavigator();
const CicloStack = createStackNavigator();
const RetosStack = createStackNavigator();
const ComunidadStack = createStackNavigator();
const FinanzasStack = createStackNavigator();

function AuthNavigator() {
  const { currentColors } = useTheme();
  const colors = currentColors;
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

function PortalStackNavigator() {
  return (
    <PortalStack.Navigator screenOptions={{ headerShown: false }}>
      <PortalStack.Screen name="Dashboard" component={PortalDashboard} />
      <PortalStack.Screen name="Badges" component={BadgesScreen} />
      <PortalStack.Screen name="Rankings" component={RankingsScreen} />
      <PortalStack.Screen name="Notifications" component={NotificationsScreen} />
      <PortalStack.Screen name="Profile" component={ProfileScreen} />
      <PortalStack.Screen name="Settings" component={SettingsScreen} />
      <PortalStack.Screen name="Legal" component={LegalScreen} />
      <PortalStack.Screen name="Support" component={SupportScreen} />
      <PortalStack.Screen name="Onboarding" component={OnboardingFlowScreen} />
      <PortalStack.Screen name="AffiliateDashboard" component={AffiliateDashboardScreen} />
    </PortalStack.Navigator>
  );
}

function CicloStackNavigator() {
  return (
    <CicloStack.Navigator screenOptions={{ headerShown: false }}>
      <CicloStack.Screen name="ModuleList" component={ModuleListScreen} />
      <CicloStack.Screen name="LessonViewer" component={LessonViewerScreen} />
      <CicloStack.Screen name="CycleIntelligence" component={CycleIntelligenceScreen} />
      <CicloStack.Screen name="CycleLog" component={CycleLogScreen} />
      <CicloStack.Screen name="CycleCoach" component={CycleCoachScreen} />
    </CicloStack.Navigator>
  );
}

function RetosStackNavigator() {
  return (
    <RetosStack.Navigator screenOptions={{ headerShown: false }}>
      <RetosStack.Screen name="ChallengesMain" component={ChallengesScreen} />
    </RetosStack.Navigator>
  );
}

function ComunidadStackNavigator() {
  return (
    <ComunidadStack.Navigator screenOptions={{ headerShown: false }}>
      <ComunidadStack.Screen name="CommunityFeed" component={CommunityFeedScreen} />
      <ComunidadStack.Screen name="PostDetail" component={PostDetailScreen} />
    </ComunidadStack.Navigator>
  );
}

function FinanzasStackNavigator() {
  return (
    <FinanzasStack.Navigator screenOptions={{ headerShown: false }}>
      <FinanzasStack.Screen name="FinanceDashboard" component={FinanceDashboardScreen} />
      <FinanzasStack.Screen name="Budget" component={BudgetScreen} />
      <FinanzasStack.Screen name="Transactions" component={TransactionsScreen} />
    </FinanzasStack.Navigator>
  );
}

function MainTabs() {
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const colors = currentColors;
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
            case 'Portal':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Ciclo':
              iconName = focused ? 'moon' : 'moon-outline';
              break;
            case 'Retos':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Comunidad':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Finanzas':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabel: (() => {
          switch (route.name) {
            case 'Portal': return t('nav_portal');
            case 'Ciclo': return t('nav_ciclo');
            case 'Retos': return t('nav_retos');
            case 'Comunidad': return t('nav_comunidad');
            case 'Finanzas': return t('nav_finanzas');
            default: return '';
          }
        })(),
      })}
    >
      <Tab.Screen name="Portal" component={PortalStackNavigator} />
      <Tab.Screen name="Ciclo" component={CicloStackNavigator} />
      <Tab.Screen name="Retos" component={RetosStackNavigator} />
      <Tab.Screen name="Comunidad" component={ComunidadStackNavigator} />
      <Tab.Screen name="Finanzas" component={FinanzasStackNavigator} />
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
