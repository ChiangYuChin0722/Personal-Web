import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider, useStore } from './src/store';
import { UIProvider, useUI } from './src/ui';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import FriendDetailScreen from './src/screens/FriendDetailScreen';
import EditFriendScreen from './src/screens/EditFriendScreen';
import SurveyScreen from './src/screens/SurveyScreen';
import LogScreen from './src/screens/LogScreen';

const Stack = createNativeStackNavigator();

function Root() {
  const { user } = useStore();
  const { C, dark, t } = useUI();

  const navTheme = {
    ...DefaultTheme,
    dark,
    colors: { ...DefaultTheme.colors, background: C.bg, card: C.bg, text: C.text, border: C.border, primary: C.accent },
  };
  const screenOptions = {
    headerStyle: { backgroundColor: C.bg },
    headerTintColor: C.text,
    headerTitleStyle: { color: C.text },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: C.bg },
  };

  if (user === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={screenOptions}>
        {user ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="FriendDetail" component={FriendDetailScreen} options={{ title: '' }} />
            <Stack.Screen name="EditFriend" component={EditFriendScreen} options={{ title: '' }} />
            <Stack.Screen name="Survey" component={SurveyScreen} options={{ title: t('友誼評測', 'Friendship Survey') }} />
            <Stack.Screen name="Log" component={LogScreen} options={{ title: '' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function Themed() {
  const { dark } = useUI();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <StoreProvider>
        <Root />
      </StoreProvider>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UIProvider>
        <Themed />
      </UIProvider>
    </SafeAreaProvider>
  );
}
