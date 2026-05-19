import 'react-native-gesture-handler';
import React, { useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer }   from '@react-navigation/native';
import { SafeAreaProvider }      from 'react-native-safe-area-context';
import { AuthProvider }          from './src/context/AuthContext';
import { LocationProvider }      from './src/context/LocationContext';
import { LanguageProvider }      from './src/context/LanguageContext';
import { ThemeProvider }         from './src/context/ThemeContext';
import { NotificationProvider }  from './src/context/NotificationContext';
import InAppNotification         from './src/components/InAppNotification';
import AppNavigator              from './src/navigation/AppNavigator';

export default function App() {
  // Shared navigation ref so NotificationContext can navigate on notification tap
  const navigationRef = useRef(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <LocationProvider>
                <NotificationProvider navigationRef={navigationRef}>
                  <NavigationContainer ref={navigationRef}>
                    <AppNavigator />
                    {/* Global in-app notification banner — renders above all screens */}
                    <InAppNotification />
                  </NavigationContainer>
                </NotificationProvider>
              </LocationProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
