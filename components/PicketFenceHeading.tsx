import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Polygon } from 'react-native-svg';

// Upside down green and white picket fence SVG
export default function PicketFenceHeading({ width = 220, height = 50 }) {
  const picketCount = 7;
  const picketWidth = width / picketCount;
  const picketHeight = height * 0.8;
  const picketColors = ['#fff', '#34c759']; // white and green

  return (
    <View style={{ alignItems: 'center', marginBottom: 10 }}>
      <Svg width={width} height={height}>
        {/* Draw pickets */}
        {Array.from({ length: picketCount }).map((_, i) => {
          const x = i * picketWidth;
          const color = picketColors[i % 2];
          // Upside down picket: triangle at the bottom
          return (
            <React.Fragment key={i}>
              <Rect
                x={x + picketWidth * 0.25}
                y={0}
                width={picketWidth * 0.5}
                height={picketHeight * 0.7}
                fill={color}
                stroke="#228B22"
                strokeWidth={2}
                rx={3}
              />
              <Polygon
                points={`
                  ${x + picketWidth * 0.25},${picketHeight * 0.7}
                  ${x + picketWidth * 0.75},${picketHeight * 0.7}
                  ${x + picketWidth * 0.5},${height}
                `}
                fill={color}
                stroke="#228B22"
                strokeWidth={2}
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
