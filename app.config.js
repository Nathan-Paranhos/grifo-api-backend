const baseConfig = {
  "expo": {
    "name": "Grifo Vistorias",
    "slug": "grifo-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "grifo-vistorias",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/images/icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "plugins": [
      "expo-router",
      "expo-camera",
      "expo-file-system",
      "expo-image-picker",
      "expo-secure-store",
      "expo-splash-screen",
      "expo-system-ui"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.grifovistorias.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Este aplicativo precisa de acesso à câmera para tirar fotos durante as vistorias.",
        "NSPhotoLibraryUsageDescription": "Este aplicativo precisa de acesso à galeria para selecionar fotos para as vistorias.",
        "NSPhotoLibraryAddUsageDescription": "Este aplicativo precisa de acesso para salvar fotos na galeria.",
        "NSLocationWhenInUseUsageDescription": "Este aplicativo precisa de acesso à sua localização para registrar onde as vistorias foram realizadas."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon.png",
        "backgroundColor": "#000000"
      },
      "package": "com.grifovistorias.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "server",
      "favicon": "./assets/images/favicon.png"
    },
    "experiments": {
      "typedRoutes": true
    },
    "updates": {
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/grifo-vistorias-project-id"
    },
    "runtimeVersion": "1.0.0",
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "f78729b9-ea31-44cd-9b70-b222a534fde7"
      }
    }
  }
};

module.exports = () => {
  const config = baseConfig;

  const expoPublicEnvVars = Object.keys(process.env)
    .filter(key => key.startsWith('EXPO_PUBLIC_'))
    .reduce((env, key) => {
      env[key] = process.env[key];
      return env;
    }, {});

  config.expo.extra = {
    ...config.expo.extra,
    ...expoPublicEnvVars
  };
  
  config.expo.updates = {
    ...config.expo.updates,
    url: "https://u.expo.dev/f78729b9-ea31-44cd-9b70-b222a534fde7"
  };
  
  config.expo.runtimeVersion = "1.0.0";
  
  config.expo.plugins = [
    ...(config.expo.plugins || []),
    "expo-font"
  ];
  
  if (process.env.EXPO_PUBLIC_ENVIRONMENT && process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production') {
    config.expo.name = `${config.expo.name} (${process.env.EXPO_PUBLIC_ENVIRONMENT.charAt(0).toUpperCase() + process.env.EXPO_PUBLIC_ENVIRONMENT.slice(1)})`;
  }
  
  return config;
};