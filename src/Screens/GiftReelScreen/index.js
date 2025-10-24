import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import styles from './Style';
import axios from '../../api/config';

export default function GiftReelScreen({ route, navigation }) {
  const { hostCode } = route.params;
  const [loading, setLoading] = useState(true);
  const [reelUrl, setReelUrl] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`/giftreel/status/${hostCode}`);
        if (response.data.reel_ready && response.data.reel_url) {
          setReelUrl(response.data.reel_url);
        }
      } catch (err) {
        console.error('Error fetching reel status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [hostCode]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Loading your Gift Reel...</Text>
      </View>
    );
  }

  if (!reelUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>🎞️ Your Gift Reel isn’t ready yet!</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎬 Your Gift Reel is Ready!</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => Linking.openURL(reelUrl)}
      >
        <Text style={styles.buttonText}>▶️ Watch Now</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}
