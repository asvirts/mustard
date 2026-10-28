import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewProps,
} from 'react-native';

import { COLORS } from '@/constants/mustard-data';

const MotionContext = createContext(true);
const useNativeDriver = Platform.OS !== 'web';

/** Share a single accessibility subscription across every interactive control. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      changed = true;
      setReduceMotion(value);
    });
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active && !changed) setReduceMotion(value);
      })
      .catch(() => {});
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return <MotionContext.Provider value={reduceMotion}>{children}</MotionContext.Provider>;
}

export function useReducedMotion() {
  return useContext(MotionContext);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type MotionPressableProps = PressableProps & {
  feedback?: 'light' | 'success' | false;
  pop?: boolean;
};

export function MotionPressable({
  feedback = false,
  pop = false,
  onPress,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  style,
  disabled,
  ...props
}: MotionPressableProps) {
  const reduceMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (reduceMotion || disabled) {
      scale.stopAnimation();
      scale.setValue(1);
    }
  }, [disabled, reduceMotion, scale]);
  useEffect(() => () => scale.stopAnimation(), [scale]);

  const springTo = (value: number) => {
    scale.stopAnimation();
    Animated.spring(scale, {
      toValue: value,
      speed: 28,
      bounciness: 7,
      useNativeDriver,
    }).start();
  };

  // Animated needs the value in a concrete style object to attach the native driver.
  const original = typeof style === 'function' ? style({ pressed, hovered }) : style;
  const sourceTransform = StyleSheet.flatten(original)?.transform;
  const transform = typeof sourceTransform === 'string'
    ? sourceTransform
    : [...(sourceTransform ?? []), { scale }];

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onHoverIn={(event) => {
        if (typeof style === 'function') setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        if (typeof style === 'function') setHovered(false);
        onHoverOut?.(event);
      }}
      onPressIn={(event) => {
        if (typeof style === 'function') setPressed(true);
        if (!disabled && !reduceMotion) springTo(0.96);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (typeof style === 'function') setPressed(false);
        if (!disabled && !reduceMotion) springTo(1);
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (disabled) return;
        if (feedback && Platform.OS !== 'web') {
          const action = feedback === 'success'
            ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          void action.catch(() => {});
        }
        if (pop && !reduceMotion) {
          scale.stopAnimation();
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.1, duration: 110, useNativeDriver }),
            Animated.spring(scale, { toValue: 1, speed: 20, bounciness: 8, useNativeDriver }),
          ]).start();
        }
        onPress?.(event);
      }}
      style={[original, { transform }]}
    />
  );
}

type RevealViewProps = ViewProps & { delay?: number; replayKey?: string | number };

/** Reveal a new item or a changed illustration without changing its layout. */
export function RevealView({ children, delay = 0, replayKey, style, ...props }: RevealViewProps) {
  const reduceMotion = useReducedMotion();
  const reducedRef = useRef(reduceMotion);
  const progress = useRef(new Animated.Value(1)).current;
  // Reordering a list should not replay entrances on cards already visible.
  const initialDelay = useRef(delay).current;

  useEffect(() => {
    reducedRef.current = reduceMotion;
  }, [reduceMotion]);

  useEffect(() => {
    progress.stopAnimation();
    if (reducedRef.current) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 360,
      delay: initialDelay,
      useNativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [initialDelay, progress, replayKey]);

  useEffect(() => {
    if (reduceMotion) {
      progress.stopAnimation();
      progress.setValue(1);
    }
  }, [reduceMotion, progress]);

  const originalStyle = StyleSheet.flatten(style);
  const originalTransform = originalStyle?.transform;
  const transform = typeof originalTransform === 'string'
    ? originalTransform
    : [
        ...(originalTransform ?? []),
        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
        { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
      ];
  return (
    <Animated.View
      {...props}
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, originalStyle?.opacity ?? 1] }),
          transform,
        },
      ]}>
      {children}
    </Animated.View>
  );
}

export function CelebrationToast({ event }: { event: { id: number; message: string } | null }) {
  const reduceMotion = useReducedMotion();
  const reducedRef = useRef(reduceMotion);
  const opacity = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    reducedRef.current = reduceMotion;
  }, [reduceMotion]);

  useEffect(() => {
    if (!event) return;
    setVisible(true);
    opacity.stopAnimation();
    rise.stopAnimation();
    opacity.setValue(reducedRef.current ? 1 : 0);
    rise.setValue(reducedRef.current ? 1 : 0);
    if (!reducedRef.current) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver }),
        Animated.spring(rise, { toValue: 1, speed: 20, bounciness: 6, useNativeDriver }),
      ]).start();
    }
    const fadeTimer = setTimeout(() => {
      if (!reducedRef.current) {
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver }).start();
      }
    }, 1650);
    const hideTimer = setTimeout(() => setVisible(false), 1900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      opacity.stopAnimation();
      rise.stopAnimation();
    };
  }, [event, opacity, rise]);

  useEffect(() => {
    if (reduceMotion && visible) {
      opacity.stopAnimation();
      rise.stopAnimation();
      opacity.setValue(1);
      rise.setValue(1);
    }
  }, [reduceMotion, visible, opacity, rise]);

  if (!event || !visible) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessible
      accessibilityRole="alert"
      accessibilityLabel={event.message}
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          opacity,
          transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}>
      <Text accessible={false} style={styles.toastIcon}>🌱</Text>
      <Text accessible={false} style={styles.toastText}>{event.message}</Text>
      <Text accessible={false} style={styles.toastSparkle}>✦</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: COLORS.sproutDark,
    elevation: 4,
    shadowColor: COLORS.text,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  toastIcon: { fontSize: 20 },
  toastText: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  toastSparkle: { color: COLORS.mustardLight, fontSize: 17 },
});
