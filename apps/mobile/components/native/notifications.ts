import * as Notifications from 'expo-notifications';

// Configure how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setReminder(title: string, body: string, triggerTimeMs: number) {
  const trigger = new Date(triggerTimeMs);
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger,
  });
}
