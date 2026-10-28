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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Answered Prayers</Text>
        <Text style={styles.screenSubtitle}>
          Look back on what God has already done — every answer helps your mustard seed grow.
        </Text>

        {/* Interactive Mustard Seed Growth Showcase */}
        <View style={styles.mascotShowcaseCard}>
          <View style={styles.showcaseTop}>
            <RevealView replayKey={displayedStage.stage}>
              <MustardMascot stage={displayedStage.stage} size={132} />
            </RevealView>
            <View style={styles.showcaseInfo}>
              <View style={styles.stagePill}>
                <Text style={styles.stagePillText}>
                  {previewStage && previewStage !== growthStage.stage
                    ? `PREVIEWING STAGE ${displayedStage.stage}`
                    : `CURRENT • STAGE ${displayedStage.stage}`}
                </Text>
              </View>
              <Text style={styles.showcaseName}>{displayedStage.name}</Text>
              <Text style={styles.showcaseSubtitle}>{displayedStage.subtitle}</Text>
              <Text style={styles.showcaseDesc}>{displayedStage.description}</Text>
            </View>
          </View>

          <Text style={styles.stepperLabel}>
            Tap a stage to preview how your mustard seed grows:
          </Text>
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
                  <Text
                    style={[
                      styles.stageStepReq,
                      isSelected && styles.stageStepNumberSelected,
                    ]}>
                    {st.minAnswered}+
                  </Text>
                </MotionPressable>
              );
            })}
          </View>
        </View>

        {/* Timeline of Answered Prayers */}
        <View style={styles.timelineHeader}>
          <Text style={styles.sectionTitle}>Answered History</Text>
          <Text style={styles.sectionBadge}>
            {answeredPrayers.length} answered
          </Text>
        </View>

        {answeredPrayers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>No answered prayers recorded yet</Text>
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
                        size={15}
                        color={COLORS.sproutDark}
                      />
                      <Text style={styles.answeredDateText}>
                        Answered {formatFullDate(prayer.answeredAt || prayer.createdAt)}
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
                      <Text style={styles.reflectionLabel}>HOW IT WAS ANSWERED</Text>
                      <Text style={styles.reflectionText}>
                        {prayer.answeredReflection}
                      </Text>
                    </View>
                  )}

                  <View style={styles.historyFooter}>
                    <Text style={styles.footerMeta}>
                      Prayed {prayer.prayedCount}{' '}
                      {prayer.prayedCount === 1 ? 'time' : 'times'} • Planted{' '}
                      {formatFullDate(prayer.createdAt)}
                    </Text>
                    <View style={styles.footerBtns}>
                      <MotionPressable
                        onPress={() => reopenPrayer(prayer.id)}
                        style={styles.reopenBtn}>
                        <Ionicons
                          name="arrow-undo-outline"
                          size={14}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.reopenBtnText}>Move to Active</Text>
                      </MotionPressable>
                      <Pressable
                        onPress={() => deletePrayer(prayer.id)}
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 38,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 16,
  },
  mascotShowcaseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  showcaseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  showcaseInfo: {
    flex: 1,
  },
  stagePill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sproutLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  stagePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.sproutDark,
    letterSpacing: 0.5,
  },
  showcaseName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  showcaseSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mustardDark,
    marginTop: 2,
    marginBottom: 5,
  },
  showcaseDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 14,
    marginBottom: 8,
  },
  stageStepperRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stageStepButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stageStepUnlocked: {
    backgroundColor: COLORS.sproutLight,
    borderColor: '#B8DFB4',
  },
  stageStepSelected: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  stageStepNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  stageStepNumberUnlocked: {
    color: COLORS.sproutDark,
  },
  stageStepNumberSelected: {
    color: '#FFFFFF',
  },
  stageStepReq: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.sproutDark,
    backgroundColor: COLORS.sproutLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answeredDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.sproutLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  answeredDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.sproutDark,
  },
  catBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  historyDetails: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  reflectionBox: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.mustard,
    marginBottom: 10,
  },
  reflectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.mustardDark,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  reflectionText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
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
