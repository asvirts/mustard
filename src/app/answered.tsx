import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MotionPressable, RevealView } from '@/components/delight';
import { MustardMascot } from '@/components/mustard-mascot';
import { CATEGORIES, COLORS, GROWTH_STAGES } from '@/constants/mustard-data';
import { useMustard } from '@/context/mustard-context';

function formatFullDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AnsweredPrayersScreen() {
  const { answeredPrayers, growthStage, reopenPrayer, deletePrayer } = useMustard();
  const [previewStage, setPreviewStage] = useState<number | null>(null);

  const displayedStage =
    GROWTH_STAGES.find((s) => s.stage === (previewStage ?? growthStage.stage)) ||
    growthStage;
  const isPreviewing = previewStage !== null && previewStage !== growthStage.stage;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={styles.screenTitle}>Answered</Text>
          <Text style={styles.screenSubtitle}>
            Look back on what God has done — every answer helps your seed grow
          </Text>
        </View>

        {/* Interactive Mustard Seed Growth Showcase */}
        <View style={styles.mascotShowcaseCard}>
          <View style={styles.showcaseTop}>
            <RevealView replayKey={displayedStage.stage}>
              <MustardMascot stage={displayedStage.stage} size={114} />
            </RevealView>
            <View style={styles.showcaseInfo}>
              <View style={styles.stagePillRow}>
                <View
                  style={[
                    styles.stagePill,
                    isPreviewing && styles.stagePillPreview,
                  ]}>
                  <Text
                    style={[
                      styles.stagePillText,
                      isPreviewing && styles.stagePillTextPreview,
                    ]}>
                    {isPreviewing
                      ? `Preview · Stage ${displayedStage.stage}`
                      : `Current · Stage ${displayedStage.stage}`}
                  </Text>
                </View>
              </View>
              <Text style={styles.showcaseName}>{displayedStage.name}</Text>
              <Text style={styles.showcaseDesc}>{displayedStage.description}</Text>
            </View>
          </View>

          <View style={styles.stepperSection}>
            <View style={styles.stepperHeaderRow}>
              <Text style={styles.stepperLabel}>Growth stages</Text>
              <Text style={styles.stepperHint}>
                {displayedStage.minAnswered === 0
                  ? 'Starts at 0 answered'
                  : `Unlocks at ${displayedStage.minAnswered} answered`}
              </Text>
            </View>
            <View style={styles.stageStepperRow}>
              {GROWTH_STAGES.map((st) => {
                const unlocked = answeredPrayers.length >= st.minAnswered;
                const isSelected = displayedStage.stage === st.stage;
                return (
                  <MotionPressable
                    key={st.stage}
                    feedback="light"
                    accessibilityRole="button"
                    accessibilityLabel={`Preview stage ${st.stage}: ${st.name}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() =>
                      setPreviewStage(st.stage === growthStage.stage ? null : st.stage)
                    }
                    style={[
                      styles.stageStepButton,
                      unlocked && styles.stageStepUnlocked,
                      isSelected && styles.stageStepSelected,
                    ]}>
                    <Text
                      style={[
                        styles.stageStepNumber,
                        unlocked && styles.stageStepNumberUnlocked,
                        isSelected && styles.stageStepNumberSelected,
                      ]}>
                      {st.stage}
                    </Text>
                  </MotionPressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Timeline of Answered Prayers */}
        <View style={styles.timelineHeader}>
          <Text style={styles.sectionTitle}>History</Text>
          <Text style={styles.sectionBadge}>
            {answeredPrayers.length} answered
          </Text>
        </View>

        {answeredPrayers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>No answered prayers yet</Text>
            <Text style={styles.emptySubtitle}>
              When a prayer on your list is answered, mark it answered to celebrate and watch your mustard seed sprout.
            </Text>
          </View>
        ) : (
          answeredPrayers.map((prayer, index) => {
            const catMeta =
              CATEGORIES.find((c) => c.id === prayer.category) || CATEGORIES[0];
            return (
              <RevealView key={prayer.id} delay={Math.min(index, 4) * 40}>
                <View style={styles.historyCard}>
                  <View style={styles.historyTopRow}>
                    <View style={styles.answeredDateBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={COLORS.sprout}
                      />
                      <Text style={styles.answeredDateText}>
                        {formatFullDate(prayer.answeredAt || prayer.createdAt)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.catBadge,
                        { backgroundColor: catMeta.bg },
                      ]}>
                      <Text style={[styles.catBadgeText, { color: catMeta.color }]}>
                        {catMeta.emoji} {catMeta.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.historyTitle}>{prayer.title}</Text>
                  {Boolean(prayer.details) && (
                    <Text style={styles.historyDetails}>{prayer.details}</Text>
                  )}

                  {Boolean(prayer.answeredReflection) && (
                    <View style={styles.reflectionBox}>
                      <Text style={styles.reflectionLabel}>Gratitude Note</Text>
                      <Text style={styles.reflectionText}>
                        {prayer.answeredReflection}
                      </Text>
                    </View>
                  )}

                  <View style={styles.historyFooter}>
                    <Text style={styles.footerMeta}>
                      Prayed {prayer.prayedCount}{' '}
                      {prayer.prayedCount === 1 ? 'time' : 'times'} · Planted{' '}
                      {formatFullDate(prayer.createdAt)}
                    </Text>
                    <View style={styles.footerBtns}>
                      <MotionPressable
                        onPress={() => reopenPrayer(prayer.id)}
                        style={styles.reopenBtn}>
                        <Ionicons
                          name="arrow-undo-outline"
                          size={13}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.reopenBtnText}>Restore</Text>
                      </MotionPressable>
                      <Pressable
                        onPress={() => deletePrayer(prayer.id)}
                        hitSlop={8}
                        style={styles.iconBtn}>
                        <Ionicons
                          name="trash-outline"
                          size={15}
                          color={COLORS.textMuted}
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </RevealView>
            );
          })
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 42,
  },
  headerBlock: {
    marginBottom: 18,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.6,
  },
  screenSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginTop: 2,
  },
  mascotShowcaseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    shadowColor: COLORS.text,
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  showcaseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  showcaseInfo: {
    flex: 1,
  },
  stagePillRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  stagePill: {
    backgroundColor: COLORS.sproutLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  stagePillPreview: {
    backgroundColor: COLORS.mustardLight,
  },
  stagePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.sproutDark,
  },
  stagePillTextPreview: {
    color: COLORS.mustardDark,
  },
  showcaseName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  showcaseDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  stepperSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  stepperHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  stepperHint: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  stageStepperRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stageStepButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
  },
  stageStepUnlocked: {
    backgroundColor: COLORS.sproutLight,
  },
  stageStepSelected: {
    backgroundColor: COLORS.text,
  },
  stageStepNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  stageStepNumberUnlocked: {
    color: COLORS.sproutDark,
  },
  stageStepNumberSelected: {
    color: '#FFFFFF',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: COLORS.text,
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  answeredDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  answeredDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.sproutDark,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  historyDetails: {
    fontSize: 13.5,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  reflectionBox: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
  },
  reflectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mustardDark,
    marginBottom: 3,
  },
  reflectionText: {
    fontSize: 13.5,
    lineHeight: 19,
    color: COLORS.text,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  footerMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
  },
  footerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reopenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceMuted,
  },
  reopenBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  iconBtn: {
    padding: 5,
  },
});
