import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Storage, KEYS } from '../utils/storage';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState({ lat: 23.02, lon: 72.6, city: 'Ahmedabad' });
  const [loading, setLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  useEffect(() => {
    loadSavedLocation();
  }, []);

  const loadSavedLocation = async () => {
    const saved = await Storage.get(KEYS.USER_LOCATION);
    if (saved) setLocation(saved);
  };

  const saveLocation = async (loc) => {
    setLocation(loc);
    await Storage.set(KEYS.USER_LOCATION, loc);
  };

  const getGPSLocation = async () => {
    setLoading(true);
    setGpsError(null);

    try {
      // Step 1: Check if location services are enabled on device
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        const msg = 'GPS is turned off. Please enable Location Services in your device settings.';
        setGpsError(msg);
        setLoading(false);
        return { success: false, reason: 'disabled', message: msg };
      }

      // Step 2: Check existing permission, request if not granted
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: requested } = await Location.requestForegroundPermissionsAsync();
        status = requested;
      }

      if (status !== 'granted') {
        const msg = 'Location permission denied. Please allow it in app settings.';
        setGpsError(msg);
        setLoading(false);
        return { success: false, reason: 'denied', message: msg };
      }

      // Step 3: Get position with timeout safety
      let pos;
      try {
        pos = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            mayShowUserSettingsDialog: true,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 20000)
          ),
        ]);
      } catch (e) {
        const msg = e.message === 'timeout'
          ? 'Location request timed out. Please try again.'
          : 'Could not get your location. Try again.';
        setGpsError(msg);
        setLoading(false);
        return { success: false, reason: e.message === 'timeout' ? 'timeout' : 'error', message: msg };
      }

      // Step 4: Reverse geocode for city name
      let city = 'Your Location';
      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (geo) {
          city = geo.city || geo.district || geo.subregion || geo.region || 'Your Location';
        }
      } catch (_) {}

      const loc = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        city,
      };
      await saveLocation(loc);
      setLoading(false);
      return { success: true, location: loc };

    } catch (e) {
      const msg = 'An unexpected error occurred. Please try again.';
      setGpsError(msg);
      setLoading(false);
      return { success: false, reason: 'error', message: msg };
    }
  };

  return (
    <LocationContext.Provider value={{ location, saveLocation, getGPSLocation, loading, gpsError, setGpsError }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
