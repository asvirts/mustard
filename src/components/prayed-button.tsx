import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/constants/mustard-data';
import { useReducedMotion } from '@/components/delight';

type PrayedButtonProps = {
  count: number;
  onPress: () => void;
  large?: boolean;
};

export function PrayedButton({ count, onPress, large = false }: PrayedButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const celebration = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      scale.stopAnimation();
      celebration.stopAnimation();
    };
  }, [celebration, scale]);

  useEffect(() => {
    if (reduceMotion) {
      scale.stopAnimation();
      celebration.stopAnimation();
      scale.setValue(1);
      celebration.setValue(0);
    }
  }, [celebration, reduceMotion, scale]);

  const handlePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onPress();
    setShowConfirmation(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShowConfirmation(false), 1100);

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    scale.stopAnimation();
    celebration.stopAnimation();
    scale.setValue(1);
    celebration.setValue(0);
    if (!reduceMotion) {
      const useNativeDriver = Platform.OS !== 'web';
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.08, speed: 35, bounciness: 7, useNativeDriver }),
          Animated.spring(scale, { toValue: 1, speed: 22, bounciness: 8, useNativeDriver }),
        ]),
        Animated.timing(celebration, { toValue: 1, duration: 850, useNativeDriver }),
      ]).start();
    }
  };

  return (
    <View style={[styles.wrapper, large && styles.largeWrapper]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Record a prayer. Prayed ${count} ${count === 1 ? 'time' : 'times'}.`}
          hitSlop={6}
          onPress={handlePress}
          style={[
            styles.button,
            large && styles.largeButton,
            showConfirmation && styles.buttonConfirmed,
          ]}>
          <Ionicons
            name={showConfirmation ? 'checkmark-circle' : large ? 'hand-left' : 'hand-left-outline'}
            size={large ? 16 : 14}
            color={showConfirmation ? COLORS.sproutDark : COLORS.mustardDark}
          />
          <Text
            style={[
              styles.buttonText,
              large && styles.largeButtonText,
              showConfirmation && styles.buttonTextConfirmed,
            ]}>
            {showConfirmation ? 'Prayed' : large ? 'Pray Now' : 'Prayed'}
          </Text>
          <View
            style={[
              styles.countBadge,
              showConfirmation && styles.countBadgeConfirmed,
            ]}>
            <Text
              style={[
                styles.countText,
                showConfirmation && styles.countTextConfirmed,
              ]}>
              {count}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
      {!reduceMotion && (
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.celebration,
            {
              opacity: celebration.interpolate({
                inputRange: [0, 0.15, 0.7, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [{ translateY: celebration.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }) }],
            },
          ]}>
          <Text style={styles.sparkle}>✦</Text>
          <Text style={styles.plusOne}>+1</Text>
          <Text style={[styles.sparkle, styles.greenSparkle]}>✦</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
  },
  largeWrapper: {
    alignSelf: 'stretch',
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceAlt,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F3E3B8',
  },
  buttonConfirmed: {
    backgroundColor: COLORS.sproutLight,
    borderColor: '#CBE6C9',
  },
  largeButton: {
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  largeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonTextConfirmed: {
    color: COLORS.sproutDark,
  },
  countBadge: {
    backgroundColor: COLORS.mustardLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countBadgeConfirmed: {
    backgroundColor: '#D6EDD4',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mustardDark,
  },
  countTextConfirmed: {
    color: COLORS.sproutDark,
  },
  celebration: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  sparkle: {
    color: COLORS.mustardDark,
    fontSize: 11,
  },
  greenSparkle: {
    color: COLORS.sprout,
  },
  plusOne: {
    color: COLORS.sproutDark,
    fontSize: 12,
    fontWeight: '700',
  },
});
