// app.config.js - Configuração simplificada do Expo
module.exports = () => {
  // Importar o app.json como base
  const appJson = require('./app.json');
  
  // Filtrar e adicionar apenas as variáveis de ambiente EXPO_PUBLIC_ ao objeto extra
  const expoPublicEnvVars = Object.keys(process.env)
    .filter(key => key.startsWith('EXPO_PUBLIC_'))
    .reduce((env, key) => {
      env[key] = process.env[key];
      return env;
    }, {});

  appJson.expo.extra = {
    ...appJson.expo.extra,
    ...expoPublicEnvVars
  };
  
  // Adicionar configuração do EAS Update
  appJson.expo.updates = {
    ...appJson.expo.updates,
    url: "https://u.expo.dev/f78729b9-ea31-44cd-9b70-b222a534fde7"
  };
  
  // Definir uma versão de runtime específica
  appJson.expo.runtimeVersion = "1.0.0";
  
  // Adicionar plugins necessários
  appJson.expo.plugins = [
    ...(appJson.expo.plugins || []),
    "expo-font"
  ];
  
  // Ajustar o nome do app com base no ambiente
  if (process.env.EXPO_PUBLIC_ENVIRONMENT && process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production') {
    appJson.expo.name = `${appJson.expo.name} (${process.env.EXPO_PUBLIC_ENVIRONMENT.charAt(0).toUpperCase() + process.env.EXPO_PUBLIC_ENVIRONMENT.slice(1)})`;
  }
  
  return appJson;
};