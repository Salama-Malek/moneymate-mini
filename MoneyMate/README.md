# MoneyMate - Personal Lending & Borrowing Tracker

**A complete React Native app for tracking money you lend or borrow, built with Expo and TypeScript.**

## 🚀 Features

### ✨ Core Functionality

- **Add/Edit/Delete Transactions**: Track lending and borrowing with full CRUD operations
- **Multi-Currency Support**: Support for EGP, USD, EUR, GBP, RUB, JPY, CNY, INR
- **Smart Notifications**: Local push notifications with configurable reminder timing
- **Archive System**: Archive completed transactions and restore when needed
- **Recurring Transactions**: Set up recurring payment schedules
- **Offline First**: All data stored locally with AsyncStorage

### 📊 Analytics & Dashboard

- **Real-time Statistics**: Total lent, borrowed, outstanding amounts
- **Visual Charts**: Pie charts and bar charts for financial insights
- **Overdue Tracking**: Highlight overdue transactions with smart alerts
- **Currency Breakdown**: View totals by currency
- **Monthly Trends**: Track transaction patterns over time

### 🔍 Search & Filter

- **Smart Search**: Search by person, amount, or notes
- **Advanced Filtering**: Filter by type, status, currency, or date
- **Tabbed Interface**: Separate views for active and archived transactions

### 🎨 Modern UI/UX

- **Beautiful Design**: Following Material Design principles
- **Smooth Animations**: Entrance animations, card transitions, and micro-interactions
- **Responsive Layout**: Works perfectly on all screen sizes
- **Dark/Light Theme**: Customizable app appearance
- **Branding**: Subtle "SM" watermark for Salama Malek branding

## 🛠 Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **State Management**: Zustand with persistence
- **Navigation**: React Navigation v6
- **Storage**: AsyncStorage for offline data
- **Notifications**: Expo Notifications
- **Icons**: Expo Vector Icons
- **Animations**: React Native Animated API
- **Date Handling**: date-fns

## 📱 Screens

1. **Dashboard (Home)**: Overview with statistics and upcoming transactions
2. **Transactions**: Active and archived transactions with search/filter
3. **Analytics**: Charts and financial insights
4. **Settings**: App configuration and data management
5. **Add Transaction**: Form for new transactions
6. **Edit Transaction**: Modify existing transactions
7. **Notification Settings**: Configure reminders and preferences

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd MoneyMate
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**

   ```bash
   expo start
   # or
   npm start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on physical device

## 📋 Project Structure

```
MoneyMate/
├── src/
│   ├── components/          # Reusable UI components
│   ├── constants/           # App constants and configuration
│   ├── navigation/          # Navigation setup
│   ├── screens/             # App screens
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions
├── App.tsx                  # Main app component
├── app.json                 # Expo configuration
└── package.json             # Dependencies
```

## 🎯 Key Components

### TransactionCard

- Swipeable actions (edit, archive, delete)
- Status-based color coding
- Recurring transaction indicators
- Subtle "SM" watermark

### StatsCard

- Animated value counting
- Trend indicators
- Responsive grid layout

### FloatingActionButton

- Ripple effects and animations
- Pulse animation for attention
- Customizable size and color

## 🔔 Notifications

- **Local Push Notifications**: No internet required
- **Configurable Timing**: 1, 3, or 7 days before due date
- **Smart Scheduling**: Automatically scheduled when transactions are added
- **Automatic Cleanup**: Cancelled when transactions are archived/deleted

## 💾 Data Management

- **Export**: JSON format with transaction history
- **Import**: Restore from backup files
- **Local Storage**: AsyncStorage with Zustand persistence
- **Offline Capable**: Works without internet connection

## 🎨 Theme & Design

### Color Palette

- **Primary**: #6C63FF (Vivid Indigo)
- **Secondary**: #FF6584 (Pink Coral)
- **Success**: #4CAF50 (Green)
- **Warning**: #FFC107 (Yellow)
- **Error**: #F44336 (Red)

### Typography

- **Primary Font**: Poppins (readable body text)
- **Secondary Font**: Montserrat (headers and emphasis)

### Animations

- **Entrance**: Fade-in and slide-up animations
- **Transitions**: Smooth tab switching and card animations
- **Micro-interactions**: Button presses and hover effects

## 📱 Platform Support

- ✅ iOS (iPhone & iPad)
- ✅ Android (Phone & Tablet)
- ✅ Web (Expo Web)

## 🔧 Configuration

### App Settings

- Default currency selection
- Theme preference (light/dark)
- Notification preferences
- Biometric authentication toggle

### Notification Settings

- Enable/disable notifications
- Reminder timing configuration
- Sound and vibration options
- Test notification functionality

## 🚀 Deployment

### Building for Production

```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios

# Build for web
expo build:web
```

### Publishing Updates

```bash
expo publish
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Salama Malek** - Developer and Designer

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- React Native community for continuous improvements
- All contributors and beta testers

## 📞 Support

For support, questions, or feature requests:

- Create an issue in the repository
- Contact: [Your Contact Information]

---

**MoneyMate** - Making personal finance tracking simple and beautiful! 💰✨
# moneymate-mini
