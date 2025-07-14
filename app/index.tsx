import { useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme/colors';
import { globalStyles } from '../src/theme/styles';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={[globalStyles.container, globalStyles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return null;
}