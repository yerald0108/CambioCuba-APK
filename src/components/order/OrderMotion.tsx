import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Colors } from '@constants/theme';

export function OrderStatusTransition({ status, children }: { status: string; children: React.ReactNode }) {
  return (
    <Animated.View key={status} entering={FadeInDown.duration(280)}>
      {children}
    </Animated.View>
  );
}

function ConfettiParticle({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const direction = index % 2 === 0 ? 1 : -1;

  useEffect(() => {
    opacity.value = withDelay(index * 55, withTiming(1, { duration: 120 }, () => {
      opacity.value = withTiming(0, { duration: 900 });
    }));
    progress.value = withDelay(index * 55, withTiming(1, { duration: 1000 }));
  }, [index, opacity, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: direction * (35 + (index % 4) * 22) * progress.value },
      { translateY: -110 * progress.value + 190 * progress.value * progress.value },
      { rotate: `${direction * 300 * progress.value}deg` },
    ],
  }));

  return <Animated.View style={[{ position: 'absolute', width: 8, height: 12, borderRadius: 2, backgroundColor: index % 3 === 0 ? Colors.accent : index % 3 === 1 ? Colors.success : Colors.info }, style]} />;
}

/** Celebración visual local: no bloquea la calificación ni las acciones de la orden. */
export function OrderCelebration({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 132, left: '50%', width: 1, height: 1, zIndex: 20 }}>
      {Array.from({ length: 18 }, (_, index) => <ConfettiParticle key={index} index={index} />)}
    </View>
  );
}
