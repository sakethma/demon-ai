import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

export async function speakText(text: string) {
  Speech.speak(text, {
    language: 'en',
    pitch: 1.0,
    rate: 1.0,
  });
}

export function stopSpeaking() {
  Speech.stop();
}

let recording: Audio.Recording | null = null;

export async function startRecording() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recording = newRecording;
  } catch (err) {
    console.error('Failed to start recording', err);
  }
}

export async function stopRecordingAndGetFileUri(): Promise<string | null> {
  if (!recording) return null;
  
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  recording = null;
  
  return uri;
}
