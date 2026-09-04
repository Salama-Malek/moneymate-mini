# MoneyMate

A React Native + Expo app for tracking money you lend or borrow, fully offline.

## Overview

MoneyMate helps you keep track of personal loans — money lent to or borrowed from friends and family — without needing an internet connection. Every transaction is stored on-device, with support for multiple currencies, wallets, due-date reminders, and multi-language (including RTL Arabic) UI. The app is built with Expo and TypeScript, using Zustand for state management with local persistence.

## Features

- **Transactions** — add, edit, delete, archive, and restore lend/borrow records with person, amount, currency, category, dates, status, and optional notes
- **Recurring transactions** — automatically generates due transactions on a schedule
- **Wallets** — track balances across multiple wallets, with transfers and wallet-level transaction history
- **Multi-currency** — per-transaction currency (EGP, USD, EUR, GBP, RUB, JPY, CNY, INR)
- **Notifications & reminders** — local push notifications with configurable timing, custom notification sounds, and vibration
- **Analytics dashboard** — totals for lent/borrowed/outstanding amounts, overdue tracking, and charts
- **Search & filter** — filter by type, status, currency, or category; search by person or notes
- **Biometric lock** — optional PIN/biometric app lock
- **Dark/light theme** — full theming via a theme context
- **Multi-language** — in-app language switching with RTL support for Arabic
- **Offline-first storage** — all data persisted locally with AsyncStorage

## Tech stack

- React Native + Expo (SDK 54)
- TypeScript
- Zustand (with AsyncStorage persistence)
- React Navigation (native stack + bottom tabs)
- Expo Notifications, Expo Local Authentication, Expo Document Picker
- react-native-chart-kit for analytics charts
- date-fns for date handling

## Getting started

The app lives in the `MoneyMate/` directory.

```bash
cd MoneyMate
npm install

npm start        # start the Expo dev server
npm run android  # run on Android emulator/device
npm run ios      # run on iOS simulator/device
npm run web      # run in the browser
```

Requires Node.js and the Expo Go app (or a simulator) to run on a device.

## Project structure

```
MoneyMate/
├── App.tsx                 # App entry point, providers, boot sequence
├── app.json                 # Expo configuration
├── src/
│   ├── components/          # BiometricLock, TransactionCard, StatsCard, FloatingActionButton, CustomSoundSelector
│   ├── constants/           # Theme colors, categories, currencies, translations
│   ├── contexts/            # ThemeContext, LanguageContext (RTL-aware)
│   ├── navigation/           # Stack + tab navigation
│   ├── screens/              # Home, Transactions, Wallet, Analytics, Settings, Add/Edit Transaction, Notification Settings
│   ├── store/                # Zustand store (transactions, wallets, settings)
│   ├── types/                # Shared TypeScript types
│   └── utils/                # Notification scheduling, dashboard stats, sound/vibration service
└── assets/                  # App icons and splash screen
```
