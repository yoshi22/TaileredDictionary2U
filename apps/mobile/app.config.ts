import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TD2U',
  slug: 'td2u',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#3B82F6',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.td2u.app',
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#3B82F6',
    },
    package: 'com.td2u.app',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-auth-session',
      {
        scheme: 'td2u',
      },
    ],
  ],
  scheme: 'td2u',
  extra: {
    eas: {
      projectId: 'your-project-id', // Replace after running `eas init`
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    revenuecatApiKeyIos: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
    revenuecatApiKeyAndroid: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
  },
  experiments: {
    typedRoutes: true,
  },
})
