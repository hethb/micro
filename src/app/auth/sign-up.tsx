import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { signUp } from '@/account/accountStore';
import { MIN_PASSWORD_LENGTH, looksLikeEmail } from '@/account/validation';
import { Button } from '@/components/ui/Button';
import { FormScreen } from '@/components/ui/FormScreen';
import { TextField } from '@/components/ui/TextField';
import { colors, type } from '@/theme/tokens';


export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmFor, setConfirmFor] = useState<string | null>(null);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const valid = trimmedName.length > 0 && looksLikeEmail(trimmedEmail) && password.length >= MIN_PASSWORD_LENGTH;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUp({ name: trimmedName, email: trimmedEmail, password });
      // Without confirmation the new session takes over routing; nothing else to do here.
      if (needsConfirmation) setConfirmFor(trimmedEmail);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (confirmFor) {
    return (
      <FormScreen
        title="Check your email 📬"
        subtitle={`We sent a confirmation link to ${confirmFor}. Tap it, then log in to set up your feed.`}
        footer={<Button label="Go to log in" onPress={() => router.replace('/auth/log-in')} />}>
        {null}
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Create your profile"
      subtitle="Your topics, likes, saves and mind map are saved to your account."
      onBack={() => router.back()}
      footer={
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Create profile" onPress={submit} disabled={!valid} loading={busy} />
        </>
      }>
      <TextField
        label="NAME"
        value={name}
        onChangeText={setName}
        placeholder="What should we call you?"
        autoComplete="name"
        textContentType="name"
        maxLength={40}
        returnKeyType="next"
      />
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
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={() => valid && !busy && void submit()}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  error: { ...type.small, color: colors.like, textAlign: 'center' },
});
