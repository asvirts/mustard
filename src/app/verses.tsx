import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CelebrationToast, MotionPressable, RevealView, useReducedMotion } from '@/components/delight';
import { COLORS } from '@/constants/mustard-data';
import { useMustard } from '@/context/mustard-context';
import { fetchYouVersionPassage } from '@/services/youversion';

export default function VersesScreen() {
  const reduceMotion = useReducedMotion();
  const {
    verses,
    dailyVerse,
    settings,
    toggleBookmarkVerse,
    updateSettings,
    refreshVersesFromYouVersion,
  } = useMustard();

  const [selectedTheme, setSelectedTheme] = useState<string>('All');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [celebration, setCelebration] = useState<{ id: number; message: string } | null>(null);

  // YouVersion Platform Config Modal
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(settings.youVersionAppKey);
  const [bibleIdInput, setBibleIdInput] = useState(String(settings.preferredBibleId));
  const [bibleAbbrevInput, setBibleAbbrevInput] = useState(settings.preferredBibleAbbrev);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Live Custom USFM Lookup (when YouVersion API key is set)
  const [customUsfm, setCustomUsfm] = useState('MAT.17.20');
  const [customLookupResult, setCustomLookupResult] = useState<{
    reference: string;
    content: string;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const themes = useMemo(() => {
    const unique = Array.from(new Set(verses.map((v) => v.theme)));
    return ['All', ...unique];
  }, [verses]);

  const filteredVerses = useMemo(() => {
    return verses.filter((v) => {
      if (onlyBookmarked && !v.isBookmarked) return false;
      if (selectedTheme !== 'All' && v.theme !== selectedTheme) return false;
      return true;
    });
  }, [verses, onlyBookmarked, selectedTheme]);

  const handleBookmark = (id: string, isBookmarked?: boolean) => {
    toggleBookmarkVerse(id);
    if (!isBookmarked) {
      setCelebration((previous) => ({
        id: (previous?.id ?? 0) + 1,
        message: 'A little encouragement, saved.',
      }));
    } else {
      setCelebration(null);
    }
  };

  const handleSaveApiConfig = async () => {
    const parsedBibleId = Number.parseInt(bibleIdInput, 10) || 111;
    updateSettings({
      youVersionAppKey: apiKeyInput.trim(),
      preferredBibleId: parsedBibleId,
      preferredBibleAbbrev: bibleAbbrevInput.trim() || 'NIV',
    });

    if (apiKeyInput.trim()) {
      setIsSyncing(true);
      setSyncMessage(null);
      try {
        const count = await refreshVersesFromYouVersion();
        setSyncMessage(
          count > 0
            ? `Synced ${count} passages live from YouVersion Platform!`
            : 'Saved key. Passages will sync when online.'
        );
      } finally {
        setIsSyncing(false);
      }
    } else {
      setSyncMessage('Using bundled offline NIV verses.');
    }
  };

  const handleCustomUsfmLookup = async () => {
    const key = settings.youVersionAppKey.trim() || process.env.EXPO_PUBLIC_YVP_APP_KEY || '';
    if (!key) {
      setLookupError('Add your YouVersion Platform App Key first to fetch live USFM passages.');
      return;
    }
    setIsLookingUp(true);
    setLookupError(null);
    try {
      const res = await fetchYouVersionPassage({
        appKey: key,
        bibleId: settings.preferredBibleId,
        usfm: customUsfm.trim().toUpperCase(),
      });
      if (res) {
        setCustomLookupResult({
          reference: res.reference,
          content: res.content,
        });
      }
    } catch (err: any) {
      setLookupError(err?.message || 'Could not load passage from YouVersion API.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const hasApiKey = Boolean(
    settings.youVersionAppKey.trim() || process.env.EXPO_PUBLIC_YVP_APP_KEY
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Verses</Text>
            <Text style={styles.screenSubtitle}>
              Scripture for steady prayer, powered by YouVersion
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setApiKeyInput(settings.youVersionAppKey);
              setBibleIdInput(String(settings.preferredBibleId));
              setBibleAbbrevInput(settings.preferredBibleAbbrev);
              setSyncMessage(null);
              setShowApiModal(true);
            }}
            style={[
              styles.yvpConnectBtn,
              hasApiKey && styles.yvpConnectBtnActive,
            ]}>
            <Ionicons
              name={hasApiKey ? 'checkmark-circle' : 'key-outline'}
              size={14}
              color={hasApiKey ? COLORS.sproutDark : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.yvpConnectBtnText,
                hasApiKey && { color: COLORS.sproutDark },
              ]}>
              {hasApiKey ? 'YouVersion Live' : 'YouVersion API'}
            </Text>
          </Pressable>
        </View>

        {/* Highlighted Verse of the Day Card */}
        <RevealView style={styles.featuredVerseCard}>
          <View style={styles.featuredTopRow}>
            <View style={styles.featuredBadge}>
              <Ionicons name="sunny" size={13} color={COLORS.mustardDark} />
              <Text style={styles.featuredBadgeText}>Today’s Verse</Text>
            </View>
            <MotionPressable
              pop
              feedback="light"
              accessibilityRole="button"
              accessibilityLabel={`${dailyVerse.isBookmarked ? 'Remove' : 'Save'} ${dailyVerse.reference} ${dailyVerse.isBookmarked ? 'from' : 'to'} saved verses`}
              accessibilityState={{ selected: dailyVerse.isBookmarked }}
              hitSlop={8}
              onPress={() => handleBookmark(dailyVerse.id, dailyVerse.isBookmarked)}>
              <Ionicons
                name={dailyVerse.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={19}
                color={COLORS.mustardDark}
              />
            </MotionPressable>
          </View>

          <Text style={styles.featuredText}>{dailyVerse.text}</Text>
          <View style={styles.featuredFooter}>
            <Text style={styles.featuredRef}>
              {dailyVerse.reference} · {dailyVerse.versionAbbreviation}
            </Text>
            <Text style={styles.featuredSource}>
              {dailyVerse.source === 'youversion-api'
                ? 'YouVersion Live'
                : 'YouVersion'}
            </Text>
          </View>
        </RevealView>

        {/* Theme & Bookmark Filter Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          <MotionPressable
            feedback="light"
            accessibilityRole="button"
            accessibilityLabel="Show saved verses"
            accessibilityState={{ selected: onlyBookmarked }}
            onPress={() => setOnlyBookmarked((prev) => !prev)}
            style={[
              styles.filterChip,
              onlyBookmarked && styles.filterChipBookmarkActive,
            ]}>
            <Ionicons
              name={onlyBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={12}
              color={onlyBookmarked ? COLORS.text : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.filterChipText,
                onlyBookmarked && styles.filterChipBookmarkText,
              ]}>
              Saved
            </Text>
          </MotionPressable>

          {themes.map((theme) => {
            const active = selectedTheme === theme;
            return (
              <MotionPressable
                key={theme}
                feedback="light"
                accessibilityRole="button"
                accessibilityLabel={`Show ${theme === 'All' ? 'all verses' : `${theme} verses`}`}
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedTheme(theme)}
                style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}>
                  {theme}
                </Text>
              </MotionPressable>
            );
          })}
        </ScrollView>

        {/* Verse Cards List */}
        {filteredVerses.map((verse, index) => (
          <RevealView key={verse.id} style={styles.verseCard} delay={Math.min(index, 4) * 40}>
            <View style={styles.verseCardTop}>
              <View style={styles.themePill}>
                <Text style={styles.themePillText}>{verse.theme}</Text>
              </View>
              <MotionPressable
                pop
                feedback="light"
                accessibilityRole="button"
                accessibilityLabel={`${verse.isBookmarked ? 'Remove' : 'Save'} ${verse.reference} ${verse.isBookmarked ? 'from' : 'to'} saved verses`}
                accessibilityState={{ selected: verse.isBookmarked }}
                onPress={() => handleBookmark(verse.id, verse.isBookmarked)}
                hitSlop={8}>
                <Ionicons
                  name={verse.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={
                    verse.isBookmarked ? COLORS.mustardDark : COLORS.textMuted
                  }
                />
              </MotionPressable>
            </View>

            <Text style={styles.verseCardBody}>{verse.text}</Text>

            <Text style={styles.verseCardRef}>
              {verse.reference} · {verse.versionAbbreviation}
            </Text>
          </RevealView>
        ))}

        {/* Live YouVersion Passage Lookup Box */}
        <View style={styles.lookupBox}>
          <Text style={styles.lookupTitle}>
            Passage Lookup
          </Text>
          <Text style={styles.lookupDesc}>
            Enter a USFM reference (e.g. MAT.17.20, JHN.15.7, PSA.23.1) to fetch directly from YouVersion Platform.
          </Text>
          <View style={styles.lookupInputRow}>
            <TextInput
              style={styles.lookupInput}
              value={customUsfm}
              onChangeText={setCustomUsfm}
              placeholder="MAT.17.20"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
            />
            <Pressable
              onPress={handleCustomUsfmLookup}
              style={styles.lookupBtn}
              disabled={isLookingUp}>
              {isLookingUp ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.lookupBtnText}>Fetch</Text>
              )}
            </Pressable>
          </View>

          {lookupError && <Text style={styles.lookupErrorText}>{lookupError}</Text>}

          {customLookupResult && (
            <View style={styles.lookupResultCard}>
              <Text style={styles.lookupResultText}>
                {customLookupResult.content}
              </Text>
              <Text style={styles.lookupResultRef}>
                {customLookupResult.reference} · {settings.preferredBibleAbbrev}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <CelebrationToast event={celebration} />

      {/* Modal: YouVersion Platform API Key & Bible Settings */}
      <Modal
        visible={showApiModal}
        animationType={reduceMotion ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setShowApiModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>YouVersion Platform</Text>
              <Pressable
                onPress={() => setShowApiModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalNote}>
              Mustard ships with curated verses from the New International Version (NIV, ID 111) for immediate offline use. Add your X-YVP-App-Key from developers.youversion.com to pull live passages in any licensed version.
            </Text>

            <Text style={styles.inputLabel}>YouVersion App Key (X-YVP-App-Key)</Text>
            <TextInput
              style={styles.textInput}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="Paste your X-YVP-App-Key..."
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Bible Version ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={bibleIdInput}
                  onChangeText={setBibleIdInput}
                  keyboardType="number-pad"
                  placeholder="111"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Abbreviation</Text>
                <TextInput
                  style={styles.textInput}
                  value={bibleAbbrevInput}
                  onChangeText={setBibleAbbrevInput}
                  placeholder="NIV"
                />
              </View>
            </View>

            {syncMessage && (
              <Text style={styles.syncStatusText}>{syncMessage}</Text>
            )}

            <Pressable
              onPress={handleSaveApiConfig}
              style={styles.saveApiBtn}
              disabled={isSyncing}>
              {isSyncing ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <Text style={styles.saveApiBtnText}>Save & Sync Passages</Text>
              )}
            </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 42,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
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
    marginTop: 2,
  },
  yvpConnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  yvpConnectBtnActive: {
    backgroundColor: COLORS.sproutLight,
  },
  yvpConnectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  featuredVerseCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F2E2B6',
    marginBottom: 18,
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.mustardLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mustardDark,
  },
  featuredText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 14,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredRef: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  featuredSource: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  filterRow: {
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceMuted,
  },
  filterChipActive: {
    backgroundColor: COLORS.text,
  },
  filterChipBookmarkActive: {
    backgroundColor: COLORS.mustard,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipBookmarkText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  verseCard: {
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
  verseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  themePill: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  verseCardBody: {
    fontSize: 14.5,
    lineHeight: 22,
    color: COLORS.text,
    marginBottom: 12,
  },
  verseCardRef: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  lookupBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 6,
  },
  lookupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  lookupDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  lookupInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lookupInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  lookupBtn: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 12,
  },
  lookupBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  lookupErrorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 8,
  },
  lookupResultCard: {
    marginTop: 12,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 14,
  },
  lookupResultText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORS.text,
    marginBottom: 6,
  },
  lookupResultRef: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mustardDark,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(35, 31, 24, 0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNote: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.sproutDark,
    marginBottom: 12,
  },
  saveApiBtn: {
    backgroundColor: COLORS.mustard,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveApiBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
});
