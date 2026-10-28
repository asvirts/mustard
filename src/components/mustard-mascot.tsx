import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

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
        {/* Soft warm ambient halo */}
        <Circle cx="90" cy="92" r="76" fill="#FDF3D7" opacity={0.75} />
        <Circle cx="90" cy="94" r="56" fill="#FCE7B2" opacity={0.45} />

        {/* Stage 6: Flourishing Mustard Tree canopy behind the mascot */}
        {clampedStage >= 6 && (
          <G>
            {/* Tree trunk */}
            <Path
              d="M84 125 C84 95, 86 70, 90 48 C94 70, 96 95, 96 125 Z"
              fill="#8C5D30"
            />
            {/* Branches */}
            <Path
              d="M90 78 Q65 65 55 52"
              stroke="#8C5D30"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M90 74 Q115 62 126 48"
              stroke="#8C5D30"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Lush green tree canopy */}
            <Circle cx="90" cy="42" r="28" fill="#4D8A46" />
            <Circle cx="60" cy="54" r="22" fill="#5D9C54" />
            <Circle cx="120" cy="54" r="22" fill="#5D9C54" />
            <Circle cx="74" cy="32" r="18" fill="#6EB063" />
            <Circle cx="108" cy="34" r="18" fill="#6EB063" />
            {/* Little golden mustard blossoms in the canopy */}
            <Circle cx="66" cy="44" r="4" fill="#FFD646" />
            <Circle cx="92" cy="26" r="4.5" fill="#FFD646" />
            <Circle cx="114" cy="46" r="4" fill="#FFD646" />
            <Circle cx="52" cy="60" r="3.5" fill="#FFD646" />
            <Circle cx="127" cy="58" r="3.5" fill="#FFD646" />
            {/* Tiny bluebird resting on a branch (Matthew 13:32) */}
            <G transform="translate(118, 24)">
              <Ellipse cx="10" cy="10" rx="7.5" ry="5.5" fill="#4E86A8" />
              <Circle cx="16" cy="7" r="4.2" fill="#4E86A8" />
              <Path d="M20 7 L24.5 5.2 L20 8.8 Z" fill="#F2A31B" />
              <Circle cx="16.8" cy="6.3" r="1" fill="#FFFFFF" />
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
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <Ellipse
              cx="98"
              cy="51"
              rx="6.5"
              ry="4.2"
              transform="rotate(-25 98 51)"
              fill="#6EB063"
            />
          </G>
        )}

        {clampedStage === 3 && (
          <G>
            {/* Stem */}
            <Path
              d="M90 74 L90 48"
              stroke="#4D8A46"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Left & Right Cotyledon Leaves */}
            <Path
              d="M90 54 C74 44, 64 52, 74 62 C80 66, 87 60, 90 54 Z"
              fill="#5D9C54"
            />
            <Path
              d="M90 54 C106 44, 116 52, 106 62 C100 66, 93 60, 90 54 Z"
              fill="#6EB063"
            />
          </G>
        )}

        {(clampedStage === 4 || clampedStage === 5) && (
          <G>
            {/* Taller Stem */}
            <Path
              d="M90 76 Q89 52 90 34"
              stroke="#4A8746"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Lower pair of leaves */}
            <Path
              d="M90 62 C70 52, 58 60, 70 70 C77 75, 86 68, 90 62 Z"
              fill="#4D8A46"
            />
            <Path
              d="M90 62 C110 52, 122 60, 110 70 C103 75, 94 68, 90 62 Z"
              fill="#5D9C54"
            />
            {/* Upper pair of leaves */}
            <Path
              d="M90 45 C74 33, 64 40, 75 50 C81 54, 87 49, 90 45 Z"
              fill="#6EB063"
            />
            <Path
              d="M90 45 C106 33, 116 40, 105 50 C99 54, 93 49, 90 45 Z"
              fill="#5D9C54"
            />
            {/* Stage 5: Bright Yellow Mustard Blossoms */}
            {clampedStage === 5 && (
              <G>
                <Circle cx="90" cy="24" r="6.5" fill="#FFD646" />
                <Circle cx="83.5" cy="29" r="5.5" fill="#FFD646" />
                <Circle cx="96.5" cy="29" r="5.5" fill="#FFD646" />
                <Circle cx="90" cy="33" r="5.5" fill="#FFD646" />
                <Circle cx="90" cy="28.5" r="3.5" fill="#D9880A" />
              </G>
            )}
          </G>
        )}

        {/* Soft Soil Mound at the base */}
        <Ellipse cx="90" cy="146" rx="46" ry="10" fill="#B88E65" opacity={0.35} />
        <Ellipse cx="90" cy="144" rx="34" ry="6.5" fill="#8C6239" opacity={0.3} />

        {/* Little Root Tendrils for Stage >= 2 */}
        {clampedStage >= 2 && (
          <G opacity={0.55}>
            <Path
              d="M82 142 Q76 149 69 152"
              stroke="#7A5230"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M98 142 Q104 149 111 152"
              stroke="#7A5230"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </G>
        )}

        {/* Playful Mustard Seed Body */}
        <Path
          d="M90 68 C115 68, 129 89, 127 112 C125 132, 109 144, 90 144 C71 144, 55 132, 53 112 C51 89, 65 68, 90 68 Z"
          fill="#F4BC33"
          stroke="#D69912"
          strokeWidth="2"
        />

        {/* Warm highlight on the seed */}
        <Ellipse
          cx="74"
          cy="86"
          rx="9.5"
          ry="5.2"
          transform="rotate(-28 74 86)"
          fill="#FFF0B8"
          opacity={0.85}
        />

        {/* Cute Eyes */}
        <Circle cx="76.5" cy="106" r="4" fill="#231F18" />
        <Circle cx="103.5" cy="106" r="4" fill="#231F18" />
        <Circle cx="75.2" cy="104.6" r="1.4" fill="#FFFFFF" />
        <Circle cx="102.2" cy="104.6" r="1.4" fill="#FFFFFF" />

        {/* Soft Rosy Cheeks */}
        <Ellipse cx="68" cy="113.5" rx="5.2" ry="3" fill="#EA8266" opacity={0.55} />
        <Ellipse cx="112" cy="113.5" rx="5.2" ry="3" fill="#EA8266" opacity={0.55} />

        {/* Warm Gentle Smile */}
        <Path
          d="M83.5 112.5 Q90 119 96.5 112.5"
          stroke="#231F18"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
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
