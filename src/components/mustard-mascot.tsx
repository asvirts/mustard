import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

interface MustardMascotProps {
  stage: number; // 1 to 6
  size?: number;
}

/**
 * Playful yellow mustard-seed mascot that sprouts and grows into a flourishing
 * mustard tree as prayers are answered (stages 1..6).
 */
export function MustardMascot({ stage, size = 140 }: MustardMascotProps) {
  const clampedStage = Math.max(1, Math.min(6, stage));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 180 180">
        {/* Soft warm sun halo in background */}
        <Circle cx="90" cy="92" r="74" fill="#FFF3CC" opacity={0.75} />
        <Circle cx="90" cy="92" r="56" fill="#FFE699" opacity={0.45} />

        {/* Stage 6: Flourishing Mustard Tree canopy behind the mascot */}
        {clampedStage >= 6 && (
          <G>
            {/* Tree trunk */}
            <Path
              d="M84 125 C84 95, 86 70, 90 48 C94 70, 96 95, 96 125 Z"
              fill="#8C5828"
            />
            {/* Branches */}
            <Path
              d="M90 78 Q65 65 55 52"
              stroke="#8C5828"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M90 74 Q115 62 126 48"
              stroke="#8C5828"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Lush green tree canopy */}
            <Circle cx="90" cy="42" r="28" fill="#4E8C45" />
            <Circle cx="60" cy="54" r="22" fill="#5D9E52" />
            <Circle cx="120" cy="54" r="22" fill="#5D9E52" />
            <Circle cx="74" cy="32" r="18" fill="#6BB35E" />
            <Circle cx="108" cy="34" r="18" fill="#6BB35E" />
            {/* Little golden mustard blossoms in the canopy */}
            <Circle cx="66" cy="44" r="4.5" fill="#FFD43B" />
            <Circle cx="92" cy="26" r="5" fill="#FFD43B" />
            <Circle cx="114" cy="46" r="4.5" fill="#FFD43B" />
            <Circle cx="52" cy="60" r="4" fill="#FFD43B" />
            <Circle cx="127" cy="58" r="4" fill="#FFD43B" />
            {/* Tiny bluebird resting on a branch (Matthew 13:32) */}
            <G transform="translate(118, 24)">
              <Ellipse cx="10" cy="10" rx="8" ry="6" fill="#4B83A6" />
              <Circle cx="16" cy="7" r="4.5" fill="#4B83A6" />
              <Path d="M20 7 L25 5 L20 9 Z" fill="#F59F00" />
              <Circle cx="17" cy="6.2" r="1" fill="#FFFFFF" />
            </G>
          </G>
        )}

        {/* Stem and leaves for Stages 2..5 */}
        {clampedStage === 2 && (
          <G>
            {/* Tiny emerging sprout tip */}
            <Path
              d="M90 72 Q90 58 95 52"
              stroke="#5A9A4E"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            <Ellipse
              cx="98"
              cy="51"
              rx="7"
              ry="4.5"
              transform="rotate(-25 98 51)"
              fill="#6BB35E"
            />
          </G>
        )}

        {clampedStage === 3 && (
          <G>
            {/* Stem */}
            <Path
              d="M90 74 L90 48"
              stroke="#4E8C45"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Left & Right Cotyledon Leaves */}
            <Path
              d="M90 54 C74 44, 64 52, 74 62 C80 66, 87 60, 90 54 Z"
              fill="#5D9E52"
            />
            <Path
              d="M90 54 C106 44, 116 52, 106 62 C100 66, 93 60, 90 54 Z"
              fill="#6BB35E"
            />
          </G>
        )}

        {(clampedStage === 4 || clampedStage === 5) && (
          <G>
            {/* Taller Stem */}
            <Path
              d="M90 76 Q89 52 90 34"
              stroke="#478243"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Lower pair of leaves */}
            <Path
              d="M90 62 C70 52, 58 60, 70 70 C77 75, 86 68, 90 62 Z"
              fill="#4E8C45"
            />
            <Path
              d="M90 62 C110 52, 122 60, 110 70 C103 75, 94 68, 90 62 Z"
              fill="#5D9E52"
            />
            {/* Upper pair of leaves */}
            <Path
              d="M90 45 C74 33, 64 40, 75 50 C81 54, 87 49, 90 45 Z"
              fill="#6BB35E"
            />
            <Path
              d="M90 45 C106 33, 116 40, 105 50 C99 54, 93 49, 90 45 Z"
              fill="#5D9E52"
            />
            {/* Stage 5: Bright Yellow Mustard Blossoms */}
            {clampedStage === 5 && (
              <G>
                <Circle cx="90" cy="24" r="7" fill="#FFD43B" />
                <Circle cx="83" cy="29" r="6" fill="#FFD43B" />
                <Circle cx="97" cy="29" r="6" fill="#FFD43B" />
                <Circle cx="90" cy="33" r="6" fill="#FFD43B" />
                <Circle cx="90" cy="28" r="4" fill="#D98200" />
              </G>
            )}
          </G>
        )}

        {/* Soil Mound at the base */}
        <Path
          d="M36 146 Q90 126 144 146 L136 156 Q90 162 44 156 Z"
          fill="#8C6239"
          opacity={0.85}
        />

        {/* Little Root Tendrils for Stage >= 2 */}
        {clampedStage >= 2 && (
          <G opacity={0.7}>
            <Path
              d="M82 142 Q75 150 68 153"
              stroke="#634224"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M98 142 Q105 150 112 153"
              stroke="#634224"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </G>
        )}

        {/* Playful Mustard Seed Body */}
        <Path
          d="M90 68 C116 68, 130 90, 128 112 C126 132, 110 144, 90 144 C70 144, 54 132, 52 112 C50 90, 64 68, 90 68 Z"
          fill="#F2B728"
          stroke="#C78C06"
          strokeWidth="3"
        />

        {/* Warm highlight on the seed */}
        <Ellipse
          cx="73"
          cy="86"
          rx="10"
          ry="6"
          transform="rotate(-28 73 86)"
          fill="#FFE58F"
          opacity={0.85}
        />

        {/* Cute Eyes */}
        <Circle cx="76" cy="105" r="4.5" fill="#2A2419" />
        <Circle cx="104" cy="105" r="4.5" fill="#2A2419" />
        <Circle cx="74.5" cy="103.5" r="1.5" fill="#FFFFFF" />
        <Circle cx="102.5" cy="103.5" r="1.5" fill="#FFFFFF" />

        {/* Rosy Cheeks */}
        <Ellipse cx="67" cy="113" rx="5.5" ry="3.2" fill="#E87A5D" opacity={0.65} />
        <Ellipse cx="113" cy="113" rx="5.5" ry="3.2" fill="#E87A5D" opacity={0.65} />

        {/* Warm Gentle Smile */}
        <Path
          d="M82 112 Q90 120 98 112"
          stroke="#2A2419"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Stage badge pill at bottom */}
        <Rect x="58" y="152" width="64" height="20" rx="10" fill="#2A2419" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
