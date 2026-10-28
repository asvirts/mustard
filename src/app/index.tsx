import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MustardMascot } from '@/components/mustard-mascot';
import { PrayedButton } from '@/components/prayed-button';
import { CelebrationToast, MotionPressable, RevealView, useReducedMotion } from '@/components/delight';
import { CATEGORIES, COLORS } from '@/constants/mustard-data';
import { useMustard } from '@/context/mustard-context';
import { PrayerCategory, PrayerRequest } from '@/types/mustard';

function formatRelativeDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PrayersScreen() {
  const {
    activePrayers,
    answeredPrayers,
    dailyVerse,
    growthStage,
    totalPrayedMoments,
    addPrayer,
    recordPrayedNow,
    addPrayerNote,
    markPrayerAnswered,
    deletePrayer,
  } = useMustard();

  const [selectedCategory, setSelectedCategory] = useState<PrayerCategory | 'All'>('All');
  const reduceMotion = useReducedMotion();
  const [celebration, setCelebration] = useState<{ id: number; message: string } | null>(null);

  const celebrate = (message: string) => {
    setCelebration((previous) => ({ id: (previous?.id ?? 0) + 1, message }));
  };

  // New Prayer modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newCategory, setNewCategory] = useState<PrayerCategory>('Family');

  // Prayer Detail & Notes modal state
  const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [answeredReflectionInput, setAnsweredReflectionInput] = useState('');
  const [answeredDateInput, setAnsweredDateInput] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  const selectedPrayer: PrayerRequest | undefined = useMemo(
    () => activePrayers.find((p) => p.id === selectedPrayerId),
    [activePrayers, selectedPrayerId]
  );

  const filteredPrayers = useMemo(() => {
    if (selectedCategory === 'All') return activePrayers;
    return activePrayers.filter((p) => p.category === selectedCategory);
  }, [activePrayers, selectedCategory]);

  const handleCreatePrayer = () => {
    if (!newTitle.trim()) return;
    addPrayer({
      title: newTitle,
      details: newDetails,
      category: newCategory,
    });
    setNewTitle('');
    setNewDetails('');
    setNewCategory('Family');
    setShowAddModal(false);
    celebrate('A little prayer, planted in hope.');
  };

  const handleAddNote = () => {
    if (!selectedPrayer || !noteInput.trim()) return;
    addPrayerNote(selectedPrayer.id, noteInput);
    setNoteInput('');
  };

  const handleConfirmAnswered = () => {
    if (!selectedPrayer) return;
    let isoDate = new Date().toISOString();
    if (/^\d{4}-\d{2}-\d{2}$/.test(answeredDateInput.trim())) {
      const parsed = new Date(`${answeredDateInput.trim()}T12:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        isoDate = parsed.toISOString();
      }
    }
    markPrayerAnswered(selectedPrayer.id, answeredReflectionInput, isoDate);
    setAnsweredReflectionInput('');
    setShowAnswerForm(false);
    setSelectedPrayerId(null);
    celebrate('An answered prayer. A little more growth.');
  };

  const progressToNext = useMemo(() => {
    const count = answeredPrayers.length;
    if (growthStage.nextThreshold === null) return 1;
    const span = growthStage.nextThreshold - growthStage.minAnswered;
    if (span <= 0) return 1;
    return Math.min(1, Math.max(0, (count - growthStage.minAnswered) / span));
  }, [answeredPrayers.length, growthStage]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.appTitle}>Mustard</Text>
            <Text style={styles.appSubtitle}>Small seeds, steady prayer</Text>
          </View>
          <MotionPressable
            feedback="light"
            style={styles.newPrayerButton}
            onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={20} color="#2A2419" />
            <Text style={styles.newPrayerButtonText}>Add Prayer</Text>
          </MotionPressable>
        </View>

        {/* Mustard Seed Mascot & Growth Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <RevealView replayKey={`${growthStage.stage}:${answeredPrayers.length}`}>
              <MustardMascot stage={growthStage.stage} size={118} />
            </RevealView>
            <View style={styles.heroTextCol}>
              <View style={styles.stageBadge}>
                <Text style={styles.stageBadgeText}>
                  STAGE {growthStage.stage} OF 6
                </Text>
              </View>
              <Text style={styles.stageTitle}>{growthStage.name}</Text>
              <Text style={styles.stageSubtitle}>{growthStage.subtitle}</Text>
              <Text style={styles.stageDesc}>{growthStage.description}</Text>
            </View>
          </View>

          <View style={styles.heroStatsBar}>
            <RevealView style={styles.statPill} replayKey={activePrayers.length}>
              <Text style={styles.statValue}>{activePrayers.length}</Text>
              <Text style={styles.statLabel}>Tending</Text>
            </RevealView>
            <View style={styles.statDivider} />
            <RevealView style={styles.statPill} replayKey={answeredPrayers.length}>
              <Text style={[styles.statValue, { color: COLORS.sprout }]}>
                {answeredPrayers.length}
              </Text>
              <Text style={styles.statLabel}>Answered</Text>
            </RevealView>
            <View style={styles.statDivider} />
            <RevealView style={styles.statPill} replayKey={totalPrayedMoments}>
              <Text style={styles.statValue}>{totalPrayedMoments}</Text>
              <Text style={styles.statLabel}>Prayers Lifted</Text>
            </RevealView>
          </View>

          {growthStage.nextThreshold !== null && (
            <View style={styles.progressSection}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(10, Math.round(progressToNext * 100))}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressCaption}>
                {growthStage.nextThreshold - answeredPrayers.length} more answered{' '}
                {growthStage.nextThreshold - answeredPrayers.length === 1
                  ? 'prayer'
                  : 'prayers'}{' '}
                to sprout to Stage {growthStage.stage + 1}
              </Text>
            </View>
          )}
        </View>

        {/* Daily Encouraging Verse Banner (YouVersion) */}
        <View style={styles.verseBanner}>
          <View style={styles.verseHeaderRow}>
            <View style={styles.verseTag}>
              <Ionicons name="sparkles" size={13} color={COLORS.mustardDark} />
              <Text style={styles.verseTagText}>DAILY ENCOURAGEMENT</Text>
            </View>
            <Text style={styles.verseVersionPill}>
              {dailyVerse.reference} ({dailyVerse.versionAbbreviation})
            </Text>
          </View>
          <Text style={styles.verseBodyText}>{dailyVerse.text}</Text>
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}>
          <MotionPressable
            feedback="light"
            accessibilityRole="button"
            accessibilityState={{ selected: selectedCategory === 'All' }}
            onPress={() => setSelectedCategory('All')}
            style={[
              styles.filterChip,
              selectedCategory === 'All' && styles.filterChipActive,
            ]}>
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'All' && styles.filterChipTextActive,
              ]}>
              All ({activePrayers.length})
            </Text>
          </MotionPressable>
          {CATEGORIES.map((cat) => {
            const count = activePrayers.filter((p) => p.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <MotionPressable
                feedback="light"
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}>
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}>
                  {cat.emoji} {cat.label} ({count})
                </Text>
              </MotionPressable>
            );
          })}
        </ScrollView>

        {/* Active Prayer List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prayer List</Text>
          <Text style={styles.sectionCount}>
            {filteredPrayers.length}{' '}
            {filteredPrayers.length === 1 ? 'request' : 'requests'}
          </Text>
        </View>

        {filteredPrayers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>Your prayer list is quiet</Text>
            <Text style={styles.emptySubtitle}>
              Plant a new prayer request above and tend it throughout the week.
            </Text>
          </View>
        ) : (
          filteredPrayers.map((prayer, index) => {
            const catMeta =
              CATEGORIES.find((c) => c.id === prayer.category) || CATEGORIES[0];
            return (
              <RevealView key={prayer.id} delay={Math.min(index, 4) * 40}>
                <Pressable
                  onPress={() => {
                    setSelectedPrayerId(prayer.id);
                    setShowAnswerForm(false);
                    setAnsweredDateInput(new Date().toISOString().slice(0, 10));
                  }}
                  style={styles.prayerCard}>
                  <View style={styles.prayerCardTop}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: catMeta.bg },
                      ]}>
                      <Text style={[styles.categoryBadgeText, { color: catMeta.color }]}>
                        {catMeta.emoji} {catMeta.label}
                      </Text>
                    </View>
                    <Text style={styles.prayerTimestamp}>
                      Added {formatRelativeDate(prayer.createdAt)}
                    </Text>
                  </View>

                  <Text style={styles.prayerTitle}>{prayer.title}</Text>
                  {Boolean(prayer.details) && (
                    <Text style={styles.prayerDetails} numberOfLines={2}>
                      {prayer.details}
                    </Text>
                  )}

                  {prayer.notes.length > 0 && (
                    <View style={styles.latestNoteBox}>
                      <Ionicons
                        name="document-text-outline"
                        size={14}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.latestNoteText} numberOfLines={1}>
                        {prayer.notes[0].text}
                      </Text>
                    </View>
                  )}

                  <View style={styles.prayerCardFooter}>
                    <PrayedButton
                      count={prayer.prayedCount}
                      onPress={() => recordPrayedNow(prayer.id)}
                    />

                    <View style={styles.cardRightActions}>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedPrayerId(prayer.id);
                          setShowAnswerForm(true);
                          setAnsweredDateInput(new Date().toISOString().slice(0, 10));
                        }}
                        style={styles.markAnsweredBtn}>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={16}
                          color={COLORS.sproutDark}
                        />
                        <Text style={styles.markAnsweredBtnText}>Answered</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              </RevealView>
            );
          })
        )}
      </ScrollView>

      {/* Modal: Add a New Prayer Request */}
      <Modal
        visible={showAddModal}
        animationType={reduceMotion ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Plant a New Prayer</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>What or whom are you praying for?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Peace for Sarah’s upcoming interview"
              placeholderTextColor={COLORS.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modalCategoryRow}>
              {CATEGORIES.map((cat) => {
                const active = newCategory === cat.id;
                return (
                  <MotionPressable
                    feedback="light"
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={cat.id}
                    onPress={() => setNewCategory(cat.id)}
                    style={[
                      styles.modalCategoryChip,
                      active && styles.modalCategoryChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.modalCategoryChipText,
                        active && styles.modalCategoryChipTextActive,
                      ]}>
                      {cat.emoji} {cat.label}
                    </Text>
                  </MotionPressable>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>Notes or details (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Write what is on your heart..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={newDetails}
              onChangeText={setNewDetails}
            />

            <MotionPressable
              feedback="success"
              style={[
                styles.primaryModalBtn,
                !newTitle.trim() && styles.primaryModalBtnDisabled,
              ]}
              onPress={handleCreatePrayer}
              disabled={!newTitle.trim()}>
              <Text style={styles.primaryModalBtnText}>Save to Prayer List</Text>
            </MotionPressable>
          </View>
        </View>
      </Modal>

      {/* Modal: Prayer Details, Journal Notes & Mark Answered */}
      <Modal
        visible={Boolean(selectedPrayer)}
        animationType={reduceMotion ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setSelectedPrayerId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { maxHeight: '88%' }]}>
            {selectedPrayer && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Prayer Details</Text>
                  <Pressable onPress={() => setSelectedPrayerId(null)}>
                    <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                  </Pressable>
                </View>

                <Text style={styles.detailPrayerTitle}>{selectedPrayer.title}</Text>
                {Boolean(selectedPrayer.details) && (
                  <Text style={styles.detailPrayerBody}>
                    {selectedPrayer.details}
                  </Text>
                )}

                <View style={styles.detailMetaRow}>
                  <Text style={styles.detailMetaText}>
                    Category: {selectedPrayer.category}
                  </Text>
                  <Text style={styles.detailMetaText}>
                    Prayed {selectedPrayer.prayedCount} times
                  </Text>
                </View>

                {/* Mark as Answered Flow */}
                {showAnswerForm ? (
                  <View style={styles.answerFormCard}>
                    <Text style={styles.answerFormHeading}>
                      🌿 Celebrate an Answered Prayer
                    </Text>
                    <Text style={styles.inputLabel}>Date Answered (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={answeredDateInput}
                      onChangeText={setAnsweredDateInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORS.textMuted}
                    />
                    <Text style={styles.inputLabel}>
                      How did God answer this prayer?
                    </Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      placeholder="Record a note of gratitude to look back on..."
                      placeholderTextColor={COLORS.textMuted}
                      multiline
                      value={answeredReflectionInput}
                      onChangeText={setAnsweredReflectionInput}
                    />
                    <View style={styles.answerFormActions}>
                      <Pressable
                        onPress={() => setShowAnswerForm(false)}
                        style={styles.secondaryBtn}>
                        <Text style={styles.secondaryBtnText}>Cancel</Text>
                      </Pressable>
                      <MotionPressable
                        feedback="success"
                        onPress={handleConfirmAnswered}
                        style={styles.confirmAnswerBtn}>
                        <Text style={styles.confirmAnswerBtnText}>
                          Mark Answered & Grow Seed
                        </Text>
                      </MotionPressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.detailQuickActions}>
                    <PrayedButton
                      key={selectedPrayer.id}
                      large
                      count={selectedPrayer.prayedCount}
                      onPress={() => recordPrayedNow(selectedPrayer.id)}
                    />
                    <Pressable
                      onPress={() => setShowAnswerForm(true)}
                      style={styles.markAnsweredBtnLarge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={17}
                        color="#FFFFFF"
                      />
                      <Text style={styles.markAnsweredBtnLargeText}>
                        Mark Answered
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* Journal Notes Section */}
                <View style={styles.notesSection}>
                  <Text style={styles.notesHeading}>
                    Prayer Notes & Updates ({selectedPrayer.notes.length})
                  </Text>
                  <View style={styles.addNoteRow}>
                    <TextInput
                      style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                      placeholder="Add an update or reflection..."
                      placeholderTextColor={COLORS.textMuted}
                      value={noteInput}
                      onChangeText={setNoteInput}
                    />
                    <MotionPressable
                      feedback="light"
                      pop
                      disabled={!noteInput.trim()}
                      onPress={handleAddNote}
                      style={styles.addNoteBtn}>
                      <Text style={styles.addNoteBtnText}>Add</Text>
                    </MotionPressable>
                  </View>

                  {selectedPrayer.notes.map((note) => (
                    <View key={note.id} style={styles.noteItem}>
                      <Text style={styles.noteItemText}>{note.text}</Text>
                      <Text style={styles.noteItemDate}>
                        {formatRelativeDate(note.createdAt)}
                      </Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={() => {
                    deletePrayer(selectedPrayer.id);
                    setSelectedPrayerId(null);
                  }}
                  style={styles.deletePrayerBtn}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  <Text style={styles.deletePrayerText}>Remove Prayer Request</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      <CelebrationToast event={celebration} />
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
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  newPrayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.mustard,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  newPrayerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2419',
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroTextCol: {
    flex: 1,
  },
  stageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.mustardLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.mustardDark,
    letterSpacing: 0.6,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  stageSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.sprout,
    marginTop: 1,
    marginBottom: 5,
  },
  stageDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },
  heroStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressSection: {
    marginTop: 12,
  },
  progressTrack: {
    height: 7,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.sprout,
    borderRadius: 999,
  },
  progressCaption: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
  verseBanner: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3DFAC',
    marginBottom: 16,
  },
  verseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verseTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.mustardDark,
    letterSpacing: 0.6,
  },
  verseVersionPill: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  verseBodyText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  filterChipsRow: {
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
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
  prayerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  prayerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  prayerTimestamp: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  prayerDetails: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  latestNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
  },
  latestNoteText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  prayerCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  cardRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAnsweredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.sproutLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  markAnsweredBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.sproutDark,
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
    minHeight: 82,
    textAlignVertical: 'top',
  },
  modalCategoryRow: {
    gap: 8,
    paddingBottom: 14,
  },
  modalCategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCategoryChipActive: {
    backgroundColor: COLORS.mustard,
    borderColor: COLORS.mustardDark,
  },
  modalCategoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalCategoryChipTextActive: {
    color: '#2A2419',
    fontWeight: '700',
  },
  primaryModalBtn: {
    backgroundColor: COLORS.mustard,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryModalBtnDisabled: {
    opacity: 0.5,
  },
  primaryModalBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2A2419',
  },
  detailPrayerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  detailPrayerBody: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  detailQuickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  markAnsweredBtnLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.sprout,
    paddingVertical: 12,
    borderRadius: 12,
  },
  markAnsweredBtnLargeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  answerFormCard: {
    backgroundColor: COLORS.sproutLight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#C5E3C2',
  },
  answerFormHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.sproutDark,
    marginBottom: 10,
  },
  answerFormActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  confirmAnswerBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: COLORS.sprout,
    alignItems: 'center',
  },
  confirmAnswerBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
    marginBottom: 18,
  },
  notesHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  addNoteRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addNoteBtn: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 12,
  },
  addNoteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  noteItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  noteItemText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  noteItemDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  deletePrayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  deletePrayerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
