// src/navigation/AppStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../Screens/WelcomeScreen';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator initialRouteName="VideoIntro" screenOptions={{ headerShown: false }}>
      {/* Intro & Main */}
      <Stack.Screen name="VideoIntro" getComponent={() => require('../Screens/VideoIntroScreen').default} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />

      {/* Event Access & Creation */}
      <Stack.Screen name="AccessEvent" getComponent={() => require('../Screens/AccessEventScreen').default} />
      <Stack.Screen name="EnterEvent" getComponent={() => require('../Screens/EnterEventScreen').default} />
      <Stack.Screen name="CreateEvent" getComponent={() => require('../Screens/CreateEventScreen').default} />
      <Stack.Screen name="HostCreateMessage" getComponent={() => require('../Screens/HostCreateMessageScreen').default} />
      <Stack.Screen name="StripeLinkingScreen" getComponent={() => require('../Screens/StripeLinkingScreen').default} />
      <Stack.Screen name="CreateEventSuccess" getComponent={() => require('../Screens/CreateEventSuccessScreen').default} />

      {/* Host & Donor Flows */}
      <Stack.Screen name="HostDashboard" getComponent={() => require('../Screens/HostDashboardScreen').default} />
      <Stack.Screen name="EventSummaryScreen" getComponent={() => require('../Screens/EventSummaryScreen').default} />
      <Stack.Screen name="MakeDonation" getComponent={() => require('../Screens/MakeDonationScreen').default} />
      <Stack.Screen name="MakePaymentScreen" getComponent={() => require('../Screens/MakePaymentScreen').default} />
      <Stack.Screen name="DonationSuccess" getComponent={() => require('../Screens/DonationSuccessScreen').default} />
      <Stack.Screen name="GiftListScreen" getComponent={() => require('../Screens/GiftListScreen').default} />

      {/* Gift Reel Screens */}
      <Stack.Screen name="GiftReelInfoScreen" getComponent={() => require('../Screens/GiftReelInfoScreen').default} />
      <Stack.Screen name="GiftReelPaymentScreen" getComponent={() => require('../Screens/GiftReelPaymentScreen').default} />
    </Stack.Navigator>
  );
}
