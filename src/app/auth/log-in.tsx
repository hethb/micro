import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { signIn } from '@/account/accountStore';
import { looksLikeEmail } from '@/account/validation';
import { Button } from '@/components/ui/Button';
import { FormScreen } from '@/components/ui/FormScreen';
import { TextField } from '@/components/ui/TextField';
import { colors, type } from '@/theme/tokens';


export default function LogInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedEmail = email.trim();
  const valid = looksLikeEmail(trimmedEmail) && password.length > 0;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn({ email: trimmedEmail, password });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  };

  return (
    <FormScreen
      title="Welcome back"
      subtitle="Log in to pick up your feed and mind map where you left off."
      onBack={() => router.back()}
      footer={
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Log in" onPress={submit} disabled={!valid} loading={busy} />
        </>
      }>
      <TextField
        label="EMAIL"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <TextField
        label="PASSWORD"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={() => valid && !busy && void submit()}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  error: { ...type.small, color: colors.like, textAlign: 'center' },
});
