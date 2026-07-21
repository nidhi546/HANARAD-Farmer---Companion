import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

async function _handleDenied(canAskAgain, title, msg, t) {
  if (canAskAgain) {
    Alert.alert(title, msg);
    return;
  }
  Alert.alert(
    title,
    t ? t('permDeniedMsg') : 'This permission is required. Open Settings to enable it.',
    [
      { text: t ? t('cancel') : 'Cancel', style: 'cancel' },
      { text: t ? t('openSettings') : 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );
}

export async function requestCameraPermission(t) {
  const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
  if (status === 'granted') return true;
  await _handleDenied(
    canAskAgain,
    t ? t('permDeniedTitle') : 'Camera Access Needed',
    t ? t('perm_camera_desc') : 'Camera permission is required to take a profile photo.',
    t,
  );
  return false;
}

export async function requestMediaLibraryPermission(t) {
  // Android 13+ (API 33+) uses the system Photo Picker which is permission-less
  if (Platform.OS === 'android' && Platform.Version >= 33) return true;

  const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status === 'granted') return true;
  await _handleDenied(
    canAskAgain,
    t ? t('permDeniedTitle') : 'Photo Library Access Needed',
    t ? t('perm_gallery_desc') : 'Photo library permission is required to choose a profile photo.',
    t,
  );
  return false;
}
