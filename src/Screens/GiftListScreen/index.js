import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import styles from './Style';
import GiftListBackground from '../GiftListBackground';
import { client } from '../../api/config';

export default function GiftListScreen({ route, navigation }) {
  const hostCode = route?.params?.hostCode || '';
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const mounted = useRef(true);
  const slowTimerRef = useRef(null);
  const giftsRef = useRef(gifts);

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
    giftsRef.current = gifts;
  }, [gifts]);

  useEffect(() => {
    if (hostCode) {
      loadInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostCode]);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const dedupeGifts = (rawGifts = []) => {
    const seen = new Set();
    return rawGifts.filter((gift) => {
      const key =
        gift.payment_intent_id ||
        `${gift.message}-${gift.amount}-${gift.created_at}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const loadInitial = async () => {
    setLoading(true);
    setSlow(false);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => setSlow(true), 2000);

    const minLoadMs = 900;
    const start = Date.now();

    try {
      const res = await client.get(`/campaigns/host/${hostCode}`, { timeout: 15000 });
      const uniqueGifts = dedupeGifts(res.data?.donations || []);
      if (!mounted.current) return;

      // ✅ Add photo_url for display
      const giftsWithImages = uniqueGifts.map((gift) => ({
        ...gift,
        photo_url: gift.photo_path
          ? `http://192.168.1.62:8000/storage/${gift.photo_path.replace(/^public\//, '')}`
          : null,
      }));

      setGifts(giftsWithImages);
    } catch (err) {
      console.error(err);
      if (!mounted.current) return;
      Alert.alert('Error', 'Unable to fetch gifts right now. Please try again.');
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < minLoadMs) await sleep(minLoadMs - elapsed);
      if (!mounted.current) return;
      setLoading(false);
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
      startInitialSync();
    }
  };

  const startInitialSync = async () => {
    setSyncing(true);
    const backoffs = [1200, 1700, 2500, 3500, 5000]; // ~14–16s total
    const t0 = Date.now();
    const MAX_MS = 20000;

    let i = 0;
    while (mounted.current && Date.now() - t0 < MAX_MS) {
      const delay = backoffs[Math.min(i, backoffs.length - 1)] + Math.floor(Math.random() * 300);
      await sleep(delay);
      if (!mounted.current) break;

      try {
        const res = await client.get(`/campaigns/host/${hostCode}`, { timeout: 12000 });
        const uniqueGifts = dedupeGifts(res.data?.donations || []);
        if (!mounted.current) break;

        const giftsWithImages = uniqueGifts.map((gift) => ({
          ...gift,
          photo_url: gift.photo_path
            ? `http://192.168.1.62:8000/storage/${gift.photo_path.replace(/^public\//, '')}`
            : null,
        }));

        if (giftsWithImages.length !== giftsRef.current.length) {
          setGifts(giftsWithImages);
          break; // stop once we detect a change
        }
      } catch (_e) {
        // ignore transient sync errors
      }
      i++;
    }
    if (mounted.current) setSyncing(false);
  };

  const handleGoHome = () => navigation.navigate('Welcome');

  return (
    <GiftListBackground>
      <ScrollView contentContainerStyle={[styles.container, localStyles.content]}>
        <Text style={styles.title}>My Gifts</Text>

        {loading ? (
          <View style={localStyles.center}>
            <ActivityIndicator size="large" color="#8e94f2" />
            <Text style={localStyles.loadingText}>{slow ? 'Still working…' : 'Loading…'}</Text>
          </View>
        ) : gifts.length === 0 ? (
          <>
            {syncing && (
              <View style={localStyles.syncRow}>
                <ActivityIndicator size="small" />
                <Text style={localStyles.syncText}>Checking for new gifts…</Text>
              </View>
            )}
            <Text style={styles.emptyText}>No gifts received yet.</Text>
          </>
        ) : (
          <>
            {syncing && (
              <View style={localStyles.syncRow}>
                <ActivityIndicator size="small" />
                <Text style={localStyles.syncText}>Updating…</Text>
              </View>
            )}
            {gifts.map((gift, index) => (
              <View key={index} style={styles.giftCard}>
                {gift.photo_url && (
                  <Image
                    source={{ uri: gift.photo_url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.name}>
                  {gift.name?.trim() ? gift.name : 'Anonymous'}
                </Text>
                <Text style={styles.message}>
                  {gift.message || '(No message)'}
                </Text>
                <Text style={styles.amount}>
                  £{((gift.net_payout || 0) / 100).toFixed(2)}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Bottom Home button (same style as Host Dashboard) */}
        <TouchableOpacity style={[styles.homeButton, { marginTop: 16 }]} onPress={handleGoHome}>
          <Text style={styles.homeButtonText}>Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </GiftListBackground>
  );
}

const localStyles = StyleSheet.create({
  content: {
    paddingBottom: 20,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  syncText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

