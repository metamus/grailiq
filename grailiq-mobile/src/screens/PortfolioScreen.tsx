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
import { EmptyState } from '../components/EmptyState';
import { LoadingScreen } from '../components/LoadingScreen';
import { Sparkline } from '../components/Sparkline';
import { generateTrend } from '../utils/sparkData';

function fmt(n: number, digits = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

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
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  const isPositive = pnl >= 0;

  const trend = generateTrend('portfolio-page', isPositive ? 'up' : 'down', 24);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          items.length > 0 ? (
            <View>
              <View style={styles.header}>
                <Text style={styles.title}>Portfolio</Text>
                <Text style={styles.subtitle}>
                  {items.length} {items.length === 1 ? 'holding' : 'holdings'}
                </Text>
              </View>

              {/* Hero value card */}
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>Total Value</Text>
                <Text style={styles.heroValue}>${fmt(totalValue)}</Text>
                <View style={styles.heroChangeRow}>
                  <Text
                    style={[
                      styles.heroChange,
                      { color: isPositive ? colors.buy : colors.avoid },
                    ]}
                  >
                    {isPositive ? '▲' : '▼'} ${fmt(Math.abs(pnl))}
                  </Text>
                  <Text
                    style={[
                      styles.heroChangePct,
                      { color: isPositive ? colors.buy : colors.avoid },
                    ]}
                  >
                    {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </Text>
                  <Text style={styles.heroRange}>· all time</Text>
                </View>
                <View style={styles.heroChart}>
                  <Sparkline
                    points={trend}
                    color={isPositive ? colors.buy : colors.avoid}
                    width={320}
                    height={66}
                  />
                </View>
              </View>

              {/* Split stats */}
              <View style={styles.splitRow}>
                <View style={styles.splitCard}>
                  <Text style={styles.splitLabel}>Cost Basis</Text>
                  <Text style={styles.splitValue}>${fmt(costBasis, 0)}</Text>
                </View>
                <View style={styles.splitCard}>
                  <Text style={styles.splitLabel}>Unrealized P&L</Text>
                  <Text
                    style={[
                      styles.splitValue,
                      { color: isPositive ? colors.buy : colors.avoid },
                    ]}
                  >
                    {isPositive ? '+' : '−'}${fmt(Math.abs(pnl), 0)}
                  </Text>
                </View>
              </View>

              <Text style={styles.holdingsTitle}>Holdings</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const currentPrice = parseFloat(item.currentPrice || item.purchasePrice);
          const purchasePrice = parseFloat(item.purchasePrice);
          const itemPnl = (currentPrice - purchasePrice) * item.quantity;
          const itemPnlPct =
            purchasePrice > 0 ? ((currentPrice - purchasePrice) / purchasePrice) * 100 : 0;
          const up = itemPnl >= 0;
          const itemTrend = generateTrend(item.id, up ? 'up' : 'down', 14);

          return (
            <TouchableOpacity
              style={styles.holdingCard}
              onPress={() => navigation.navigate('ProductDetail', { id: item.productId })}
              activeOpacity={0.8}
            >
              <View style={styles.holdingInfo}>
                <Text style={styles.holdingName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={styles.holdingMeta}>
                  {item.quantity}× @ ${purchasePrice.toFixed(2)} ·{' '}
                  {new Date(item.purchaseDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit',
                  })}
                </Text>
                <View style={styles.sparkWrap}>
                  <Sparkline
                    points={itemTrend}
                    color={up ? colors.buy : colors.avoid}
                    width={120}
                    height={24}
                  />
                </View>
              </View>
              <View style={styles.holdingRight}>
                <Text style={styles.holdingValue}>
                  ${fmt(currentPrice * item.quantity)}
                </Text>
                <Text
                  style={[
                    styles.holdingPnl,
                    { color: up ? colors.buy : colors.avoid },
                  ]}
                >
                  {up ? '+' : '−'}${fmt(Math.abs(itemPnl))}
                </Text>
                <Text
                  style={[
                    styles.holdingPnlPct,
                    { color: up ? colors.buy : colors.avoid },
                  ]}
                >
                  {up ? '+' : ''}{itemPnlPct.toFixed(1)}%
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

  header: { marginBottom: spacing.lg, marginTop: spacing.sm },
  title: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },

  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  heroLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  heroValue: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  heroChange: { fontSize: fontSize.base, fontWeight: '700' },
  heroChangePct: { fontSize: fontSize.sm, fontWeight: '600' },
  heroRange: { color: colors.textMuted, fontSize: fontSize.xs },
  heroChart: { marginTop: spacing.lg, marginHorizontal: -spacing.sm },

  splitRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  splitCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  splitLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  splitValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },

  holdingsTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  holdingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  holdingInfo: { flex: 1 },
  holdingName: { color: colors.text, fontSize: fontSize.base, fontWeight: '700' },
  holdingMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },
  sparkWrap: { marginTop: spacing.sm, marginLeft: -2 },
  holdingRight: { alignItems: 'flex-end' },
  holdingValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  holdingPnl: { fontSize: fontSize.sm, fontWeight: '700', marginTop: 2 },
  holdingPnlPct: { fontSize: fontSize.xs, fontWeight: '600', marginTop: 1 },
});
