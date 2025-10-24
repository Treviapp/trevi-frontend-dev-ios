import 'react-native-reanimated';  // 👈 must stay first
import 'text-encoding-polyfill';   // 👈 polyfill for TextEncoder/TextDecoder

import { registerRootComponent } from 'expo';
import { StripeProvider } from '@stripe/stripe-react-native';
import Routes from './src/navigation/Routes';

// ✅ Your Stripe test publishable key
const STRIPE_KEY = "pk_test_51RXKLrIMEUGCmkevn3YDd0y1oRaPogoAAo5MpDFrMlfrM9YdO9ISBqrqaAl6kwoLQfQjScaaepDW8ZE0Tx7vyIKx00eiMFSmEZ";

function App() {
  return (
    <StripeProvider publishableKey={STRIPE_KEY}>
      <Routes />
    </StripeProvider>
  );
}
import { logBaseURL } from './src/api/config';
logBaseURL();
registerRootComponent(App);
