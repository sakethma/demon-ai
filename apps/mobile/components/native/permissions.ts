import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

export async function requestPermissionsWithRationale() {
  // Pre-permission rationale dialog
  await new Promise<void>((resolve) => {
    Alert.alert(
      "Demon Requires Permissions",
      "Demon needs access to your Camera (for vision tools), Microphone (for voice commands), and Notifications (for reminders) to function as a full assistant.",
      [{ text: "Continue", onPress: () => resolve() }]
    );
  });

  const { status: notifStatus } = await Notifications.requestPermissionsAsync();
  const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
  const { status: audioStatus } = await Audio.requestPermissionsAsync();

  return {
    notifications: notifStatus === 'granted',
    camera: cameraStatus === 'granted',
    audio: audioStatus === 'granted',
  };
}
