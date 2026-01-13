import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Must be on a real device for push notifications
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device')
    return false
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted')
    return false
  }

  return true
}

/**
 * Get the Expo push token
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    if (!projectId) {
      console.warn('No project ID configured for push notifications')
      return null
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    })

    return token
  } catch (error) {
    console.error('Error getting push token:', error)
    return null
  }
}

/**
 * Schedule a daily review reminder
 */
export async function scheduleReviewReminder(
  hour: number,
  minute: number
): Promise<string | null> {
  try {
    // Cancel existing review reminders
    await cancelReviewReminders()

    // Schedule new reminder
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to Review',
        body: 'You have cards due for review. Keep up your learning streak!',
        sound: true,
        data: { screen: 'review' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    })

    return identifier
  } catch (error) {
    console.error('Error scheduling review reminder:', error)
    return null
  }
}

/**
 * Cancel all review reminder notifications
 */
export async function cancelReviewReminders(): Promise<void> {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync()

    for (const notification of scheduledNotifications) {
      if (notification.content.data?.screen === 'review') {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        )
      }
    }
  } catch (error) {
    console.error('Error canceling review reminders:', error)
  }
}

/**
 * Schedule an immediate notification for testing
 */
export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Notification',
      body: 'This is a test notification from TD2U',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  })
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync()
}

/**
 * Set the badge count on the app icon
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count)
  } catch (error) {
    console.error('Error setting badge count:', error)
  }
}

/**
 * Clear the badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await setBadgeCount(0)
}
