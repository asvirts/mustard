import { EncouragingVerse, GrowthStage, PrayerCategory, PrayerRequest, ReminderItem } from '@/types/mustard';

export const COLORS = {
  background: '#FFFBF2',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF4DA',
  surfaceMuted: '#F5EFE2',
  border: '#ECE1CC',
  text: '#2A2419',
  textSecondary: '#695E4A',
  textMuted: '#998C74',
  mustard: '#E2A315',
  mustardLight: '#FFF0C2',
  mustardDark: '#A87405',
  sprout: '#478243',
  sproutLight: '#E3F2E1',
  sproutDark: '#2E592B',
  earth: '#8C6239',
  coral: '#D96B43',
  sky: '#4B83A6',
  danger: '#C84B31',
};

export const CATEGORIES: {
  id: PrayerCategory;
  label: string;
  emoji: string;
  color: string;
  bg: string;
}[] = [
  { id: 'Family', label: 'Family', emoji: '🏠', color: '#B36B00', bg: '#FFF0D4' },
  { id: 'Friends', label: 'Friends', emoji: '🤝', color: '#386FA4', bg: '#E3F1FA' },
  { id: 'Health', label: 'Health', emoji: '🌿', color: '#3B7A57', bg: '#E2F2E8' },
  { id: 'Guidance', label: 'Guidance', emoji: '🧭', color: '#6C4F9E', bg: '#EFEAF8' },
  { id: 'Gratitude', label: 'Gratitude', emoji: '☀️', color: '#C46210', bg: '#FDECE0' },
  { id: 'World', label: 'World', emoji: '🌍', color: '#2F6F7E', bg: '#E1F2F5' },
  { id: 'Personal', label: 'Personal', emoji: '💛', color: '#9E6B0E', bg: '#FDF3D7' },
];

export const GROWTH_STAGES: GrowthStage[] = [
  {
    stage: 1,
    name: 'Tiny Mustard Seed',
    subtitle: 'Planted in hope',
    description:
      'Every prayer begins small, like a tiny mustard seed tucked into warm soil. Keep tending your prayers day by day.',
    minAnswered: 0,
    nextThreshold: 1,
  },
  {
    stage: 2,
    name: 'First Crack & Root',
    subtitle: 'Faith taking hold',
    description:
      'Your first answered prayer! Beneath the surface, roots are reaching down and life is stirring.',
    minAnswered: 1,
    nextThreshold: 3,
  },
  {
    stage: 3,
    name: 'Little Green Sprout',
    subtitle: 'Reaching toward the light',
    description:
      'Two bright cotyledon leaves have broken through the earth — a steady reminder of faithfulness.',
    minAnswered: 3,
    nextThreshold: 6,
  },
  {
    stage: 4,
    name: 'Leafy Seedling',
    subtitle: 'Growing stronger each week',
    description:
      'True mustard leaves are unfolding. Looking back at what has been answered gives strength for today.',
    minAnswered: 6,
    nextThreshold: 10,
  },
  {
    stage: 5,
    name: 'Blooming Mustard Plant',
    subtitle: 'Bright yellow blossoms',
    description:
      'Golden mustard flowers are opening! What started as the smallest seed is now full of warmth and color.',
    minAnswered: 10,
    nextThreshold: 15,
  },
  {
    stage: 6,
    name: 'Flourishing Mustard Tree',
    subtitle: 'A shelter for the birds of the air',
    description:
      'Just like Matthew 13:32 describes, your tiny seed has grown into a flourishing tree where birds come and rest in its branches.',
    minAnswered: 15,
    nextThreshold: null,
  },
];

export function getGrowthStage(answeredCount: number): GrowthStage {
  let current = GROWTH_STAGES[0];
  for (const stage of GROWTH_STAGES) {
    if (answeredCount >= stage.minAnswered) {
      current = stage;
    }
  }
  return current;
}

export const CURATED_VERSES: EncouragingVerse[] = [
  {
    id: 'mat-17-20',
    usfm: 'MAT.17.20',
    reference: 'Matthew 17:20',
    versionAbbreviation: 'BSB',
    bibleId: 3034,
    text: '“Truly I tell you, if you have faith the size of a mustard seed, you can say to this mountain, ‘Move from here to there,’ and it will move. Nothing will be impossible for you.”',
    theme: 'Mustard Seed Faith',
    source: 'curated',
  },
  {
    id: 'mat-13-31',
    usfm: 'MAT.13.31-32',
    reference: 'Matthew 13:31–32',
    versionAbbreviation: 'BSB',
    bibleId: 3034,
    text: '“The kingdom of heaven is like a mustard seed that a man planted in his field. Although it is the smallest of all seeds, yet it grows into the largest of garden plants and becomes a tree, so that the birds of the air come and nest in its branches.”',
    theme: 'Mustard Seed Faith',
    source: 'curated',
  },
  {
    id: 'php-4-6',
    usfm: 'PHP.4.6-7',
    reference: 'Philippians 4:6–7',
    versionAbbreviation: 'BSB',
    bibleId: 3034,
    text: 'Be anxious for nothing, but in everything, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.',
    theme: 'Peace in Prayer',
    source: 'curated',
  },
  {
    id: '1th-5-16',
    usfm: '1TH.5.16-18',
    reference: '1 Thessalonians 5:16–18',
    versionAbbreviation: 'BSB',
    bibleId: 3034,
    text: 'Rejoice at all times. Pray without ceasing. Give thanks in every circumstance, for this is God’s will for you in Christ Jesus.',
    theme: 'Daily Rhythm',
    source: 'curated',
  },
  {
    id: 'psa-145-18',
    usfm: 'PSA.145.18',
    reference: 'Psalm 145:18',
    versionAbbreviation: 'BSB',
    bibleId: 3034,
    text: 'The LORD is near to all who call on Him, to all who call out to Him in truth.',
    theme: 'God’s Nearness',
    source: 'curated',
  },
  {
    id: 'heb-4-16',
    usfm: 'HEB.4.16',
    reference: 'Hebrews 4:16',
    versionAbbreviation: 'BSB',
    bibleId: 3034,
    text: 'Let us then approach the throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need.',
    theme: 'Confidence',
    source: 'curated',
  },
  {
    id: 'jas-5-16',
    usfm: 'JAS.5.16',
    reference: 'James 5:16',
    versionAbbreviation: 'BSB',
    bibleId: 3034,
    text: 'Therefore confess your sins to each other and pray for each other so that you may be healed. The prayer of a righteous person has great power to prevail.',
    theme: 'Praying for Others',
    source: 'curated',
  },
  {
    id: 'rom-12-12',
    usfm: 'ROM.12.12',
    reference: 'Romans 12:12',
    versionAbbreviation: 'BSB',
    bibleId: 3034,
    text: 'Be joyful in hope, patient in affliction, persistent in prayer.',
    theme: 'Persistence',
    source: 'curated',
  },
  {
    id: 'col-4-2',
    usfm: 'COL.4.2',
    reference: 'Colossians 4:2',
    versionAbbreviation: 'BSB',
    bibleId: 3034,
    text: 'Devote yourselves to prayer, being watchful and thankful.',
    theme: 'Gratitude',
    source: 'curated',
  },
  {
    id: '1jn-5-14',
    usfm: '1JN.5.14-15',
    reference: '1 John 5:14–15',
    versionAbbreviation: 'BSB',
    bibleId: 3034,
    text: 'And this is the confidence that we have before Him: If we ask anything according to His will, He hears us. And if we know that He hears us in whatever we ask, we know that we already possess what we have asked of Him.',
    theme: 'Confidence',
    source: 'curated',
  },
];

export const INITIAL_PRAYERS: PrayerRequest[] = [
  {
    id: 'seed-prayer-1',
    title: 'Mom’s knee recovery & physical therapy',
    details: 'Praying for steady healing, less pain at night, and encouragement during her weekly therapy sessions.',
    category: 'Health',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    prayedCount: 8,
    lastPrayedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isAnswered: false,
    notes: [
      {
        id: 'note-101',
        text: 'Doctor said swelling is down this week — thankful for small steps!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
    ],
  },
  {
    id: 'seed-prayer-2',
    title: 'Wisdom for our family’s next chapter',
    details: 'Asking for clarity, unity, and peace as we weigh upcoming schedule and housing decisions.',
    category: 'Family',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    prayedCount: 5,
    lastPrayedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    isAnswered: false,
    notes: [],
  },
  {
    id: 'seed-prayer-3',
    title: 'Marcus starting his new teaching role',
    details: 'That he would build great connections with his students and feel settled in the new school.',
    category: 'Friends',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    prayedCount: 11,
    lastPrayedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isAnswered: true,
    answeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    answeredReflection:
      'Marcus texted after his first full week — his classroom feels welcoming and two colleagues have already taken him under their wing!',
    notes: [
      {
        id: 'note-102',
        text: 'First day of orientation went smoothly.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
      },
    ],
  },
];

export const INITIAL_REMINDERS: ReminderItem[] = [
  {
    id: 'rem-morning',
    label: 'Morning Quiet Moment',
    hour: 8,
    minute: 0,
    enabled: true,
    message: 'Good morning 🌱 Take a gentle minute to lift up one person on your prayer list.',
    days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'rem-midday',
    label: 'Midday Pause',
    hour: 12,
    minute: 30,
    enabled: true,
    message: 'Pause and breathe — a tiny mustard-seed prayer in the middle of your day.',
    days: [1, 2, 3, 4, 5],
  },
  {
    id: 'rem-evening',
    label: 'Evening Gratitude',
    hour: 20,
    minute: 30,
    enabled: false,
    message: 'As the day winds down, thank God for one small answer or kindness today.',
    days: [0, 1, 2, 3, 4, 5, 6],
  },
];
