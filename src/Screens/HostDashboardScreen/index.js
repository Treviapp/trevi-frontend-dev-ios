import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import styles from './Style';
import HostDashboardBackground from '../HostDashboardBackground';
import { client } from '../../api/config';
import { useNavigation } from '@react-navigation/native';

const FRONTEND_BASE = 'https://trevi.app/enter/';

export default function HostDashboardScreen({ route, navigation }) {
  const initialCode = route?.params?.hostCode || '';
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const navigationHook = useNavigation();

  const mounted = useRef(true);
  const slowTimerRef = useRef(null);
  const donationsRef = useRef(donations);

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
    donationsRef.current = donations;
  }, [donations]);

  useEffect(() => {
    if (initialCode) handleLoadDashboard();
    if (route?.params?.refresh) handleLoadDashboard();
  }, [initialCode, route?.params?.refresh]);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const isRetriable = (err) => {
    const status = err?.response?.status;
    return err?.code === 'ECONNABORTED' || !status || status >= 500;
  };

  const dedupe = (raw = []) => {
    const seen = new Set();
    return raw.filter((gift) => {
      const key =
        gift.payment_intent_id ||
        `${gift.message}-${gift.amount}-${gift.created_at}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const handleLoadDashboard = async () => {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) {
      Alert.alert('Please enter your host code');
      return;
    }

    setLoading(true);
    setSlow(false);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => setSlow(true), 2000);

    const minLoadMs = 900;
    const start = Date.now();

    try {
      let res;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          res = await client.get(`/campaigns/host/${trimmed}`, { timeout: 15000 });
          break;
        } catch (err) {
          if (attempt === 0 && isRetriable(err)) {
            await sleep(700);
            continue;
          }
          throw err;
        }
      }

      if (!mounted.current) return;
      const data = res.data;
      console.log('🧾 API response from /campaigns/host:', data);

      setCampaign({
        ...data,
        host_code: data.host_code || trimmed || initialCode,
      });

      setDonations(dedupe(data.donations || []));
    } catch (err) {
      if (!mounted.current) return;
      const status = err?.response?.status;
      if (status === 404) {
        Alert.alert('Campaign not found');
      } else if (err?.message === 'Network Error' || err?.code === 'ECONNABORTED') {
        Alert.alert('Network error', 'Check your connection');
      } else {
        console.error('❌ Dashboard load error:', err?.message, err?.response?.data);
        Alert.alert('Unexpected error', err?.message || 'Check Metro logs for details');
      }
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < minLoadMs) await sleep(minLoadMs - elapsed);

      if (!mounted.current) return;
      setLoading(false);
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
      if (trimmed) startInitialSync(trimmed);
    }
  };

  const startInitialSync = async (trimmed) => {
    setSyncing(true);
    const backoffs = [1200, 1700, 2500, 3500, 5000];
    const t0 = Date.now();
    const MAX_MS = 20000;

    let i = 0;
    while (mounted.current && Date.now() - t0 < MAX_MS) {
      const delay = backoffs[Math.min(i, backoffs.length - 1)] + Math.floor(Math.random() * 300);
      await sleep(delay);
      if (!mounted.current) break;

      try {
        const res = await client.get(`/campaigns/host/${trimmed}`, { timeout: 12000 });
        if (!mounted.current) break;
        const unique = dedupe(res.data?.donations || []);
        if (unique.length !== donationsRef.current.length) {
          setDonations(unique);
          break;
        }
      } catch (_e) {}
      i++;
    }
    if (mounted.current) setSyncing(false);
  };

  const getTotalRaised = () =>
    donations.reduce((sum, d) => sum + (d.net_payout || 0), 0);

  const handleViewGifts = () => {
    if (!campaign?.host_code) {
      Alert.alert('Missing host code', 'Please reload your dashboard.');
      return;
    }
    navigation.navigate('GiftListScreen', { hostCode: campaign.host_code });
  };

  const handleGoHome = () => {
    navigation.navigate('Welcome');
  };

  return (
    <HostDashboardBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {!campaign && !initialCode ? (
            <>
              <Text style={styles.label}>Enter Your Host Code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. HOST123"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.6 }]}
                onPress={handleLoadDashboard}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.buttonText}>View Dashboard</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.homeButton} onPress={handleGoHome} disabled={loading}>
                <Text style={styles.homeButtonText}>Home</Text>
              </TouchableOpacity>

              {loading && (
                <View style={localStyles.overlay}>
                  <ActivityIndicator size="large" />
                  <Text style={localStyles.overlayText}>{slow ? 'Still working…' : 'Loading…'}</Text>
                </View>
              )}
            </>
          ) : campaign ? (
            <>
              <View style={{ paddingBottom: 20 }}>
                <Text style={styles.handwritingTitle}>{campaign.title}</Text>
                <Text style={styles.subHeader}>Hosted by {campaign.host}</Text>

                <Text style={styles.totalRaised}>
                  Total Raised: £{(getTotalRaised() / 100).toFixed(2)}
                </Text>

                {syncing && (
                  <View style={localStyles.syncRow}>
                    <ActivityIndicator size="small" />
                    <Text style={localStyles.syncText}>Updating…</Text>
                  </View>
                )}

                <View style={{ alignItems: 'center', marginVertical: 5 }}>
                  <Text style={styles.qrLabel}>Your Event QR code</Text>
                  <QRCode value={`${FRONTEND_BASE}${campaign.guest_code}`} size={180} />
                  <Text style={styles.qrText}>
                    Share this QR code with guests & donors to allow instant access to your event
                  </Text>
                </View>
              </View>

              {/* Button group */}
              <View style={{ alignItems: 'center', marginBottom: 25 }}>
                <TouchableOpacity style={styles.viewGiftsButton} onPress={handleViewGifts}>
                  <Text style={styles.viewGiftsButtonText}>View My Gifts</Text>
                </TouchableOpacity>

                {campaign.reel_ready ? (
                  <TouchableOpacity
                    style={[styles.viewGiftsButton, { marginTop: 12 }]}
                    onPress={() =>
                      navigation.navigate('GiftReelScreen', { hostCode: campaign.host_code })
                    }
                  >
                    <Text style={styles.viewGiftsButtonText}>▶️ View My Gift Reel</Text>
                  </TouchableOpacity>
                ) : campaign.paid_reel ? (
                  <TouchableOpacity
                    style={[
                      styles.viewGiftsButton,
                      {
                        marginTop: 12,
                        backgroundColor: '#aaa',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 220,
                        height: 50,
                        borderRadius: 12,
                      },
                    ]}
                    disabled
                  >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={[styles.viewGiftsButtonText, { textAlign: 'center' }]}>
                        🎞️ Gift Reel Ordered
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.viewGiftsButton, { marginTop: 12, backgroundColor: '#f7941d' }]}
                    onPress={() =>
                      navigation.navigate('GiftReelInfoScreen', { hostCode: campaign.host_code })
                    }
                  >
                    <Text style={styles.viewGiftsButtonText}>🎬 Gift Reel</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
                <Text style={styles.homeButtonText}>Home</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ marginTop: 50, alignItems: 'center' }}>
              <ActivityIndicator />
              {loading && (
                <Text style={{ marginTop: 8 }}>{slow ? 'Still working…' : 'Loading…'}</Text>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </HostDashboardBackground>
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


