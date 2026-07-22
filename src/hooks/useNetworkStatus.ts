import { useEffect } from 'react';
import * as Network from 'expo-network';
import { onlineManager } from '@tanstack/react-query';

/** Mantiene React Query sincronizado con la conectividad del dispositivo. */
export function useNetworkStatus() {
  const network = Network.useNetworkState();
  const isOnline = network.isConnected !== false && network.isInternetReachable !== false;

  useEffect(() => {
    onlineManager.setOnline(isOnline);
  }, [isOnline]);

  return { isOnline };
}
