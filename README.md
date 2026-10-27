# Mustard

A friendly prayer companion that keeps track of what you're praying for, gently reminds you to pray throughout the day, and encourages you with verses from YouVersion.

## About

Mustard is a mobile app idea by [Andrew Virts](https://github.com/asvirts), a product manager at YouVersion. It is a small, steady place to keep the people and needs you are praying for, with gentle reminders through the day and Scripture nearby when you need a nudge to keep going.

The brand is playful and warm: a little yellow mustard-seed mascot who can sprout and grow as prayers are answered.

This is a personal project. It is not an official YouVersion app.

## Why the name

The name comes from Matthew 17:20. Jesus tells his friends that faith as small as a mustard seed is enough. A mustard seed is tiny, ordinary, and full of life — a good picture for prayers that start small and are worth tending.

## Features

- **Prayer list.** Add a request, write notes, give it a category, log prayer moments, and mark it answered with a date and reflection.
- **Answered-prayers history.** Look back on what has already been answered and preview all 6 stages of your mustard seed's growth.
- **Gentle reminders.** Customizable daily nudges through the day (`expo-notifications`), meant to invite prayer rather than interrupt it.
- **Encouraging verses.** Curated passages about prayer and mustard-seed faith (bundled in the Berean Standard Bible for immediate offline use) plus live passage fetching from the YouVersion Platform REST API (`api.youversion.com/v1`).
- **A growing seed.** The custom SVG mustard-seed mascot (`MustardMascot`) sprouts from a tiny seed into a flourishing mustard tree with a resting bird (Matthew 13:32) as prayers move into the answered history.

## Tech Stack

- **Framework:** React Native + Expo (`expo-router`, TypeScript) — runs on iOS, Android, and Web
- **Local Persistence:** Local-first on-device storage (`expo-sqlite` on iOS/Android with `AsyncStorage` fallback on Web)
- **Notifications:** `expo-notifications` for daily scheduled gentle prayer nudges
- **Scripture:** [YouVersion Platform](https://developers.youversion.com/) REST API (`GET /v1/bibles/{bible_id}/passages/{passage_id}`) + offline Berean Standard Bible (`bible_id: 3034`) passages
- **Illustrations:** `react-native-svg` custom 6-stage Mustard Seed mascot

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Expo development server:**
   ```bash
   npm run start
   ```
   - Press `i` to open in the iOS Simulator
   - Press `a` to open in the Android Emulator
   - Press `w` to open in the Web browser (`npm run web`)

3. **Optional — Connect a Live YouVersion Platform App Key:**
   - Register for an App Key at [developers.youversion.com](https://developers.youversion.com/).
   - Either set `EXPO_PUBLIC_YVP_APP_KEY=your_key_here` in a `.env.local` file, or tap **YouVersion API** in the **Verses** tab inside the app to enter your key and preferred Bible version ID.

## Project Structure

- `src/app/_layout.tsx` — Root tab navigation (`Prayers`, `Answered`, `Verses`, `Reminders`)
- `src/app/index.tsx` — Active Prayer List, category filters, prayer notes journal, and Mustard Seed growth hero card
- `src/app/answered.tsx` — Answered-prayers history timeline & interactive 6-stage mascot growth viewer
- `src/app/verses.tsx` — Daily encouraging verse, themed Scripture library, bookmarks, and live YouVersion USFM passage lookup
- `src/app/reminders.tsx` — Customizable daily gentle prayer nudges and test notifications
- `src/components/mustard-mascot.tsx` — Custom SVG mustard-seed mascot across 6 growth stages
- `src/context/mustard-context.tsx` — App state management and persistence synchronization
- `src/services/storage.ts` — Local SQLite + AsyncStorage persistence layer
- `src/services/youversion.ts` — YouVersion Platform REST API client (`api.youversion.com/v1`)
- `src/services/notifications.ts` — Local notification scheduling via `expo-notifications`

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 Andrew Virts.
