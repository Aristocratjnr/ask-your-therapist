// app/video-call/[channelName].tsx - Simplified Agora implementation
import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

export default function JitsiVideoCallScreen() {
  const { channelName } = useLocalSearchParams<{ channelName: string }>();
  const router = useRouter();
  const [inCall, setInCall] = useState(false);

  // Jitsi Meet URL with the room name
  const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(channelName || 'default-room')}`;

  return (
    <SafeAreaView style={styles.container}>
      {!inCall ? (
        <View style={styles.joinContainer}>
          <Text style={styles.joinTitle}>Ready to Join the Video Call?</Text>
          <Text style={styles.joinSubtitle}>Tap below to join the session in-app.</Text>
          <TouchableOpacity style={styles.joinButton} onPress={() => setInCall(true)}>
            <Text style={styles.joinButtonText}>Join in Browser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.webviewContainer}>
            <WebView
              source={{ uri: jitsiUrl }}
              style={{ flex: 1 }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
            />
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.endButton} onPress={() => router.back()}>
              <Text style={styles.endButtonText}>End Call</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  joinContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#000',
  },
  joinTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  joinSubtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 28,
    marginBottom: 18,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  cancelButton: {
    marginTop: 8,
    padding: 10,
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
  },
  webviewContainer: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  endButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
