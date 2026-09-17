import { Tabs } from 'expo-router/js-tabs';

import { Icon } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: { backgroundColor: '#000', borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '700' },
      }}>
      <Tabs.Screen
        name="feed"
        options={{ title: 'Feed', tabBarIcon: ({ color }) => <Icon name="feed" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="vault"
        options={{ title: 'Vault', tabBarIcon: ({ color }) => <Icon name="vault" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="me"
        options={{ title: 'Me', tabBarIcon: ({ color }) => <Icon name="me" size={22} color={color} /> }}
      />
    </Tabs>
  );
}
