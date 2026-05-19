/**
 * AppNavigator — Root stack navigator
 *
 * Auth flow:   Splash → LanguageSelect → Permissions → Onboarding → Login → OTP → ProfileSetup
 * Main app:    MainTabs (BottomTabNavigator) — 5 primary tabs
 * Feature screens push OVER the tabs (full-screen, no tab bar)
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ── Auth / Onboarding ──────────────────────────────────────────────────────
import SplashScreen         from '../screens/SplashScreen';
import LanguageSelectScreen from '../screens/LanguageSelectScreen';
import PermissionScreen     from '../screens/PermissionScreen';
import OnboardingScreen     from '../screens/OnboardingScreen';
import LoginScreen          from '../screens/LoginScreen';
import RegisterScreen       from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OTPScreen            from '../screens/OTPScreen';
import ProfileSetupScreen   from '../screens/ProfileSetupScreen';
import LocationScreen       from '../screens/LocationScreen';

// ── Root navigators ────────────────────────────────────────────────────────
import DrawerNavigator      from './DrawerNavigator';

// ── Legal / Disclaimer screens ─────────────────────────────────────────────
import DisclaimerScreen    from '../screens/DisclaimerScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen         from '../screens/TermsScreen';

// ── Secondary / feature screens (full-screen, no tab bar) ──────────────────
import NotificationsScreen      from '../screens/NotificationsScreen';
import SettingsScreen           from '../screens/SettingsScreen';
import LanguageChangeScreen     from '../screens/LanguageChangeScreen';
import VoiceGuideScreen         from '../screens/VoiceGuideScreen';
import HelpSupportScreen        from '../screens/HelpSupportScreen';
import EditProfileScreen        from '../screens/EditProfileScreen';

// Weather group
import HistoricalScreen         from '../screens/HistoricalScreen';
import AlertsScreen             from '../screens/AlertsScreen';
import LiveForecastScreen       from '../screens/LiveForecastScreen';
import SoilDataScreen           from '../screens/SoilDataScreen';
import NasaSurfaceScreen        from '../screens/NasaSurfaceScreen';
import NasaWeatherHubScreen     from '../screens/NasaWeatherHubScreen';
import SurfaceRoughnessAllScreen from '../screens/SurfaceRoughnessAllScreen';

// Farm group — FarmMap and ManualDraw both resolve to ManualDrawScreen
import ManualDrawScreen         from '../screens/ManualDrawScreen';
import FarmResultScreen         from '../screens/FarmResultScreen';
import FarmDetailScreen         from '../screens/FarmDetailScreen';

// Crops / Disease group
import DiseaseScanScreen        from '../screens/DiseaseScanScreen';
import DiseaseResultScreen      from '../screens/DiseaseResultScreen';
import MandiScreen              from '../screens/MandiScreen';
import IrrigationScreen         from '../screens/IrrigationScreen';
import SowingCalendarScreen     from '../screens/SowingCalendarScreen';
import AddCropScreen            from '../screens/AddCropScreen';
import MyCropsScreen            from '../screens/MyCropsScreen';
import AddCropMasterScreen      from '../screens/AddCropMasterScreen';

// Misc feature screens
import GovtSchemesScreen        from '../screens/GovtSchemesScreen';
import ExpertHelpScreen         from '../screens/ExpertHelpScreen';
import NearbyStoresScreen       from '../screens/NearbyStoresScreen';
import SmartToolsScreen         from '../screens/SmartToolsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* ── Auth / First-launch flow ── */}
      <Stack.Screen name="Splash"          component={SplashScreen}          options={{ animation: 'fade' }} />
      <Stack.Screen name="LanguageSelect"  component={LanguageSelectScreen}  options={{ animation: 'fade' }} />
      <Stack.Screen name="Disclaimer"      component={DisclaimerScreen}      options={{ animation: 'fade' }} />
      <Stack.Screen name="Permissions"     component={PermissionScreen}      />
      <Stack.Screen name="Onboarding"      component={OnboardingScreen}      />
      <Stack.Screen name="Login"           component={LoginScreen}           />
      <Stack.Screen name="Register"        component={RegisterScreen}        />
      <Stack.Screen name="ForgotPassword"  component={ForgotPasswordScreen}  />
      <Stack.Screen name="OTP"             component={OTPScreen}             />
      <Stack.Screen name="ProfileSetup"    component={ProfileSetupScreen}    />
      <Stack.Screen name="Location"        component={LocationScreen}        />

      {/* ── Main app (drawer + bottom tabs) ── */}
      <Stack.Screen
        name="Main"
        component={DrawerNavigator}
        options={{ animation: 'fade', gestureEnabled: false }}
      />

      {/* ── Legal ── */}
      <Stack.Screen name="PrivacyPolicy"   component={PrivacyPolicyScreen}   />
      <Stack.Screen name="Terms"           component={TermsScreen}           />

      {/* ── Profile / Settings ── */}
      <Stack.Screen name="Notifications"   component={NotificationsScreen}   />
      <Stack.Screen name="Settings"        component={SettingsScreen}        />
      <Stack.Screen name="LanguageChange"  component={LanguageChangeScreen}  />
      <Stack.Screen name="VoiceGuide"      component={VoiceGuideScreen}      />
      <Stack.Screen name="HelpSupport"     component={HelpSupportScreen}     />
      <Stack.Screen name="EditProfile"     component={EditProfileScreen}     />

      {/* ── Weather features ── */}
      <Stack.Screen name="LiveForecast"    component={LiveForecastScreen}    />
      <Stack.Screen name="SoilData"        component={SoilDataScreen}        />
      <Stack.Screen name="History"         component={HistoricalScreen}      />
      <Stack.Screen name="Alerts"          component={AlertsScreen}          />
      <Stack.Screen name="NasaSurface"     component={NasaSurfaceScreen}     />
      <Stack.Screen name="NasaWeatherHub"  component={NasaWeatherHubScreen}  />
      <Stack.Screen name="SurfaceRoughnessAll" component={SurfaceRoughnessAllScreen} />

      {/* ── Farm map features ── */}
      <Stack.Screen name="FarmMap"     component={ManualDrawScreen} />
      <Stack.Screen name="ManualDraw"  component={ManualDrawScreen} />
      <Stack.Screen name="FarmResult"  component={FarmResultScreen} />
      <Stack.Screen name="FarmDetail"  component={FarmDetailScreen} />

      {/* ── Crops / Disease features ── */}
      <Stack.Screen name="DiseaseScan"     component={DiseaseScanScreen}     />
      <Stack.Screen name="DiseaseResult"   component={DiseaseResultScreen}   />
      <Stack.Screen name="Mandi"           component={MandiScreen}           />
      <Stack.Screen name="Irrigation"      component={IrrigationScreen}      />
      <Stack.Screen name="SowingCalendar"  component={SowingCalendarScreen}  />
      <Stack.Screen name="AddCrop"         component={AddCropScreen}         />
      <Stack.Screen name="MyCrops"         component={MyCropsScreen}         />
      <Stack.Screen name="AddCropMaster"   component={AddCropMasterScreen}   />

      {/* ── Misc features ── */}
      <Stack.Screen name="GovtSchemes"     component={GovtSchemesScreen}     />
      <Stack.Screen name="ExpertHelp"      component={ExpertHelpScreen}      />
      <Stack.Screen name="NearbyStores"    component={NearbyStoresScreen}    />
      <Stack.Screen name="SmartTools"      component={SmartToolsScreen}      />
    </Stack.Navigator>
  );
}
