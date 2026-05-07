# MoneyMate – Personal Lending & Borrowing Tracker

**Description:**
MoneyMate is a React Native app for tracking money you lend or borrow. It stores all data locally on your phone, supports multiple currencies, sends reminders for upcoming repayments, and allows archiving of completed transactions.

---

## Features

### Transactions
- Add new transactions:
  - Type: Lend / Borrow
  - Person’s Name / Contact
  - Amount
  - Currency (EGP, USD, Ruble, etc.)
  - Date Lent/Borrowed
  - Due Date
  - Status: Pending / Paid
  - Notes: Optional
- Edit / Delete transactions
- Archive completed transactions
- Restore archived transactions
- Swipe actions for quick edit/archive/delete

### Notifications & Reminders
- Local push notifications for upcoming due dates
- Configurable reminder timing (1, 3, 7 days before due)
- Notifications include person name, amount, due date
- Notifications stop for archived transactions

### Multi-Currency Support
- Store currency with each transaction
- Optional: show total in a default currency

### Analytics & Dashboard
- Summary totals: Total lent, total borrowed, outstanding amounts
- Highlight overdue transactions
- Optional charts for visual insights

### Search & Filter
- Search by person, amount, notes
- Filter by type, status, or currency

### Offline Storage
- All data stored locally on the device
- Uses AsyncStorage or SQLite
- Works fully offline
- Optional: export/import data as JSON for backup

### Optional Advanced Features
- Recurring transactions
- Secure login (PIN or biometric)
- Calendar view for upcoming payments
- Dark/light theme

---

## Data Model

```json
{
  "id": "uuid",
  "type": "lend",
  "person": "Ahmed",
  "amount": 500,
  "currency": "EGP",
  "date": "2025-08-19",
  "dueDate": "2025-09-05",
  "status": "pending",
  "archived": false,
  "notes": "Lent for groceries",
  "recurring": null
}
```

---

## App Screens & Layout

1. **Home / Dashboard**
   - Summary of totals (lent, borrowed, pending, overdue)
   - Quick add button
   - Overview of upcoming due transactions

2. **Transaction List**
   - Tabs: Active / Archived
   - Each transaction shows person, amount + currency, due date, status
   - Swipe actions: Edit / Archive / Delete

3. **Add / Edit Transaction**
   - Form fields for all transaction details
   - Save or cancel

4. **Archived Transactions**
   - Restore / Edit / Delete

5. **Notifications Settings**
   - Configure reminder times
   - Enable/disable notifications

6. **Analytics / Insights**
   - Totals, overdue list, optional charts

7. **Settings**
   - Default currency, theme, backup/export, optional PIN/biometric login

---

## Tech Stack
- React Native + TypeScript
- AsyncStorage / SQLite / Realm
- Redux or Zustand
- date-fns or moment for date handling
- Optional: Currency API (OpenExchangeRates / Fixer.io)

---

## Installation & Setup

1. Clone repository / scaffold via Cursor AI
2. Install dependencies:
```bash
npm install
# or
yarn install
```
3. Run on device or simulator:
```bash
npx react-native run-android
npx react-native run-ios
```
4. Grant notification permissions on the device
5. App is ready to use offline

---

## Usage Flow

1. Open app → view active transactions
2. Add new transaction → choose type, amount, due date, currency
3. App schedules local notification for due date
4. When payment is received → mark as paid → archive transaction
5. Archived transactions can be restored if needed
6. Search, filter, or view summary anytime

---

## Development Notes
- Fully offline-first; all data stored on-device
- Use AsyncStorage for small-scale storage, SQLite/Realm for more robust queries
- Notifications scheduled locally
- Multi-currency stored per transaction; optional conversion API
# moneymate-mini
