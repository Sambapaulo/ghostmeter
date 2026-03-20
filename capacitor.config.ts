// Capacitor config for mobile app - Hybrid mode (loads Vercel URL)
const config = {
  appId: 'app.ghostmeter.app',
  appName: 'GhostMeter',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    url: 'https://ghostmeter.vercel.app',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#a855f7',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#a855f7',
    },
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
