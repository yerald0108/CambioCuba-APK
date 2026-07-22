import { View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

import { Colors, BorderRadius, Spacing } from '@constants/theme';

export function Skeleton({ height, width = '100%', radius = BorderRadius.md }: {
  height: number;
  width?: number | `${number}%`;
  radius?: number;
}) {
  const opacity = useSharedValue(0.35);
  opacity.value = withRepeat(withSequence(withTiming(0.75, { duration: 750 }), withTiming(0.35, { duration: 750 })), -1, true);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[{ height, width, borderRadius: radius, backgroundColor: Colors.surfaceRaised }, style]} />;
}

export function OfferListSkeleton() {
  return (
    <View style={{ padding: Spacing.screenPadding, gap: 12 }}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 14, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton height={28} width="38%" />
            <Skeleton height={28} width="22%" />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Skeleton height={58} width="50%" />
            <Skeleton height={58} width="50%" />
          </View>
          <Skeleton height={18} width="72%" />
        </View>
      ))}
    </View>
  );
}

export function OrderListSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, padding: Spacing.screenPadding, gap: 12 }}>
      <Skeleton height={26} width="45%" />
      {[0, 1, 2].map((item) => (
        <View key={item} style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 14, gap: 12 }}>
          <Skeleton height={20} width="46%" />
          <Skeleton height={28} width="65%" />
          <Skeleton height={16} width="35%" />
        </View>
      ))}
    </View>
  );
}
