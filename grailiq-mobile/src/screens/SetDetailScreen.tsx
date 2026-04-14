import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { useSet } from '../hooks/useSets';
import { SignalBadge } from '../components/SignalBadge';
import { LoadingScreen } from '../components/LoadingScreen';
import { ProductType } from '../types';

const TYPE_LABELS: Record<ProductType, string> = {
  booster_box: 'Booster Box',
  etb: 'Elite Trainer Box',
  booster_pack: 'Booster Pack',
  collection_box: 'Collection Box',
  blister_pack: 'Blister Pack',
  tin: 'Tin',
  premium_collection: 'Premium Collection',
  other: 'Other',
};

export function SetDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { data: set, isLoading } = useSet(route.params.id);

  React.useLayoutEffect(() => {
    if (set) {
      navigation.setOptions({ title: set.name });
    }
  }, [set, navigation]);

  if (isLoading || !set) return <LoadingScreen />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.series}>{set.series}</Text>
            {set.isOutOfPrint && (
              <View style={styles.oopBadge}>
                <Text style={styles.oopText}>Out of Print</Text>
              </View>
            )}
          </View>
          <Text style={styles.setName}>{set.name}</Text>
          <Text style={styles.meta}>
            {set.code.toUpperCase()} · {set.totalCards} cards ·{' '}
            {new Date(set.releaseDate).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.productsTitle}>
            Products ({set.products?.length ?? 0})
          </Text>
        </View>
      }
      data={set.products || []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.productCard}
          onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
        >
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.productType}>{TYPE_LABELS[item.type]}</Text>
            {item.msrp && (
              <Text style={styles.msrp}>MSRP ${parseFloat(item.msrp).toFixed(2)}</Text>
            )}
          </View>
          <View style={styles.productRight}>
            {item.grailiqScore && (
              <Text style={styles.score}>{item.grailiqScore}</Text>
            )}
            <SignalBadge signal={item.investmentSignal} />
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No products found for this set</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  header: { marginBottom: spacing.xl },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  series: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  oopBadge: {
    backgroundColor: '#DC262615',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  oopText: { color: colors.avoid, fontSize: fontSize.xs, fontWeight: '700' },
  setName: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  meta: { color: colors.textSecondary, fontSize: fontSize.sm },
  productsTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: spacing['2xl'],
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: { flex: 1, marginRight: spacing.md },
  productName: { color: colors.text, fontSize: fontSize.base, fontWeight: '600' },
  productType: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  msrp: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  productRight: { alignItems: 'flex-end', gap: spacing.xs },
  score: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '700' },
  empty: { padding: spacing['3xl'], alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.base },
});
