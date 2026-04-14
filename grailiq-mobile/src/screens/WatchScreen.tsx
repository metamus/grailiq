import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fontSize } from '../theme/colors';
import { WatchlistScreen } from './WatchlistScreen';
import { AlertsScreen } from './AlertsScreen';

/** Segmented control for Watch tab */
function SegmentedControl({
  options,
  selectedIndex,
  onSegmentChange,
}: {
  options: string[];
  selectedIndex: number;
  onSegmentChange: (index: number) => void;
}) {
  return (
    <View style={styles.segmentContainer}>
      {options.map((option, index) => (
        <Pressable
          key={index}
          onPress={() => onSegmentChange(index)}
          style={[
            styles.segment,
            selectedIndex === index && styles.segmentActive,
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              selectedIndex === index && styles.segmentTextActive,
            ]}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Watch screen combining Watchlist and Alerts.
 * Users toggle between them via a segmented control at the top.
 */
export function WatchScreen() {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SegmentedControl
        options={['Watchlist', 'Alerts']}
        selectedIndex={selectedTab}
        onSegmentChange={setSelectedTab}
      />
      {selectedTab === 0 ? <WatchlistScreen /> : <AlertsScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.text,
  },
});
