import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import styles from './Style';
import AccessEventBackground from '../AccessEventBackground';
import { client } from '../../api/config';

export default function AccessEventScreen({ navigation }) {
  const [hostCode, setHostCode] = useState('');

  const handleAccess = async () => {
    if (!hostCode.trim()) {
      Alert.alert('Validation', 'Please enter your host code.');
      return;
    }

    try {
      const response = await client.get(`/campaigns/host/${hostCode.trim()}`);
      if (response.data) {
        console.log('✅ Host code valid, navigating to dashboard');
        navigation.navigate('HostDashboard', { hostCode });
      } else {
        Alert.alert('Error', 'Campaign not found.');
      }
    } catch (error) {
      console.error('❌ Error validating host code:', error.message);
      Alert.alert('Error', 'Campaign not found.');
    }
  };

  const handleGoHome = () => {
    navigation.navigate('Welcome');
  };

  return (
    <AccessEventBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.imageContainer}>
            <Image
              source={require('../../Assets/Images/lockandkey.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Access Your Event</Text>

          <TextInput
            style={styles.input}
            placeholder="Host Code"
            value={hostCode}
            onChangeText={setHostCode}
            autoCapitalize="characters"
          />

          <TouchableOpacity style={styles.button} onPress={handleAccess}>
            <Text style={styles.buttonText}>Access Event</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </AccessEventBackground>
  );
}
