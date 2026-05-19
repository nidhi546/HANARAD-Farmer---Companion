import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { requestCameraPermission, requestMediaLibraryPermission } from './permissions';

const SQUARE_OPTIONS = {
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

export async function pickFromGallery(t) {
  const granted = await requestMediaLibraryPermission(t);
  if (!granted) return null;

  try {
    const res = await ImagePicker.launchImageLibraryAsync(SQUARE_OPTIONS);
    if (res.canceled) return null;
    const uri = res.assets?.[0]?.uri;
    if (!uri) return null;
    return uri;
  } catch (err) {
    console.warn('[imagePicker] gallery error:', err?.message);
    Alert.alert(
      t ? t('error') : 'Error',
      'Unable to open photo library. Please try again.',
    );
    return null;
  }
}

export async function pickFromCamera(t) {
  const granted = await requestCameraPermission(t);
  if (!granted) return null;

  try {
    const res = await ImagePicker.launchCameraAsync(SQUARE_OPTIONS);
    if (res.canceled) return null;
    const uri = res.assets?.[0]?.uri;
    if (!uri) return null;
    return uri;
  } catch (err) {
    console.warn('[imagePicker] camera error:', err?.message);
    Alert.alert(
      t ? t('error') : 'Error',
      'Unable to open camera. Please try again.',
    );
    return null;
  }
}
