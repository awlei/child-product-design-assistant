import { Capacitor } from '@capacitor/core';

/**
 * 检测应用是否在Capacitor原生环境中运行（APK/IPA）
 * @returns true表示在APK/IPA中，false表示在Web浏览器中
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * 获取当前运行平台
 * @returns 'android' | 'ios' | 'web'
 */
export const getPlatform = (): 'android' | 'ios' | 'web' => {
  return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
};

/**
 * 检测是否在Android APK中
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * 检测是否在iOS IPA中
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};
