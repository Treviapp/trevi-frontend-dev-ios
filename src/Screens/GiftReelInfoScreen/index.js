import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styles from './Style';
import MakePaymentBackground from '../MakePaymentBackground';

export default function GiftReelInfoScreen({ navigation, route }) {
  const { hostCode } = route.params || {};

  const handleBuyNow = () => {
    navigation.navigate('GiftReelPaymentScreen', { hostCode });
  };

  return (
    <MakePaymentBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🎬 About the Gift Reel</Text>

        <Text style={styles.paragraph}>
          The Gift Reel is a short highlight film automatically created from all
          the photos and messages your guests send when they donate. Each gift
          adds a little clip, image, or message to your reel — and when your
          event ends, Trevi stitches everything together into one joyful memory
          you can download and keep forever.
        </Text>

        <Text style={styles.paragraph}>
          You’ll receive a private download link once your event closes.
          Please note that for privacy and storage reasons, Trevi deletes all
          images and video clips <Text style={styles.bold}>30 days after your event date</Text> — so be sure to
          save your Gift Reel before then.
        </Text>

        <Text style={styles.paragraph}>
          The Gift Reel costs just <Text style={styles.bold}>£4.99</Text> — a
          one-time fee that helps support hosting, storage, and editing costs.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleBuyNow}>
          <Text style={styles.buttonText}>Buy Now £4.99</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </MakePaymentBackground>
  );
}
