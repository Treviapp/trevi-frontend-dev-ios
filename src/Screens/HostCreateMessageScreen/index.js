import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Animatable from 'react-native-animatable';
import styles from './Style';
import { API_BASE_URL } from '../../api/config'; // ✅ fixed import

const HostCreateMessageScreen = ({ route, navigation }) => {
  const { fullName = '', email = '', eventName = '' } = route?.params ?? {};
  const [guestMessage, setGuestMessage] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0]);
      }
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Unable to open image picker.');
    }
  };

  const handleSubmit = async () => {
    console.log('🟢 handleSubmit called'); // ✅ added log

    if (!fullName || !email || !eventName) {
      Alert.alert('Missing info', 'Please start from the Create Event screen.');
      navigation.navigate('CreateEventScreen');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('creator_name', fullName);
      formData.append('creator_email', email);
      formData.append('name', eventName);
      if (guestMessage) formData.append('guest_message', guestMessage);

      if (image) {
        formData.append('host_image', {
          uri: image.uri,
          name: 'host_image.jpg',
          type: 'image/jpeg',
        });
      }

      console.log('📡 Sending event data to /api/campaigns...');
      const response = await fetch(`${API_BASE_URL}/campaigns`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      console.log('🧾 API response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      navigation.navigate('StripeLinkingScreen', {
        fullName,
        email,
        eventName,
        guestMessage,
        hostCode: data.host_code,
        guestCode: data.guest_code,
        hostImageUrl: data.host_image_url,
      });
    } catch (err) {
      console.error('❌ Error creating event:', err);
      Alert.alert('Error', 'Could not create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const aspectRatio =
    image?.width && image?.height ? image.width / image.height : 1;

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ paddingBottom: 10 }}
        >
          <Animatable.Image
            animation="pulse"
            iterationCount="infinite"
            easing="ease-in-out"
            source={require('../../Assets/Images/flyingfairyscroll.png')}
            style={localStyles.fairy}
            resizeMode="contain"
          />

          <Text style={styles.title}>Message for Guests</Text>

          <TextInput
            style={styles.inputMessage}
            placeholder="Write a short message for your guests..."
            value={guestMessage}
            onChangeText={setGuestMessage}
            multiline
          />

          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            <Text style={styles.photoButtonText}>
              {image ? 'Change Photo' : 'Add a Photo'}
            </Text>
          </TouchableOpacity>

          {image && (
            <View style={localStyles.previewWrapper}>
              <Image
                source={{ uri: image.uri }}
                style={[localStyles.preview, { aspectRatio }]}
                resizeMode="contain"
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Please wait…' : 'Create Event'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  fairy: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  previewWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  preview: {
    width: '100%',
    height: undefined,
    maxHeight: 250,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});

export default HostCreateMessageScreen;

