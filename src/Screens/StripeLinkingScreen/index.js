import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import styles from './Style';
import { client } from '../../api/config';
import { useNavigation } from '@react-navigation/native';

export default function StripeLinkingScreen({ route }) {
  const navigation = useNavigation();

  // ✅ Params passed from HostCreateMessageScreen
  const {
    fullName = '',
    email = '',
    eventName = '',
    guestMessage = '',
    hostCode = '',
    guestCode = '',
    hostImageUrl = '',
  } = route?.params ?? {};

  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const slowTimerRef = useRef(null);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const isRetriable = (err) => {
    const status = err?.response?.status;
    return err?.code === 'ECONNABORTED' || !status || status >= 500;
  };

  // ✅ Create Stripe onboarding link only (no campaign creation)
  const createStripeLink = async (host_code) => {
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log('📡 POST /stripe/connect (attempt', attempt + 1, ')', { hostCode: host_code });
        const res = await client.post(
          '/stripe/connect',
          { hostCode: host_code },
          { timeout: 15000 }
        );
        return res.data;
      } catch (err) {
        lastErr = err;
        console.warn('⚠️ stripe connect error:', err?.message || err);
        if (attempt === 0 && isRetriable(err)) {
          await sleep(700);
          continue;
        }
        throw lastErr;
      }
    }
  };

  const handleConnectStripe = async () => {
    setLoading(true);
    setSlow(false);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => setSlow(true), 2000);

    const minLoadMs = 900;
    const start = Date.now();

    try {
      if (!hostCode) {
        Alert.alert('Missing data', 'Host code not found. Please restart the event creation.');
        navigation.navigate('CreateEventScreen');
        return;
      }

      // 1️⃣ Create Stripe onboarding link
      const stripeData = await createStripeLink(hostCode);
      const url = stripeData?.url || stripeData?.onboarding_url;
      if (!url) throw new Error('Stripe link not available from server response');

      console.log('🌍 Opening Stripe URL directly:', url);
      await Linking.openURL(url);

      // 2️⃣ Navigate to success screen after onboarding
      navigation.replace('CreateEventSuccess', {
        hostCode,
        guestCode,
        eventName,
        fullName,
        email,
        message: guestMessage,
        hostImageUrl,
      });
    } catch (error) {
      console.error('❌ Stripe linking error (frontend):', error?.message || error);
      Alert.alert(
        'Error',
        'Something went wrong while setting up your event. Please try again.'
      );
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < minLoadMs) await sleep(minLoadMs - elapsed);
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
      setLoading(false);
    }
  };

  const missingRequired = !fullName || !email || !eventName;
  if (missingRequired) {
    return (
      <View
        style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}
      >
        <Text style={styles.title}>We need a few details first</Text>
        <Text style={styles.subtitle}>Please start from the Create Event flow.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CreateEventScreen')}
        >
          <Text style={styles.buttonText}>Go to Create Event</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Almost There!</Text>

      <Text style={styles.subtitle}>
        To receive donations, please link your bank account using Stripe.
      </Text>

      <Text style={styles.note}>
        Stripe will securely collect your details so we can send your funds. If this is a{' '}
        personal event, select{' '}
        <Text style={{ fontWeight: 'bold' }}>Individual/Sole Trader</Text> when asked.
        When you’ve finished, return to Trevi to continue.
      </Text>

      <Animatable.Image
        animation="pulse"
        iterationCount="infinite"
        easing="ease-in-out"
        duration={3000}
        source={require('../../Assets/Images/fairybike.png')}
        style={styles.image}
        resizeMode="contain"
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleConnectStripe}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Connect with Stripe</Text>
        )}
      </TouchableOpacity>

      {loading && (
        <View style={localStyles.overlay}>
          <ActivityIndicator size="large" />
          <Text style={localStyles.overlayText}>
            {slow ? 'Still working…' : 'Loading…'}
          </Text>
        </View>
      )}
    </View>
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
