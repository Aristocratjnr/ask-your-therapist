// lib/agora-video-service.ts
import AgoraUIKit from 'agora-rn-uikit';
import { AGORA_CONFIG } from './agora-config';

// Define interfaces based on Agora UIKit structure
interface ConnectionData {
  appId: string;
  channel: string;
  token?: string | null;
}

interface CallbacksInterface {
  EndCall?: () => void;
  [key: string]: any;
}

export class AgoraVideoService {
  private static instance: AgoraVideoService;
  private connectionData: ConnectionData | null = null;

  static getInstance(): AgoraVideoService {
    if (!AgoraVideoService.instance) {
      AgoraVideoService.instance = new AgoraVideoService();
    }
    return AgoraVideoService.instance;
  }

  createConnectionData(channelName: string): ConnectionData {
    this.connectionData = {
      appId: AGORA_CONFIG.appId,
      channel: channelName,
      token: AGORA_CONFIG.token, // null for testing
    };
    return this.connectionData;
  }

  getCallbacks(onEndCall: () => void): CallbacksInterface {
    return {
      EndCall: () => {
        console.log('Call ended');
        onEndCall();
      },
    };
  }
}