import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import styles from './Style';
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import MakePaymentBackground from '../MakePaymentBackground';
import { API_BASE_URL } from '../../api/config';

export default function MakePaymentScreen({ route, navigation }) {
  const { name, amount, message, photo, hostCode } = route.params;
  const { confirmPayment, loading } = useConfirmPayment(); // Stripe's internal loading for confirm step
  const [cardDetails, setCardDetails] = useState();
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);
  const slowTimerRef = useRef(null);

  // ✅ Calculate Trevi fee (4% + £1)
  const giftAmount = parseFloat(amount);
  const treviFee = (giftAmount * 0.04) + 1;
  const totalAmount = giftAmount + treviFee;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const isBusy = submitting || loading;

  const fetchPaymentIntent = async (formData) => {
    const API_URL = `${API_BASE_URL}/stripe/payment-intent`;
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log('📡 Fetch to:', API_URL, '(attempt', attempt + 1, ')');
        const response = await fetch(API_URL, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });

        const rawText = await response.text();
        console.log('📨 Raw server response text:', rawText);

        // Try parse; throw with raw text included if it fails
        let data;
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          const parseErr = new Error('Invalid JSON from server');
          parseErr.raw = rawText;
          throw parseErr;
        }

        if (!response.ok) {
          const msg =
            data?.message ||
            data?.error ||
            `Server error (${response.status})`;
          throw new Error(msg);
        }

        return data;
      } catch (err) {
        lastErr = err;
        console.warn('⚠️ create PaymentIntent error:', err?.message || err);
        if (attempt === 0) {
          await sleep(700);
          continue;
        }
        throw lastErr;
      }
    }
  };

  const handleConfirmPayment = async () => {
    if (!cardDetails?.complete) {
      Alert.alert('Validation', 'Please enter complete card details.');
      return;
    }

    setSubmitting(true);
    setSlow(false);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => setSlow(true), 2000);

    const minLoadMs = 900;
    const start = Date.now();

    try {
      console.log('📦 hostCode being sent:', hostCode);
      console.log('🧪 route.params:', route.params);

      const formData = new FormData();
      formData.append('amount', Math.round(parseFloat(amount) * 100)); // gift only (pence)
      formData.append('host_code', hostCode);
      formData.append('name', name ?? '');
      formData.append('message', message ?? '');

      if (photo?.uri) {
        const fileName = photo.uri.split('/').pop();
        const fileType = (fileName?.split('.').pop() || 'jpeg').toLowerCase();
        formData.append('photo', {
          uri: photo.uri,
          name: fileName || `photo.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      // 1️⃣ Create PaymentIntent
      const data = await fetchPaymentIntent(formData);
      console.log('✅ Parsed JSON response:', data);

      const clientSecret = data?.clientSecret;
      if (!clientSecret) throw new Error('No client secret returned');

      // 2️⃣ Confirm Payment with Stripe
      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: { billingDetails: { name } },
      });

      console.log('📍 paymentIntent:', paymentIntent);
      console.log('❌ confirmPayment error:', error);

      const elapsed = Date.now() - start;
      if (elapsed < minLoadMs) await sleep(minLoadMs - elapsed);

      if (error) {
        Alert.alert('Payment failed', error.message);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'Succeeded') {
        console.log('✅ Payment succeeded! Navigating to success screen...');
        navigation.navigate('DonationSuccess', { donorName: name, amount });
        return;
      }

      Alert.alert(
        'Payment incomplete',
        'Something went wrong with the payment. Please try again.'
      );
    } catch (err) {
      console.error('❌ Stripe payment error:', err);
      const elapsed = Date.now() - start;
      if (elapsed < minLoadMs) await sleep(minLoadMs - elapsed);
      Alert.alert('Error', err?.message || 'Could not process payment. Please try again.');
    } finally {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
      setSubmitting(false);
    }
  };

  const handleGoHome = () => {
    if (isBusy) return;
    navigation.navigate('Welcome');
  };

  return (
    <MakePaymentBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Confirm & Pay</Text>

          <Text style={styles.summary}>Gift Amount: £{giftAmount.toFixed(2)}</Text>
          <Text style={styles.summary}>Trevi Fee: £{treviFee.toFixed(2)}</Text>
          <Text style={styles.summaryTotal}>Total to Pay: £{totalAmount.toFixed(2)}</Text>

          {message ? <Text style={styles.summary}>Message: {message}</Text> : null}

          {photo && (
            <Image
              source={{ uri: photo.uri }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <CardField
            postalCodeEnabled={false}
            placeholder={{ number: '4242 4242 4242 4242' }}
            cardStyle={styles.cardField}
            style={styles.cardContainer}
            onCardChange={setCardDetails}
            autofocus
            enabled={!isBusy}
          />

          <TouchableOpacity
            style={[styles.button, isBusy && { opacity: 0.6 }]}
            onPress={handleConfirmPayment}
            disabled={isBusy}
          >
            <Text style={styles.buttonText}>
              {isBusy ? 'Processing…' : 'Confirm & Pay'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={handleGoHome} disabled={isBusy}>
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </ScrollView>

        {isBusy && (
          <View style={localStyles.overlay}>
            <ActivityIndicator size="large" />
            <Text style={localStyles.overlayText}>
              {slow ? 'Still working…' : 'Loading…'}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </MakePaymentBackground>
  );
}

const localStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  overlayText: {
    marginTop: 10,
    fontSize: 16,
  },
});


