import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import styles from './Style';
import { client } from '../../api/config';

export default function GiftReelPaymentScreen({ route, navigation }) {
  const { hostCode, host_code: hostCodeAlt } = route.params || {};
  const finalHostCode = hostCode || hostCodeAlt;
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    try {
      setLoading(true);
      console.log('💳 Starting Gift Reel payment for host:', finalHostCode);

      if (!finalHostCode) {
        Alert.alert('Error', 'Missing host code. Please go back and try again.');
        return;
      }

      console.log(
        '🌐 Sending POST to:',
        `${client.defaults.baseURL}/giftreel/pay`,
        'with:',
        { host_code: finalHostCode }
      );

      const response = await client.post('/giftreel/pay', { host_code: finalHostCode });
      console.log('✅ Payment intent response:', response.data);

      let data = response.data;
      if (typeof data === 'string') {
        try {
          const cleaned = data.trim().replace(/^<+/, '');
          data = JSON.parse(cleaned);
        } catch (e) {
          console.warn('⚠️ Could not parse backend JSON response', e);
        }
      }

      const clientSecret = data.client_secret;
      if (!clientSecret) throw new Error('No client_secret received from backend');

      const { error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        console.error('❌ Payment failed:', error.message);
        Alert.alert('Payment failed', error.message);
      } else {
        console.log('🎉 Payment successful!');
        Alert.alert('Success', 'Gift Reel ordered! 🎬');
        navigation.navigate('HostDashboard', { refresh: true });
      }
    } catch (err) {
      console.error('⚠️ GiftReel payment error:', err?.message || err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎬 Order Your Gift Reel</Text>
      <Text style={styles.price}>£4.99</Text>

      <CardField
        postalCodeEnabled={true}
        placeholders={{ number: '4242 4242 4242 4242' }}
        style={styles.card}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handlePay}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Processing...' : 'Pay £4.99'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

