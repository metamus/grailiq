import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { usePortfolio } from '../hooks/usePortfolio';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingScreen } from '../components/LoadingScreen';

export function PortfolioScreen() {
  const navigation = useNavigation<any>();
  const { data: portfolio, isLoading, refetch } = usePortfolio();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) return <LoadingScreen />;

  const items = portfolio || [];
  const totalValue = items.reduce((sum, item) => {
    const price = parseFloat(item.currentPrice || item.purchasePrice);
    return sum + price * item.quantity;
  }, 0);
  const costBasis = items.reduce((sum, item) => {
    return sum + parseFloat(item.purchasePrice) * item.quantity;
  }, 0);
  const pnl = totalValue - costBasis;
  const pnlPercent = costBasis > 0 ? ((pnl / costBasis) * 100).toFixed(1) : '0';

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          items.length > 0 ? (
            <View>
              <View style={styles.statsRow}>
                <StatCard label="Total Value" value={`$${totalValue.toFixed(0)}`} />
                <StatCard label="Cost Basis" value={`$${costBasis.toFixed(0)}`} />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  label="Unrealized P&L"
                  value={`${pnl >= 0 ? '+' : ''}$${pnl.toFixed(0)}`}
                  subtitle={`${pnl >= 0 ? '+' : ''}${pnlPercent}%`}
                  valueColor={pnl >= 0 ? colors.buy : colors.avoid}
                />
                <StatCard label="Items" value={String(items.length)} />
              </View>
              <Text style={styles.holdingsTitle}>Holdings</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const currentPrice = parseFloat(item.currentPrice || item.purchasePrice);
          const purchasePrice = parseFloat(item.purchasePrice);
          const itemPnl = (currentPrice - purchasePrice) * item.quantity;
          const itemPnlPct = purchasePrice > 0 ? ((currentPrice - purchasePrice) / purchasePrice) * 100 : 0;

          return (
            <TouchableOpacity
              style={styles.holdingCard}
              onPress={() => navigation.navigate('ProductDetail', { id: item.productId })}
            >
              <View style={styles.holdingInfo}>
                <Text style={styles.holdingName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={styles.holdingMeta}>
                  {item.quantity}x · Bought ${purchasePrice.toFixed(2)} ·{' '}
                  {new Date(item.purchaseDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.holdingRight}>
                <Text style={styles.holdingValue}>
                  ${(currentPrice * item.quantity).toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.holdingPnl,
                    { color: itemPnl >= 0 ? colors.buy : colors.avoid },
                  ]}
                >
                  {itemPnl >= 0 ? '+' : ''}${itemPnl.toFixed(2)} ({itemPnlPct.toFixed(1)}%)
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="Your portfolio is empty"
            description="Start tracking your sealed product investments by adding items from the product pages."
            actionLabel="Browse Sets"
            onAction={() => navigation.navigate('SetsTab')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  emptyContainer: { flex: 1 },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  holdingsTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  holdingCard: {
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
  holdingInfo: { flex: 1, marginRight: spacing.md },
  holdingName: { color: colors.text, fontSize: fontSize.base, fontWeight: '600' },
  holdingMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },
  holdingRight: { alignItems: 'flex-end' },
  holdingValue: { color: colors.text, fontSize: fontSize.base, fontWeight: '700' },
  holdingPnl: { fontSize: fontSize.xs, fontWeight: '600', marginTop: 2 },
});
