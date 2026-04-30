import React, { useState } from 'react';
import { Alert } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';

export default function AddSeedScreen() {
  const [name, setName] = useState('');
  const [supplier, setSupplier] = useState('');

  return (
    <AppScreen>
      <AppText variant="h1">Add Seed</AppText>

      <AppCard>
        <AppTextInput
          label="Seed Name"
          value={name}
          onChangeText={setName}
          placeholder="Example: Cherokee Purple Tomato"
        />

        <AppTextInput
          label="Supplier"
          value={supplier}
          onChangeText={setSupplier}
          placeholder="Example: Baker Creek"
        />
      </AppCard>

      <AppButton
        label="Save Seed"
        onPress={() => Alert.alert('Saved', `${name} added.`)}
      />
    </AppScreen>
  );
}