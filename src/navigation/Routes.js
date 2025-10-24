// src/navigation/Routes.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import AppStack from './AppStack';
import GiftReelPaymentScreen from '../Screens/GiftReelPaymentScreen';
import GiftReelScreen from '../Screens/GiftReelScreen';

const Stack = createNativeStackNavigator();

export default function Routes() {
  // 🧾 Stripe Sandbox key (matches backend)
  const stripeKey =
    "pk_test_51RXKLrIMEUGCmkevn3YDd0y1oRaPogoAAo5MpDFrMlfrM9YdO9ISBqrqaAl6kwoLQfQjScaaepDW8ZE0Tx7vyIKx00eiMFSmEZ";

  console.log("🧾 Stripe key in use:", stripeKey);

  return (
    // ✅ Wrap entire app in StripeProvider
    <StripeProvider
      publishableKey={stripeKey}
      merchantIdentifier="merchant.com.trevi.app" // safe placeholder for Apple Pay
    >
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Main app stack */}
          <Stack.Screen name="App" component={AppStack} />

          {/* Gift Reel payment screen */}
          <Stack.Screen
            name="GiftReelPaymentScreen"
            component={GiftReelPaymentScreen}
          />

          {/* Gift Reel view screen */}
          <Stack.Screen
            name="GiftReelScreen"
            component={GiftReelScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </StripeProvider>
  );
}
