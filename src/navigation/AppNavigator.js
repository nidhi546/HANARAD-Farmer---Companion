import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// ── Auth / Onboarding screens ──────────────────────────────────────────────
import SplashScreen          from '../screens/SplashScreen';
import LanguageSelectScreen  from '../screens/LanguageSelectScreen';
import OnboardingScreen      from '../screens/OnboardingScreen';
import LoginScreen           from '../screens/LoginScreen';
import RegisterScreen        from '../screens/RegisterScreen';
import ForgotPasswordScreen  from '../screens/ForgotPasswordScreen';
import LocationScreen        from '../screens/LocationScreen';

// ── Main app screens ───────────────────────────────────────────────────────
import HomeScreen            from '../screens/HomeScreen';
import WeatherScreen         from '../screens/WeatherScreen';
import HistoricalScreen      from '../screens/HistoricalScreen';
import CropAdvisorScreen     from '../screens/CropAdvisorScreen';
import AlertsScreen          from '../screens/AlertsScreen';
import ProfileScreen         from '../screens/ProfileScreen';
import EditProfileScreen     from '../screens/EditProfileScreen';
import HelpSupportScreen     from '../screens/HelpSupportScreen';

// ── New feature screens (free APIs) ───────────────────────────────────────
import MandiScreen           from '../screens/MandiScreen';
import IrrigationScreen      from '../screens/IrrigationScreen';
import DiseaseScanScreen     from '../screens/DiseaseScanScreen';
import GovtSchemesScreen     from '../screens/GovtSchemesScreen';
import ExpertHelpScreen      from '../screens/ExpertHelpScreen';
import NearbyStoresScreen    from '../screens/NearbyStoresScreen';
import SowingCalendarScreen  from '../screens/SowingCalendarScreen';
import NasaSurfaceScreen    from '../screens/NasaSurfaceScreen';
import NasaWeatherHubScreen         from '../screens/NasaWeatherHubScreen';
import SurfaceRoughnessAllScreen    from '../screens/SurfaceRoughnessAllScreen';

import DrawerContent from '../components/DrawerContent';

const Stack  = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        // 'front' = drawer slides OVER screen, no background shift
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.45)',
        drawerStyle: { width: 290 },
        swipeEnabled: true,
        swipeEdgeWidth: 40,
      }}
    >
      {/* ── Core navigation (shown in side drawer menu) ── */}
      <Drawer.Screen name="Home"        component={HomeScreen}        />
      <Drawer.Screen name="Weather"     component={WeatherScreen}     />
      <Drawer.Screen name="History"     component={HistoricalScreen}  />
      <Drawer.Screen name="Crops"       component={CropAdvisorScreen} />
      <Drawer.Screen name="Alerts"      component={AlertsScreen}      />
      <Drawer.Screen name="Profile"     component={ProfileScreen}     />
      <Drawer.Screen name="HelpSupport" component={HelpSupportScreen} />

      {/* ── Feature screens (navigated from HomeScreen cards) ── */}
      <Drawer.Screen name="Mandi"        component={MandiScreen}       />
      <Drawer.Screen name="Irrigation"   component={IrrigationScreen}  />
      <Drawer.Screen name="DiseaseScan"  component={DiseaseScanScreen} />
      <Drawer.Screen name="GovtSchemes"  component={GovtSchemesScreen} />
      <Drawer.Screen name="ExpertHelp"   component={ExpertHelpScreen}  />
      <Drawer.Screen name="NearbyStores"    component={NearbyStoresScreen}   />
      <Drawer.Screen name="SowingCalendar" component={SowingCalendarScreen} />
      <Drawer.Screen name="NasaSurface"    component={NasaSurfaceScreen}    />
      <Drawer.Screen name="NasaWeatherHub" component={NasaWeatherHubScreen} />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Splash"         component={SplashScreen}         />
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen}  />
      <Stack.Screen name="Onboarding"     component={OnboardingScreen}      />
      <Stack.Screen name="Login"          component={LoginScreen}           />
      <Stack.Screen name="Register"       component={RegisterScreen}        />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen}  />
      <Stack.Screen name="Location"       component={LocationScreen}        />
      <Stack.Screen name="Main"           component={MainDrawer}            />
      <Stack.Screen name="EditProfile"          component={EditProfileScreen}          />
      <Stack.Screen name="SurfaceRoughnessAll"  component={SurfaceRoughnessAllScreen}  />
    </Stack.Navigator>
  );
}
