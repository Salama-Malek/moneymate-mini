import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation';
import { configureNotifications } from './src/utils';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { useMoneyMateStore } from './src/store';
import BiometricLock from './src/components/BiometricLock';

export default function App() {
  useEffect(() => {
    configureNotifications();
    // Generate any due recurring transactions on launch
    useMoneyMateStore.getState().processRecurringTransactions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <StatusBar style="auto" />
            <BiometricLock>
              <RootNavigator />
            </BiometricLock>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
