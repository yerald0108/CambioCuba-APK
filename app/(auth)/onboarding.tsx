import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ArrowRightLeft, MessageCircle, ShieldCheck } from 'lucide-react-native';

import { completeOnboarding } from '@lib/onboarding';
import { Colors, Spacing } from '@constants/theme';
import { Button } from '@components/ui/Button';

const SLIDES = [
  {
    icon: ArrowRightLeft,
    title: 'Intercambia con personas reales',
    description: 'Explora ofertas de CUP y USDT. CambioCuba conecta a ambas partes, sin custodiar tu dinero.',
  },
  {
    icon: ShieldCheck,
    title: 'Opera con confianza',
    description: 'La verificación de identidad y la reputación te ayudan a tomar decisiones más seguras.',
  },
  {
    icon: MessageCircle,
    title: 'Todo queda claro en la orden',
    description: 'Confirma, conversa, adjunta tu comprobante y sigue cada paso del intercambio en tiempo real.',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  async function finish() {
    await completeOnboarding();
    router.replace('/(auth)/login');
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, padding: Spacing.screenPadding, paddingTop: 64 }}>
      <Pressable onPress={finish} hitSlop={12} style={{ alignSelf: 'flex-end', padding: 8 }}>
        <Text style={{ color: Colors.textSecondary, fontSize: 14, fontWeight: '600' }}>Saltar</Text>
      </Pressable>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 28 }}>
        <View style={{ width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.accentMuted, borderWidth: 1, borderColor: Colors.accent }}>
          <Icon color={Colors.accent} size={48} strokeWidth={1.6} />
        </View>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Text style={{ color: Colors.textPrimary, fontSize: 28, lineHeight: 34, fontWeight: '800', textAlign: 'center' }}>{slide.title}</Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 330 }}>{slide.description}</Text>
        </View>
      </View>

      <View style={{ gap: 20, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {SLIDES.map((item, index) => (
            <View key={item.title} style={{ height: 7, width: index === step ? 26 : 7, borderRadius: 99, backgroundColor: index === step ? Colors.accent : Colors.borderStrong }} />
          ))}
        </View>
        <Button label={isLast ? 'Empezar' : 'Continuar'} onPress={() => isLast ? finish() : setStep((current) => current + 1)} size="lg" />
      </View>
    </View>
  );
}
