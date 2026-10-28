import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CelebrationToast, MotionPressable, RevealView, useReducedMotion } from '@/components/delight';
import { COLORS } from '@/constants/mustard-data';
import { useMustard } from '@/context/mustard-context';
import {
  formatReminderTime,
  sendTestGentleNudge,
} from '@/services/notifications';

const PRESET_TIMES = [
  { label: '7:30 AM', hour: 7, minute: 30 },
  { label: '9:00 AM', hour: 9, minute: 0 },
  { label: '12:30 PM', hour: 12, minute: 30 },
  { label: '3:30 PM', hour: 15, minute: 30 },
  { label: '6:00 PM', hour: 18, minute: 0 },
  { label: '9:00 PM', hour: 21, minute: 0 },
];

export default function RemindersScreen() {
  const reduceMotion = useReducedMotion();
  const {
    reminders,
    settings,
    addReminder,
    toggleReminder,
    deleteReminder,
    updateSettings,
  } = useMustard();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('Afternoon Pause');
  const [selectedHour, setSelectedHour] = useState(15);
  const [selectedMinute, setSelectedMinute] = useState(30);
  const [newMessage, setNewMessage] = useState(
    'Take a quiet breath and lift up one person on your prayer list.'
  );
  const [testBanner, setTestBanner] = useState<string | null>(null);
  const [testBannerVersion, setTestBannerVersion] = useState(0);
  const [celebration, setCelebration] = useState<{ id: number; message: string } | null>(null);

  const handleCreateReminder = () => {
    addReminder({
      label: newLabel,
      hour: selectedHour,
      minute: selectedMinute,
      message: newMessage,
    });
    setShowAddModal(false);
    setCelebration((previous) => ({
      id: (previous?.id ?? 0) + 1,
      message: 'A little space for prayer, made.',
    }));
  };

  const handleTestNudge = async () => {
    const sentNative = await sendTestGentleNudge();
    setTestBanner(
      sentNative
        ? '🌱 Gentle nudge sent! Check your device notifications.'
        : '🌱 Gentle nudge preview: “Pause for a quiet breath. Lift up one person on your Mustard prayer list right now.”'
    );
    setTestBannerVersion((version) => version + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Gentle Reminders</Text>
            <Text style={styles.screenSubtitle}>
              Customizable nudges through the day — meant to invite prayer rather than interrupt it.
            </Text>
          </View>
          <MotionPressable
            feedback="light"
            onPress={() => setShowAddModal(true)}
            style={styles.addBtn}>
            <Ionicons name="add" size={19} color="#2A2419" />
            <Text style={styles.addBtnText}>Add Nudge</Text>
          </MotionPressable>
        </View>

        {/* Master Toggle & Philosophy Card */}
        <View style={styles.masterCard}>
          <View style={styles.masterRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.masterTitle}>Daily Prayer Nudges</Text>
              <Text style={styles.masterSubtitle}>
                {
                  reminders.filter((r) => r.enabled && settings.notificationsEnabled)
                    .length
                }{' '}
                active daily reminders scheduled
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(val) =>
                updateSettings({ notificationsEnabled: val })
              }
              trackColor={{ false: COLORS.border, true: COLORS.sprout }}
            />
          </View>

          <View style={styles.testRow}>
            <MotionPressable onPress={handleTestNudge} style={styles.testBtn}>
              <Ionicons
                name="paper-plane-outline"
                size={14}
                color={COLORS.mustardDark}
              />
              <Text style={styles.testBtnText}>Send a Gentle Test Nudge</Text>
            </MotionPressable>
          </View>

          {testBanner && (
            <RevealView replayKey={testBannerVersion} style={styles.testBannerBox}>
              <Text style={styles.testBannerText}>{testBanner}</Text>
            </RevealView>
          )}
        </View>

        {/* Scheduled Reminders List */}
        {reminders.map((rem, index) => {
          const isActive = rem.enabled && settings.notificationsEnabled;
          return (
            <RevealView key={rem.id} delay={Math.min(index, 4) * 40}>
              <View
                style={[
                  styles.reminderCard,
                  !isActive && styles.reminderCardDimmed,
                ]}>
                <View style={styles.reminderTop}>
                  <View>
                    <Text style={styles.reminderTime}>
                      {formatReminderTime(rem.hour, rem.minute)}
                    </Text>
                    <Text style={styles.reminderLabel}>{rem.label}</Text>
                  </View>
                  <Switch
                    value={rem.enabled}
                    onValueChange={() => toggleReminder(rem.id)}
                    trackColor={{ false: COLORS.border, true: COLORS.mustard }}
                  />
                </View>

                <Text style={styles.reminderMessage}>“{rem.message}”</Text>

                <View style={styles.reminderFooter}>
                  <Text style={styles.reminderFreq}>
                    {rem.days.length === 7 ? 'Every day' : 'Weekdays'}
                  </Text>
                  <Pressable
                    onPress={() => deleteReminder(rem.id)}
                    hitSlop={8}>
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={COLORS.textMuted}
                    />
                  </Pressable>
                </View>
              </View>
            </RevealView>
          );
        })}
      </ScrollView>
      <CelebrationToast event={celebration} />

      {/* Modal: Add Custom Gentle Reminder */}
      <Modal
        visible={showAddModal}
        animationType={reduceMotion ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Gentle Reminder</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Reminder Name</Text>
            <TextInput
              style={styles.textInput}
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="e.g., Afternoon Pause"
            />

            <Text style={styles.inputLabel}>Choose a Time of Day</Text>
            <View style={styles.presetGrid}>
              {PRESET_TIMES.map((preset) => {
                const selected =
                  selectedHour === preset.hour &&
                  selectedMinute === preset.minute;
                return (
                  <MotionPressable
                    key={preset.label}
                    feedback="light"
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setSelectedHour(preset.hour);
                      setSelectedMinute(preset.minute);
                    }}
                    style={[
                      styles.presetChip,
                      selected && styles.presetChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.presetChipText,
                        selected && styles.presetChipTextActive,
                      ]}>
                      {preset.label}
                    </Text>
                  </MotionPressable>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Gentle Invitation Message</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              placeholder="Write a warm nudge..."
            />

            <MotionPressable
              onPress={handleCreateReminder}
              style={styles.saveModalBtn}>
              <Text style={styles.saveModalBtnText}>Save Reminder</Text>
            </MotionPressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 38,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.mustard,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A2419',
  },
  masterCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  masterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masterTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  masterSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  testRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 10,
    borderRadius: 12,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.mustardDark,
  },
  testBannerBox: {
    marginTop: 10,
    backgroundColor: COLORS.sproutLight,
    padding: 10,
    borderRadius: 10,
  },
  testBannerText: {
    fontSize: 12,
    color: COLORS.sproutDark,
    lineHeight: 17,
    fontWeight: '600',
  },
  reminderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  reminderCardDimmed: {
    opacity: 0.65,
  },
  reminderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderTime: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  reminderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.mustardDark,
    marginTop: 1,
  },
  reminderMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  reminderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
    paddingTop: 8,
  },
  reminderFreq: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(42, 36, 25, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 14,
  },
  textArea: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipActive: {
    backgroundColor: COLORS.mustard,
    borderColor: COLORS.mustardDark,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  presetChipTextActive: {
    color: '#2A2419',
    fontWeight: '800',
  },
  saveModalBtn: {
    backgroundColor: COLORS.mustard,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveModalBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2A2419',
  },
});
