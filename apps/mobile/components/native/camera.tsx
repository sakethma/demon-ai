import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Camera, CameraType } from 'expo-camera';

export function VisionTool() {
  const [type, setType] = useState(CameraType.back);
  const cameraRef = useRef<Camera>(null);

  const capturePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      // the base64 string can be sent to Gemini for vision tasks
      return photo.base64;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <Text style={styles.text}>Vision Tool Active</Text>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
