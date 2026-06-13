import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider, useStore } from './src/store';
import { C } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import FriendDetailScreen from './src/screens/FriendDetailScreen';
import EditFriendScreen from './src/screens/EditFriendScreen';
import SurveyScreen from './src/screens/SurveyScreen';
import LogScreen from './src/screens/LogScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: C.bg, card: C.bg, text: C.text, border: C.border, primary: C.accent,
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: C.bg },
  headerTintColor: C.text,
  headerTitleStyle: { color: C.text },
  contentStyle: { backgroundColor: C.bg },
};

function Root() {
  const { user } = useStore();

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
            <Stack.Screen name="Survey" component={SurveyScreen} options={{ title: '友誼評測' }} />
            <Stack.Screen name="Log" component={LogScreen} options={{ title: '' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
