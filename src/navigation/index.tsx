import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { typography } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import { supabase } from '../config/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Portal Dashboard
import PortalDashboard from '../screens/portal/PortalDashboard';

// Ciclo Productiva (Course Modules)
import ModuleListScreen from '../screens/courses/ModuleListScreen';
import LessonListScreen from '../screens/courses/LessonListScreen';
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
import CirclesListScreen from '../screens/community/CirclesListScreen';
import CreateCircleScreen from '../screens/community/CreateCircleScreen';
import CircleChatScreen from '../screens/community/CircleChatScreen';

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

// Streak Insurance
import StreakInsuranceScreen from '../screens/portal/StreakInsuranceScreen';

// Profile
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import LegalScreen from '../screens/profile/LegalScreen';

// Shared
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import SupportScreen from '../screens/shared/SupportScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import GrowthCoachScreen from '../screens/shared/GrowthCoachScreen';
import WellnessPlannerScreen from '../screens/shared/WellnessPlannerScreen';
import EmpatheticChatScreen from '../screens/shared/EmpatheticChatScreen';

// Profile
import AutonomySettings from '../screens/profile/AutonomySettings';

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
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function PortalStackNavigator() {
  const { currentColors } = useTheme();
  const colors = currentColors;
  return (
    <PortalStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
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
      <PortalStack.Screen name="Chat" component={ChatScreen} />
      <PortalStack.Screen name="GrowthCoach" component={GrowthCoachScreen} />
      <PortalStack.Screen name="WellnessPlanner" component={WellnessPlannerScreen} />
      <PortalStack.Screen name="StreakInsurance" component={StreakInsuranceScreen} />
      <PortalStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <PortalStack.Screen name="EmpatheticChat" component={EmpatheticChatScreen} />
      <PortalStack.Screen name="AutonomySettings" component={AutonomySettings} />
    </PortalStack.Navigator>
  );
}

function CicloStackNavigator() {
  const { currentColors } = useTheme();
  const colors = currentColors;
  return (
    <CicloStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
      <CicloStack.Screen name="ModuleList" component={ModuleListScreen} />
      <CicloStack.Screen name="LessonList" component={LessonListScreen} />
      <CicloStack.Screen name="LessonViewer" component={LessonViewerScreen} />
      <CicloStack.Screen name="CycleIntelligence" component={CycleIntelligenceScreen} />
      <CicloStack.Screen name="CycleLog" component={CycleLogScreen} />
      <CicloStack.Screen name="CycleCoach" component={CycleCoachScreen} />
    </CicloStack.Navigator>
  );
}

function RetosStackNavigator() {
  const { currentColors } = useTheme();
  const colors = currentColors;
  return (
    <RetosStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
      <RetosStack.Screen name="ChallengesMain" component={ChallengesScreen} />
    </RetosStack.Navigator>
  );
}

function ComunidadStackNavigator() {
  const { currentColors } = useTheme();
  const colors = currentColors;
  return (
    <ComunidadStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
      <ComunidadStack.Screen name="CommunityFeed" component={CommunityFeedScreen} />
      <ComunidadStack.Screen name="PostDetail" component={PostDetailScreen} />
      <ComunidadStack.Screen name="CirclesList" component={CirclesListScreen} />
      <ComunidadStack.Screen name="CreateCircle" component={CreateCircleScreen} />
      <ComunidadStack.Screen name="CircleChat" component={CircleChatScreen} />
    </ComunidadStack.Navigator>
  );
}

function FinanzasStackNavigator() {
  const { currentColors } = useTheme();
  const colors = currentColors;
  return (
    <FinanzasStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
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
  const { flags } = useFeatureFlags();
  const flagKey = `${flags.courses}-${flags.weekly_challenges}-${flags.community}`;
  return (
    <Tab.Navigator
      key={flagKey}
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
      {flags.courses && <Tab.Screen name="Ciclo" component={CicloStackNavigator} />}
      {flags.weekly_challenges && <Tab.Screen name="Retos" component={RetosStackNavigator} />}
      {flags.community && <Tab.Screen name="Comunidad" component={ComunidadStackNavigator} />}
      <Tab.Screen name="Finanzas" component={FinanzasStackNavigator} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { currentColors } = useTheme();
  const colors = currentColors;
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}>
      <RootStack.Screen name="MainTabs" component={MainTabs} />
    </RootStack.Navigator>
  );
}

export default function Navigation() {
  const { session, loading, justRegistered, clearJustRegistered } = useAuth();
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const navRef = useRef<NavigationContainerRef<any>>(null);
  const [pendingResetPassword, setPendingResetPassword] = useState(false);

  const handleDeepLink = useCallback(async ({ url }: { url: string }) => {
    if (url.includes('type=recovery')) {
      const match = url.match(/code=([^&]+)/);
      if (match) {
        const { error } = await supabase.auth.exchangeCodeForSession(match[1]);
        if (!error) {
          setPendingResetPassword(true);
        }
      }
    }
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [handleDeepLink]);

  useEffect(() => {
    if (pendingResetPassword && session && navRef.current) {
      setPendingResetPassword(false);
      const timer = setTimeout(() => {
        navRef.current?.navigate('MainTabs', {
          screen: 'Portal',
          params: {
            screen: 'ResetPassword',
          },
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pendingResetPassword, session]);

  useEffect(() => {
    if (justRegistered && session && navRef.current) {
      const timer = setTimeout(() => {
        navRef.current?.navigate('MainTabs', {
          screen: 'Portal',
          params: {
            screen: 'Onboarding',
          },
        });
        clearJustRegistered();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [justRegistered, session, clearJustRegistered]);

  if (loading || flagsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer ref={navRef}>
      {session ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
