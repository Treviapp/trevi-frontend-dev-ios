import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import styles from './Style';
import CreateEventSuccessBackground from '../CreateEventSuccessBackground';
import axios from 'axios';
import { API_URL } from '../../api/config';

export default function CreateEventSuccessScreen({ route, navigation }) {
  const {
    // camelCase (from in-app navigation)
    hostCode,
    guestCode,
    eventName,
    fullName,
    email,
    message,
    photo,
    // snake_case (from deep link)
    host_code,
    guest_code,
    status,
  } = route?.params || {};

  // Prefer camelCase if present; otherwise fall back to snake_case
  const finalHostCode = hostCode ?? host_code ?? '';
  const finalGuestCode = guestCode ?? guest_code ?? '';

  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);
  const slowTimerRef = useRef(null);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const handleContinue = async () => {
    if (!finalHostCode) {
      // still let them in, but with empty codes
      navigation.navigate('HostDashboard', {
        campaign: {
          host_code: '',
          guest_code: '',
          title: eventName,
          host: fullName,
          status,
          donations: [],
        },
      });
      return;
    }

    setSubmitting(true);
    setSlow(false);
    slowTimerRef.current = setTimeout(() => setSlow(true), 2000);

    const start = Date.now();
    try {
      // prewarm request (optional, safe if it fails)
      await axios.get(`${API_URL}/api/campaigns/${finalHostCode}`, {
        timeout: 12000,
      });
    } catch (_e) {
      // ignore errors here
    } finally {
      const elapsed = Date.now() - start;
      const minLoadMs = 900;
      if (elapsed < minLoadMs) await sleep(minLoadMs - elapsed);

      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }

      setSubmitting(false);

      navigation.navigate('HostDashboard', {
        campaign: {
          host_code: finalHostCode,
          guest_code: finalGuestCode,
          title: eventName,
          host: fullName,
          status,
          donations: [],
        },
      });
    }
  };

  return (
    <CreateEventSuccessBackground>
      <View style={[styles.container, localStyles.contentContainer]}>
        <Text style={styles.title}>Event Created</Text>

        <Text style={styles.label}>Host Code</Text>
        <Text style={styles.code}>{finalHostCode || '—'}</Text>

        <Text style={styles.label}>Guest Code</Text>
        <Text style={styles.code}>{finalGuestCode || '—'}</Text>

        <Text style={styles.emailNotice}>
          ✅ please make a note of these codes - i.e. take a screenshot.
        </Text>

        <Text style={styles.note}>
          Share the guest code with your friends so they can donate to your big
          event.
        </Text>

        <TouchableOpacity
          style={[styles.button, submitting && { opacity: 0.6 }]}
          onPress={handleContinue}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? 'Preparing your dashboard…' : 'Continue to Dashboard'}
          </Text>
        </TouchableOpacity>

        <Image
          source={require('../../Assets/Images/fountain.png')}
          style={localStyles.fountain}
          resizeMode="contain"
        />
      </View>

      {submitting && (
        <View style={localStyles.overlay}>
          <ActivityIndicator size="large" />
          <Text style={localStyles.overlayText}>
            {slow ? 'Still working…' : 'Loading…'}
          </Text>
        </View>
      )}
    </CreateEventSuccessBackground>
  );
}

const localStyles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 220,
  },
  fountain: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 200,
    height: 200,
    opacity: 0.95,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  overlayText: {
    marginTop: 10,
    fontSize: 16,
  },
});
