import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Wallet, WalletTransaction, AppSettings, DashboardStats } from '../types';
import { DEFAULT_WALLETS, RECURRING_FREQUENCIES } from '../constants';
import { scheduleNotification, cancelNotification, calculateDashboardStats } from '../utils';

interface MoneyMateState {
  // State
  transactions: Transaction[];
  archivedTransactions: Transaction[];
  wallets: Wallet[];
  walletTransactions: WalletTransaction[];
  settings: AppSettings;
  isLoading: boolean;

  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  archiveTransaction: (id: string) => void;
  restoreTransaction: (id: string) => void;
  
  // Wallet Actions
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  updateWalletBalance: (walletId: string, amount: number, type: 'credit' | 'debit') => void;
  transferBetweenWallets: (fromWalletId: string, toWalletId: string, amount: number) => void;
  
  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
  setLoading: (loading: boolean) => void;

  // Recurring
  processRecurringTransactions: () => number;

  // Getters
  getDashboardStats: () => DashboardStats;
  getActiveTransactions: () => Transaction[];
  getOverdueTransactions: () => Transaction[];
  getUpcomingTransactions: () => Transaction[];
  getTransactionsByPerson: (person: string) => Transaction[];
  searchTransactions: (query: string) => Transaction[];
  filterTransactions: (filters: { type?: string; status?: string; currency?: string }) => Transaction[];
  
  // Wallet Getters
  getWalletByCurrency: (currency: string) => Wallet | undefined;
  getDefaultWallet: () => Wallet | undefined;
  getWalletBalance: (currency: string) => number;
  getWalletTransactions: (walletId: string) => WalletTransaction[];
}

export const useMoneyMateStore = create<MoneyMateState>()(
  persist(
    (set, get) => ({
      // Initial State
      transactions: [],
      archivedTransactions: [],
      wallets: DEFAULT_WALLETS,
      walletTransactions: [],
      settings: {
        defaultCurrency: 'EGP',
        theme: 'light',
        language: 'en',
        notifications: {
          enabled: true,
          reminderDays: [1, 3, 7],
          sound: true,
          vibration: true,
          haptics: true,
        },
        biometricEnabled: false,
      },
      isLoading: false,

      // Actions
      addTransaction: (transactionData) => {
        const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const transaction: Transaction = {
          ...transactionData,
          id,
        };

        set((state) => {
          const newTransactions = [...state.transactions, transaction];
          
          // Update wallet balance based on transaction type
          const wallet = state.wallets.find(w => w.currency === transaction.currency);
          if (wallet) {
            let balanceChange = 0;
            let transactionType: 'credit' | 'debit' = 'debit';
            
            if (transaction.type === 'lend') {
              // When lending, money goes out of your wallet
              balanceChange = -transaction.amount;
              transactionType = 'debit';
            } else if (transaction.type === 'borrow') {
              // When borrowing, money comes into your wallet
              balanceChange = transaction.amount;
              transactionType = 'credit';
            }

            // Update wallet balance
            const updatedWallets = state.wallets.map(w => 
              w.id === wallet.id 
                ? { ...w, balance: w.balance + balanceChange, updatedAt: new Date().toISOString() }
                : w
            );

            // Add wallet transaction record
            const walletTransaction: WalletTransaction = {
              id: `wtxn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              walletId: wallet.id,
              type: transactionType,
              amount: Math.abs(balanceChange),
              currency: transaction.currency,
              description: `${transaction.type === 'lend' ? 'Lent to' : 'Borrowed from'} ${transaction.person}`,
              relatedTransactionId: id,
              date: new Date().toISOString(),
              balanceAfter: wallet.balance + balanceChange,
            };

            return {
              transactions: newTransactions,
              wallets: updatedWallets,
              walletTransactions: [...state.walletTransactions, walletTransaction],
            };
          }

          return { transactions: newTransactions };
        });

        // Schedule notification if transaction has due date
        if (transaction.dueDate && transaction.status === 'pending') {
          scheduleNotification(transaction, get().settings.notifications);
        }
      },

      updateTransaction: (id, updates) => {
        set((state) => {
          const transactionIndex = state.transactions.findIndex(t => t.id === id);
          if (transactionIndex === -1) return state;

          const oldTransaction = state.transactions[transactionIndex];
          const updatedTransaction = { ...oldTransaction, ...updates };

          // Handle wallet balance changes if amount or currency changed
          if (updates.amount !== undefined || updates.currency !== undefined) {
            const oldWallet = state.wallets.find(w => w.currency === oldTransaction.currency);
            const newWallet = state.wallets.find(w => w.currency === (updates.currency || oldTransaction.currency));
            
            if (oldWallet && newWallet) {
              let oldBalanceChange = 0;
              let newBalanceChange = 0;
              
              if (oldTransaction.type === 'lend') {
                oldBalanceChange = -oldTransaction.amount;
                newBalanceChange = -(updates.amount || oldTransaction.amount);
              } else if (oldTransaction.type === 'borrow') {
                oldBalanceChange = oldTransaction.amount;
                newBalanceChange = updates.amount || oldTransaction.amount;
              }

              // Revert old balance change
              const revertedWallets = state.wallets.map(w => 
                w.id === oldWallet.id 
                  ? { ...w, balance: w.balance - oldBalanceChange, updatedAt: new Date().toISOString() }
                  : w
              );

              // Apply new balance change
              const finalWallets = revertedWallets.map(w => 
                w.id === newWallet.id 
                  ? { ...w, balance: w.balance + newBalanceChange, updatedAt: new Date().toISOString() }
                  : w
              );

              return {
                ...state,
                transactions: state.transactions.map((t, i) => 
                  i === transactionIndex ? updatedTransaction : t
                ),
                wallets: finalWallets,
              };
            }
          }

          return {
            ...state,
            transactions: state.transactions.map((t, i) => 
              i === transactionIndex ? updatedTransaction : t
            ),
          };
        });

        // Update notification if due date changed
        if (updates.dueDate || updates.status) {
          const transaction = get().transactions.find(t => t.id === id);
          if (transaction) {
            if (transaction.status === 'pending') {
              scheduleNotification(transaction, get().settings.notifications);
            } else {
              cancelNotification(transaction.id);
            }
          }
        }
      },

      deleteTransaction: (id) => {
        set((state) => {
          const transaction = state.transactions.find(t => t.id === id);
          if (!transaction) return state;

          // Revert wallet balance change
          const wallet = state.wallets.find(w => w.currency === transaction.currency);
          if (wallet) {
            let balanceChange = 0;
            
            if (transaction.type === 'lend') {
              // When deleting a loan, money comes back to your wallet
              balanceChange = transaction.amount;
            } else if (transaction.type === 'borrow') {
              // When deleting a borrow, money goes out of your wallet
              balanceChange = -transaction.amount;
            }

            const updatedWallets = state.wallets.map(w => 
              w.id === wallet.id 
                ? { ...w, balance: w.balance + balanceChange, updatedAt: new Date().toISOString() }
                : w
            );

            return {
              ...state,
              transactions: state.transactions.filter(t => t.id !== id),
              wallets: updatedWallets,
            };
          }

          return {
            ...state,
            transactions: state.transactions.filter(t => t.id !== id),
          };
        });

        // Cancel notification
        cancelNotification(id);
      },

      archiveTransaction: (id) => {
        set((state) => {
          const transaction = state.transactions.find(t => t.id === id);
          if (!transaction) return state;

          return {
            ...state,
            transactions: state.transactions.filter(t => t.id !== id),
            archivedTransactions: [...state.archivedTransactions, { ...transaction, archived: true }],
          };
        });

        // Cancel notification
        cancelNotification(id);
      },

      restoreTransaction: (id) => {
        set((state) => {
          const transaction = state.archivedTransactions.find(t => t.id === id);
          if (!transaction) return state;

          return {
            ...state,
            archivedTransactions: state.archivedTransactions.filter(t => t.id !== id),
            transactions: [...state.transactions, { ...transaction, archived: false }],
          };
        });

        // Reschedule notification if transaction is pending
        const transaction = get().archivedTransactions.find(t => t.id === id);
        if (transaction && transaction.status === 'pending') {
          scheduleNotification(transaction, get().settings.notifications);
        }
      },

      // Wallet Actions
      addWallet: (walletData) => {
        const id = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const wallet: Wallet = {
          ...walletData,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          wallets: [...state.wallets, wallet],
        }));
      },

      updateWallet: (id, updates) => {
        set((state) => ({
          wallets: state.wallets.map(w => 
            w.id === id 
              ? { ...w, ...updates, updatedAt: new Date().toISOString() }
              : w
          ),
        }));
      },

      deleteWallet: (id) => {
        set((state) => {
          const wallet = state.wallets.find(w => w.id === id);
          if (!wallet || wallet.isDefault) return state; // Prevent deleting default wallet

          // Check if this is the only wallet for this currency
          const walletsInSameCurrency = state.wallets.filter(w => w.currency === wallet.currency);
          if (walletsInSameCurrency.length === 1) {
            // Don't allow deleting the last wallet of a currency if there are transactions
            const hasTransactions = state.transactions.some(t => t.currency === wallet.currency);
            if (hasTransactions) return state;
          }

          return {
            wallets: state.wallets.filter(w => w.id !== id),
            walletTransactions: state.walletTransactions.filter(wt => wt.walletId !== id),
          };
        });
      },

      updateWalletBalance: (walletId, amount, type) => {
        set((state) => {
          const wallet = state.wallets.find(w => w.id === walletId);
          if (!wallet) return state;

          const balanceChange = type === 'credit' ? amount : -amount;
          const newBalance = wallet.balance + balanceChange;

          const updatedWallets = state.wallets.map(w => 
            w.id === walletId 
              ? { ...w, balance: newBalance, updatedAt: new Date().toISOString() }
              : w
          );

          const walletTransaction: WalletTransaction = {
            id: `wtxn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            walletId,
            type,
            amount,
            currency: wallet.currency,
            description: type === 'credit' ? 'Manual credit' : 'Manual debit',
            date: new Date().toISOString(),
            balanceAfter: newBalance,
          };

          return {
            wallets: updatedWallets,
            walletTransactions: [...state.walletTransactions, walletTransaction],
          };
        });
      },

      transferBetweenWallets: (fromWalletId, toWalletId, amount) => {
        set((state) => {
          const fromWallet = state.wallets.find(w => w.id === fromWalletId);
          const toWallet = state.wallets.find(w => w.id === toWalletId);
          
          if (!fromWallet || !toWallet || fromWallet.currency !== toWallet.currency) return state;

          const updatedWallets = state.wallets.map(w => {
            if (w.id === fromWalletId) {
              return { ...w, balance: w.balance - amount, updatedAt: new Date().toISOString() };
            }
            if (w.id === toWalletId) {
              return { ...w, balance: w.balance + amount, updatedAt: new Date().toISOString() };
            }
            return w;
          });

          // Get the updated wallet balances for transaction records
          const updatedFromWallet = updatedWallets.find(w => w.id === fromWalletId);
          const updatedToWallet = updatedWallets.find(w => w.id === toWalletId);

          const fromTransaction: WalletTransaction = {
            id: `wtxn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            walletId: fromWalletId,
            type: 'debit',
            amount,
            currency: fromWallet.currency,
            description: `Transfer to ${toWallet.name}`,
            date: new Date().toISOString(),
            balanceAfter: updatedFromWallet!.balance,
          };

          const toTransaction: WalletTransaction = {
            id: `wtxn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            walletId: toWalletId,
            type: 'credit',
            amount,
            currency: toWallet.currency,
            description: `Transfer from ${fromWallet.name}`,
            date: new Date().toISOString(),
            balanceAfter: updatedToWallet!.balance,
          };

          return {
            wallets: updatedWallets,
            walletTransactions: [...state.walletTransactions, fromTransaction, toTransaction],
          };
        });
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      processRecurringTransactions: () => {
        const state = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const toCreate: Transaction[] = [];
        const updates: { id: string; lastGeneratedDate: string }[] = [];

        const allTx = [...state.transactions, ...state.archivedTransactions];
        for (const tx of allTx) {
          if (!tx.recurring || !tx.recurring.frequency) continue;
          const freq = RECURRING_FREQUENCIES.find(f => f.value === tx.recurring!.frequency);
          if (!freq) continue;

          const endDate = tx.recurring.endDate ? new Date(tx.recurring.endDate) : null;
          if (endDate && endDate < today) continue;

          const startFrom = tx.recurring.lastGeneratedDate
            ? new Date(tx.recurring.lastGeneratedDate)
            : new Date(tx.date);

          let next = new Date(startFrom);
          next.setDate(next.getDate() + freq.days);

          let lastGen = tx.recurring.lastGeneratedDate;
          while (next <= today && (!endDate || next <= endDate)) {
            const occurrenceDate = next.toISOString().split('T')[0];
            // Skip if a generated occurrence already exists for this parent on this date
            const exists = allTx.some(t => t.notes?.includes(`[recurring:${tx.id}:${occurrenceDate}]`));
            if (!exists) {
              const dueOffsetMs = new Date(tx.dueDate).getTime() - new Date(tx.date).getTime();
              const newDue = new Date(next.getTime() + dueOffsetMs);
              toCreate.push({
                id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${toCreate.length}`,
                type: tx.type,
                person: tx.person,
                amount: tx.amount,
                currency: tx.currency,
                date: occurrenceDate,
                dueDate: newDue.toISOString().split('T')[0],
                status: 'pending',
                archived: false,
                notes: `${tx.notes || ''}\n[recurring:${tx.id}:${occurrenceDate}]`.trim(),
                category: tx.category,
                recurring: null,
              });
            }
            lastGen = occurrenceDate;
            next.setDate(next.getDate() + freq.days);
          }

          if (lastGen && lastGen !== tx.recurring.lastGeneratedDate) {
            updates.push({ id: tx.id, lastGeneratedDate: lastGen });
          }
        }

        if (toCreate.length === 0 && updates.length === 0) return 0;

        set((s) => ({
          transactions: [
            ...s.transactions.map(t => {
              const u = updates.find(x => x.id === t.id);
              return u && t.recurring
                ? { ...t, recurring: { ...t.recurring, lastGeneratedDate: u.lastGeneratedDate } }
                : t;
            }),
            ...toCreate,
          ],
          archivedTransactions: s.archivedTransactions.map(t => {
            const u = updates.find(x => x.id === t.id);
            return u && t.recurring
              ? { ...t, recurring: { ...t.recurring, lastGeneratedDate: u.lastGeneratedDate } }
              : t;
          }),
        }));

        for (const tx of toCreate) {
          if (tx.status === 'pending') {
            scheduleNotification(tx, get().settings.notifications);
          }
        }

        return toCreate.length;
      },

      // Getters
      getDashboardStats: () => {
        const state = get();
        const stats = calculateDashboardStats(state.transactions);
        
        // Add wallet-related stats
        const totalWalletBalance = state.wallets.reduce((total, wallet) => total + wallet.balance, 0);
        const defaultWallet = state.wallets.find(w => w.isDefault);
        const defaultCurrencyBalance = defaultWallet ? defaultWallet.balance : 0;

        return {
          ...stats,
          totalWalletBalance,
          defaultCurrencyBalance,
        };
      },

      getActiveTransactions: () => {
        return get().transactions.filter(t => !t.archived);
      },

      getOverdueTransactions: () => {
        const now = new Date();
        return get().transactions.filter(t => 
          !t.archived && 
          t.status === 'pending' && 
          new Date(t.dueDate) < now
        );
      },

      getUpcomingTransactions: () => {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return get().transactions.filter(t => 
          !t.archived && 
          t.status === 'pending' && 
          new Date(t.dueDate) >= now && 
          new Date(t.dueDate) <= weekFromNow
        );
      },

      getTransactionsByPerson: (person) => {
        return get().transactions.filter(t => 
          !t.archived && 
          t.person.toLowerCase().includes(person.toLowerCase())
        );
      },

      searchTransactions: (query) => {
        const searchTerm = query.toLowerCase();
        return get().transactions.filter(t => 
          !t.archived && (
            t.person.toLowerCase().includes(searchTerm) ||
            t.notes?.toLowerCase().includes(searchTerm) ||
            t.amount.toString().includes(searchTerm)
          )
        );
      },

      filterTransactions: (filters) => {
        return get().transactions.filter(t => 
          !t.archived && (
            (!filters.type || t.type === filters.type) &&
            (!filters.status || t.status === filters.status) &&
            (!filters.currency || t.currency === filters.currency)
          )
        );
      },

      // Wallet Getters
      getWalletByCurrency: (currency) => {
        return get().wallets.find(w => w.currency === currency);
      },

      getDefaultWallet: () => {
        return get().wallets.find(w => w.isDefault);
      },

      getWalletBalance: (currency) => {
        const wallet = get().wallets.find(w => w.currency === currency);
        return wallet ? wallet.balance : 0;
      },

      getWalletTransactions: (walletId) => {
        return get().walletTransactions
          .filter(wt => wt.walletId === walletId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
    }),
    {
      name: 'moneymate-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
