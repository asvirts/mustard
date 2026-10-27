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

import { COLORS } from '@/constants/mustard-data';
import { useMustard } from '@/context/mustard-context';
import { fetchYouVersionPassage } from '@/services/youversion';

export default function VersesScreen() {
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

  const handleSaveApiConfig = async () => {
    const parsedBibleId = Number.parseInt(bibleIdInput, 10) || 3034;
    updateSettings({
      youVersionAppKey: apiKeyInput.trim(),
      preferredBibleId: parsedBibleId,
      preferredBibleAbbrev: bibleAbbrevInput.trim() || 'BSB',
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
      setSyncMessage('Using bundled offline Berean Standard Bible verses.');
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
            <Text style={styles.screenTitle}>Encouraging Verses</Text>
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
              size={15}
              color={hasApiKey ? COLORS.sproutDark : '#2A2419'}
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
        <View style={styles.featuredVerseCard}>
          <View style={styles.featuredTopRow}>
            <View style={styles.featuredBadge}>
              <Ionicons name="sunny" size={14} color={COLORS.mustardDark} />
              <Text style={styles.featuredBadgeText}>TODAY’S MUSTARD SEED VERSE</Text>
            </View>
            <Pressable onPress={() => toggleBookmarkVerse(dailyVerse.id)}>
              <Ionicons
                name={dailyVerse.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={COLORS.mustardDark}
              />
            </Pressable>
          </View>

          <Text style={styles.featuredText}>{dailyVerse.text}</Text>
          <View style={styles.featuredFooter}>
            <Text style={styles.featuredRef}>
              {dailyVerse.reference} • {dailyVerse.versionAbbreviation}
            </Text>
            <Text style={styles.featuredSource}>
              {dailyVerse.source === 'youversion-api'
                ? 'YouVersion Platform Live'
                : 'YouVersion • BSB'}
            </Text>
          </View>
        </View>

        {/* Theme & Bookmark Filter Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          <Pressable
            onPress={() => setOnlyBookmarked((prev) => !prev)}
            style={[
              styles.filterChip,
              onlyBookmarked && styles.filterChipBookmarkActive,
            ]}>
            <Ionicons
              name={onlyBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={13}
              color={onlyBookmarked ? '#2A2419' : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.filterChipText,
                onlyBookmarked && styles.filterChipBookmarkText,
              ]}>
              Saved
            </Text>
          </Pressable>

          {themes.map((theme) => {
            const active = selectedTheme === theme;
            return (
              <Pressable
                key={theme}
                onPress={() => setSelectedTheme(theme)}
                style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}>
                  {theme}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Verse Cards List */}
        {filteredVerses.map((verse) => (
          <View key={verse.id} style={styles.verseCard}>
            <View style={styles.verseCardTop}>
              <View style={styles.themePill}>
                <Text style={styles.themePillText}>{verse.theme}</Text>
              </View>
              <Pressable
                onPress={() => toggleBookmarkVerse(verse.id)}
                hitSlop={8}>
                <Ionicons
                  name={verse.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={19}
                  color={
                    verse.isBookmarked ? COLORS.mustardDark : COLORS.textMuted
                  }
                />
              </Pressable>
            </View>

            <Text style={styles.verseCardBody}>{verse.text}</Text>

            <View style={styles.verseCardBottom}>
              <Text style={styles.verseCardRef}>
                {verse.reference} ({verse.versionAbbreviation})
              </Text>
              <Text style={styles.verseUsfmTag}>USFM: {verse.usfm}</Text>
            </View>
          </View>
        ))}

        {/* Live YouVersion Passage Lookup Box */}
        <View style={styles.lookupBox}>
          <Text style={styles.lookupTitle}>
            Look up any verse via YouVersion Platform
          </Text>
          <Text style={styles.lookupDesc}>
            Enter a USFM reference (e.g. `MAT.17.20`, `JHN.15.7`, `PSA.23.1`) to fetch directly from `api.youversion.com/v1`.
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
                <Text style={styles.lookupBtnText}>Fetch Verse</Text>
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
                {customLookupResult.reference} ({settings.preferredBibleAbbrev})
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal: YouVersion Platform API Key & Bible Settings */}
      <Modal
        visible={showApiModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowApiModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>YouVersion Platform Setup</Text>
              <Pressable onPress={() => setShowApiModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalNote}>
              Mustard ships with curated encouraging verses from the Berean Standard Bible (Bible ID `3034`) so it works offline immediately. Add your `X-YVP-App-Key` from developers.youversion.com to pull live passages in any licensed Bible version.
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
                  placeholder="3034"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Abbreviation</Text>
                <TextInput
                  style={styles.textInput}
                  value={bibleAbbrevInput}
                  onChangeText={setBibleAbbrevInput}
                  placeholder="BSB"
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
                <ActivityIndicator size="small" color="#2A2419" />
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
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  yvpConnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.mustardLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EAD08B',
    marginTop: 4,
  },
  yvpConnectBtnActive: {
    backgroundColor: COLORS.sproutLight,
    borderColor: '#B8DFB4',
  },
  yvpConnectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A2419',
  },
  featuredVerseCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0D999',
    marginBottom: 16,
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.mustardDark,
    letterSpacing: 0.6,
  },
  featuredText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 12,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredRef: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  featuredSource: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterRow: {
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  filterChipBookmarkActive: {
    backgroundColor: COLORS.mustard,
    borderColor: COLORS.mustardDark,
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
    color: '#2A2419',
    fontWeight: '700',
  },
  verseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  verseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  themePill: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  verseCardBody: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
    marginBottom: 10,
  },
  verseCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
    paddingTop: 8,
  },
  verseCardRef: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  verseUsfmTag: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  lookupBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  lookupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  lookupDesc: {
    fontSize: 12,
    lineHeight: 17,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  lookupBtn: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 12,
  },
  lookupBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    borderRadius: 12,
    padding: 12,
  },
  lookupResultText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,
    marginBottom: 6,
  },
  lookupResultRef: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mustardDark,
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalNote: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginBottom: 14,
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
    fontWeight: '800',
    color: '#2A2419',
  },
});
