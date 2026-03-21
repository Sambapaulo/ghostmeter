// Capacitor config for mobile app - Hybrid mode (loads Vercel URL)
const config = {
  appId: 'app.ghostmeter.app',
  appName: 'GhostMeter',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    url: 'https://ghostmeter.vercel.app?v=1.2',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#a855f7',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#a855f7',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    Haptics: {
      selectionStartDuration: 30,
      selectionChangedDuration: 10,
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
};

export default config;
