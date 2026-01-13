import { useState, useEffect, useCallback } from 'react'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  requestNotificationPermissions,
  scheduleReviewReminder,
  cancelReviewReminders,
} from '@/lib/notifications'

const REMINDER_ENABLED_KEY = '@td2u:reminder_enabled'
const REMINDER_TIME_KEY = '@td2u:reminder_time'

interface ReminderSettings {
  enabled: boolean
  hour: number
  minute: number
}

interface UseNotificationsReturn {
  isEnabled: boolean
  reminderTime: { hour: number; minute: number }
  isLoading: boolean
  hasPermission: boolean
  enableReminder: () => Promise<boolean>
  disableReminder: () => Promise<void>
  setReminderTime: (hour: number, minute: number) => Promise<void>
  checkPermission: () => Promise<boolean>
}

export function useNotifications(): UseNotificationsReturn {
  const [isEnabled, setIsEnabled] = useState(false)
  const [reminderTime, setReminderTimeState] = useState({ hour: 9, minute: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)

  // Load saved settings
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)

      // Check if reminders are enabled
      const enabledStr = await AsyncStorage.getItem(REMINDER_ENABLED_KEY)
      const enabled = enabledStr === 'true'
      setIsEnabled(enabled)

      // Load saved reminder time
      const timeStr = await AsyncStorage.getItem(REMINDER_TIME_KEY)
      if (timeStr) {
        const { hour, minute } = JSON.parse(timeStr)
        setReminderTimeState({ hour, minute })
      }

      // Check current permission status
      const { status } = await Notifications.getPermissionsAsync()
      setHasPermission(status === 'granted')
    } catch (error) {
      console.error('Error loading notification settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions()
    setHasPermission(granted)
    return granted
  }, [])

  const enableReminder = useCallback(async (): Promise<boolean> => {
    try {
      // Request permission if not granted
      const granted = await checkPermission()
      if (!granted) {
        return false
      }

      // Schedule the reminder
      const identifier = await scheduleReviewReminder(
        reminderTime.hour,
        reminderTime.minute
      )

      if (identifier) {
        await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'true')
        setIsEnabled(true)
        return true
      }

      return false
    } catch (error) {
      console.error('Error enabling reminder:', error)
      return false
    }
  }, [reminderTime, checkPermission])

  const disableReminder = useCallback(async (): Promise<void> => {
    try {
      await cancelReviewReminders()
      await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'false')
      setIsEnabled(false)
    } catch (error) {
      console.error('Error disabling reminder:', error)
    }
  }, [])

  const setReminderTime = useCallback(
    async (hour: number, minute: number): Promise<void> => {
      try {
        const newTime = { hour, minute }
        await AsyncStorage.setItem(REMINDER_TIME_KEY, JSON.stringify(newTime))
        setReminderTimeState(newTime)

        // If reminders are enabled, reschedule with new time
        if (isEnabled) {
          await scheduleReviewReminder(hour, minute)
        }
      } catch (error) {
        console.error('Error setting reminder time:', error)
      }
    },
    [isEnabled]
  )

  return {
    isEnabled,
    reminderTime,
    isLoading,
    hasPermission,
    enableReminder,
    disableReminder,
    setReminderTime,
    checkPermission,
  }
}
