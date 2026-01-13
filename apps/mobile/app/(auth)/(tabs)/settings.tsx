import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Card, Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useStats } from '@/hooks/useStats'
import { useNotifications } from '@/hooks/useNotifications'
import { colors } from '@/theme/colors'

export default function SettingsScreen() {
  const { user, signOut, isLoading } = useAuth()
  const { stats } = useStats()
  const {
    isEnabled: reminderEnabled,
    reminderTime,
    hasPermission,
    enableReminder,
    disableReminder,
    setReminderTime,
    checkPermission,
  } = useNotifications()
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedHour, setSelectedHour] = useState(reminderTime.hour)
  const [selectedMinute, setSelectedMinute] = useState(reminderTime.minute)

  const handleReminderToggle = async (value: boolean) => {
    if (value) {
      const success = await enableReminder()
      if (!success) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        )
      }
    } else {
      await disableReminder()
    }
  }

  const handleTimeSelect = async () => {
    await setReminderTime(selectedHour, selectedMinute)
    setShowTimePicker(false)
  }

  const formatTime = (hour: number, minute: number) => {
    const h = hour.toString().padStart(2, '0')
    const m = minute.toString().padStart(2, '0')
    return `${h}:${m}`
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          const { error } = await signOut()
          if (error) {
            Alert.alert('Error', error.message)
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.[0].toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.email}>{user?.email || 'No email'}</Text>
              <Text style={styles.userId}>ID: {user?.id?.slice(0, 8)}...</Text>
            </View>
          </View>
        </Card>

        {/* Notifications Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.notificationRow}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationLabel}>Daily Reminder</Text>
              <Text style={styles.notificationDescription}>
                Get reminded to review your cards
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: colors.gray[300], true: colors.primary[500] }}
              thumbColor={colors.background.light}
            />
          </View>
          {reminderEnabled && (
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timeLabel}>Reminder Time</Text>
              <Text style={styles.timeValue}>
                {formatTime(reminderTime.hour, reminderTime.minute)}
              </Text>
            </TouchableOpacity>
          )}
          {!hasPermission && reminderEnabled && (
            <Text style={styles.permissionWarning}>
              Notification permission required
            </Text>
          )}
        </Card>

        {/* Time Picker Modal */}
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Reminder Time</Text>
              <View style={styles.timePickerRow}>
                <View style={styles.timePickerColumn}>
                  <Text style={styles.timePickerLabel}>Hour</Text>
                  <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 24 }, (_, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.timePickerItem,
                          selectedHour === i && styles.timePickerItemSelected,
                        ]}
                        onPress={() => setSelectedHour(i)}
                      >
                        <Text
                          style={[
                            styles.timePickerItemText,
                            selectedHour === i && styles.timePickerItemTextSelected,
                          ]}
                        >
                          {i.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.timePickerColumn}>
                  <Text style={styles.timePickerLabel}>Minute</Text>
                  <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 60 }, (_, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.timePickerItem,
                          selectedMinute === i && styles.timePickerItemSelected,
                        ]}
                        onPress={() => setSelectedMinute(i)}
                      >
                        <Text
                          style={[
                            styles.timePickerItemText,
                            selectedMinute === i && styles.timePickerItemTextSelected,
                          ]}
                        >
                          {i.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowTimePicker(false)}
                  style={styles.modalButton}
                />
                <Button
                  title="Set Time"
                  onPress={handleTimeSelect}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Plan Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Your Plan</Text>
          <View style={styles.planInfo}>
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Current Plan</Text>
              <Text
                style={[
                  styles.planValue,
                  { color: stats?.plan.type === 'plus' ? colors.primary[500] : colors.text.primary },
                ]}
              >
                {stats?.plan.type === 'plus' ? 'Plus' : 'Free'}
              </Text>
            </View>
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>AI Generations</Text>
              <Text style={styles.planValue}>
                {stats?.plan.generation_used ?? 0} / {stats?.plan.generation_limit ?? 20}
              </Text>
            </View>
            {stats?.plan.type === 'plus' && (
              <View style={styles.planRow}>
                <Text style={styles.planLabel}>Credits</Text>
                <Text style={styles.planValue}>{stats?.plan.credit_balance ?? 0}</Text>
              </View>
            )}
          </View>
          {stats?.plan.type === 'free' && (
            <View style={styles.upgradePrompt}>
              <Text style={styles.upgradeText}>
                Upgrade to Plus for unlimited generations and more features!
              </Text>
            </View>
          )}
        </Card>

        {/* Stats Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.total_entries ?? 0}</Text>
              <Text style={styles.statLabel}>Total Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.total_decks ?? 0}</Text>
              <Text style={styles.statLabel}>Decks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.due_entries ?? 0}</Text>
              <Text style={styles.statLabel}>Due Today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.reviews_today ?? 0}</Text>
              <Text style={styles.statLabel}>Reviews Today</Text>
            </View>
          </View>
        </Card>

        {/* App Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutInfo}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Build</Text>
              <Text style={styles.aboutValue}>1</Text>
            </View>
          </View>
        </Card>

        {/* Sign Out */}
        <View style={styles.signOutContainer}>
          <Button
            title="Sign Out"
            variant="outline"
            onPress={handleSignOut}
            loading={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  profileDetails: {
    flex: 1,
  },
  email: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  userId: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  planInfo: {
    gap: 12,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  planValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  upgradePrompt: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: colors.primary[700],
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    width: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  aboutInfo: {
    gap: 8,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aboutLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  aboutValue: {
    fontSize: 14,
    color: colors.text.primary,
  },
  signOutContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  // Notification styles
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  notificationDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  timeLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[500],
  },
  permissionWarning: {
    marginTop: 12,
    fontSize: 13,
    color: colors.error.DEFAULT,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.light,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  timePickerColumn: {
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  timePickerScroll: {
    height: 150,
    width: 80,
  },
  timePickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  timePickerItemSelected: {
    backgroundColor: colors.primary[100],
  },
  timePickerItemText: {
    fontSize: 18,
    color: colors.text.primary,
    textAlign: 'center',
  },
  timePickerItemTextSelected: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginHorizontal: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
})
