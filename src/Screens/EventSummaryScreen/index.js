import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { client } from '../../api/config';
import styles from './Style';
import EventSummaryBackground from '../EventSummaryBackground';

export default function EventSummaryScreen({ route, navigation }) {
  // ✅ handle both guestCode and code params
  const guestCodeParam = route?.params?.guestCode || route?.params?.code || '';
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [campaign, setCampaign] = useState(null);

  const slowTimerRef = useRef(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (guestCodeParam) {
      loadCampaign();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestCodeParam]);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const isRetriable = (err) => {
    const status = err?.response?.status;
    return err?.code === 'ECONNABORTED' || !status || status >= 500;
  };

  const loadCampaign = async () => {
    setLoading(true);
    setSlow(false);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => setSlow(true), 2000);

    const minLoadMs = 900;
    const start = Date.now();
    const code = guestCodeParam.trim().toUpperCase();

    try {
      let res;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          res = await client.get(`/campaigns/guest/${code}`, { timeout: 15000 });
          break; // success
        } catch (err) {
          if (attempt === 0 && isRetriable(err)) {
            await sleep(700); // small backoff
            continue;
          }
          throw err;
        }
      }

      if (!mounted.current) return;
      setCampaign(res.data);
    } catch (err) {
      if (!mounted.current) return;
      console.error('❌ EventSummary error:', err?.message || err);
      Alert.alert(
        'Error',
        err?.response?.status === 404
          ? 'Event not found. Please check your code.'
          : 'Could not load event. Please try again.'
      );
      setCampaign(null);
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < minLoadMs) await sleep(minLoadMs - elapsed);

      if (!mounted.current) return;
      setLoading(false);
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
    }
  };

  if (loading) {
    return (
      <EventSummaryBackground>
        <View style={localStyles.center}>
          <ActivityIndicator size="large" />
          <Text style={localStyles.loadingText}>
            {slow ? 'Still working…' : 'Loading…'}
          </Text>
        </View>
      </EventSummaryBackground>
    );
  }

  if (!campaign) {
    return (
      <EventSummaryBackground>
        <Text style={styles.error}>Event not found.</Text>
      </EventSummaryBackground>
    );
  }

  return (
    <EventSummaryBackground>
      <Text style={styles.handwritingTitle}>Welcome to {campaign.title}</Text>
      <Text style={styles.subtitle}>Hosted by {campaign.host}</Text>

      {(campaign.host_image_url || campaign.host_image) && (
        <Image
          source={{
            uri: campaign.host_image_url || campaign.host_image,
          }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <Text style={styles.message}>
        {campaign.guest_message || 'Welcome and thank you for celebrating with me!'}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate('MakeDonation', {
            guestCode: guestCodeParam,
            hostCode: campaign.host_code,
          })
        }
      >
        <Text style={styles.buttonText}>Click to Send a Gift</Text>
      </TouchableOpacity>
    </EventSummaryBackground>
  );
}

const localStyles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
});


