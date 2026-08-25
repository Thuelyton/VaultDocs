/**
 * Alert Wrapper for Web compatibility
 * 
 * - Web: uses window.alert() as fallback
 * - Native: uses React Native's Alert
 */

import { Platform, Alert as NativeAlert, AlertStatic } from 'react-native';

// Web implementation using window.alert
const webAlert: AlertStatic = {
  alert: (title: string, message?: string, buttons?: any[]) => {
    // Combine title and message for window.alert
    const fullMessage = message ? `${title}\n\n${message}` : title;
    window.alert(fullMessage);
  },
  prompt: (...args: any[]) => {
    // window.prompt is synchronous, but RN Alert.prompt is not commonly used
    return 0;
  },
};

// Use native Alert on native platforms, webAlert on web
const Alert: AlertStatic = Platform.OS === 'web' ? webAlert : NativeAlert;

export default Alert;
