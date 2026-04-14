import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { useProduct, usePriceHistory } from '../hooks/useProducts';
import { useCreateAlert } from '../hooks/useAlerts';
import { useAddPortfolioItem } from '../hooks/usePortfolio';
import { useIsWatching, useToggleWatch } from '../hooks/useWatchlist';
import { SignalBadge } from '../components/SignalBadge';
import { LoadingScreen } from '../components/LoadingScreen';
import { Sparkline } from '../components/Sparkline';
import { signalToColor, generateTrend, signalToBias } from '../utils/sparkData';
import { TimeRange } from '../types';

const TIME_RANGES: TimeRange[] = ['7d', '30d', '90d', '1y', 'all'];

const SIGNAL_COLORS: Record<string, string> = {
  buy: colors.buy,
  hold: colors.hold,
  watch: colors.watch,
  avoid: colors.avoid,
};

export function ProductDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { data: product, isLoading } = useProduct(route.params.id);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { data: priceHistory } = usePriceHistory(route.params.id, timeRange);
  const createAlert = useCreateAlert();
  const addToPortfolio = useAddPortfolioItem();
  const { watching } = useIsWatching(route.params.id);
  const toggleWatch = useToggleWatch();

  React.useLayoutEffect(() => {
    if (product) {
      navigation.setOptions({ title: product.name });
    }
  }, [product, navigation]);

  if (isLoading || !product) return <LoadingScreen />;

  const msrp = product.msrp ? parseFloat(product.msrp) : null;
  const latestPrice =
    priceHistory && priceHistory.length > 0
      ? parseFloat(priceHistory[priceHistory.length - 1].price)
      : null;
  const msrpDiff =
    msrp && latestPrice ? (((latestPrice - msrp) / msrp) * 100).toFixed(1) : null;

  const prices = priceHistory?.map((p) => parseFloat(p.price)) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

  // Chart data — use real points if we have enough, otherwise a deterministic demo curve
  const chartPoints =
    prices.length >= 4
      ? prices
      : generateTrend(product.id, signalToBias(product.investmentSignal), 18);
  const firstPrice = chartPoints[0];
  const lastPrice = chartPoints[chartPoints.length - 1];
  const priceChange = lastPrice - firstPrice;
  const priceChangePct = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const chartUp = priceChange >= 0;
  const chartColor = product.investmentSignal
    ? signalToColor(product.investmentSignal)
    : chartUp
    ? colors.buy
    : colors.avoid;

  const handleAlertMe = () => {
    createAlert.mutate(
      { productId: product.id, retailer: 'all' },
      {
        onSuccess: () => Alert.alert('Alert Created', 'You\'ll be notified when this product restocks.'),
        onError: () => Alert.alert('Error', 'Failed to create alert. Please try again.'),
      }
    );
  };

  const handleAddToPortfolio = () => {
    addToPortfolio.mutate(
      {
        productId: product.id,
        quantity: 1,
        purchasePrice: latestPrice?.toFixed(2) || msrp?.toFixed(2) || '0',
        purchaseDate: new Date().toISOString().split('T')[0],
      },
      {
        onSuccess: () => Alert.alert('Added', 'Product added to your portfolio.'),
        onError: () => Alert.alert('Error', 'Failed to add to portfolio. Please try again.'),
      }
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Product Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.productType}>
            {product.type.replace(/_/g, ' ').toUpperCase()}
          </Text>
          {product.investmentSignal && (
            <SignalBadge signal={product.investmentSignal} size="md" />
          )}
        </View>
        <Text style={styles.productName}>{product.name}</Text>

        {/* Price + change row */}
        <View style={styles.priceRow2}>
          <Text style={styles.priceNow}>
            {latestPrice ? `$${latestPrice.toFixed(2)}` : '—'}
          </Text>
          {priceChange !== 0 && (
            <View style={styles.priceChangePill}>
              <Text
                style={[
                  styles.priceChangeText,
                  { color: chartUp ? colors.buy : colors.avoid },
                ]}
              >
                {chartUp ? '▲' : '▼'} {chartUp ? '+' : ''}
                {priceChange.toFixed(2)} ({priceChangePct.toFixed(1)}%)
              </Text>
            </View>
          )}
        </View>
        {msrp && (
          <Text style={styles.msrp}>
            MSRP ${msrp.toFixed(2)}
            {msrpDiff && (
              <Text
                style={{
                  color: Number(msrpDiff) > 0 ? colors.avoid : colors.buy,
                }}
              >
                {' '}· {Number(msrpDiff) > 0 ? '+' : ''}
                {msrpDiff}% vs MSRP
              </Text>
            )}
          </Text>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartCard}>
        <View style={styles.timeRangeRow}>
          {TIME_RANGES.map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeActive,
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.chartWrap}>
          <Sparkline points={chartPoints} color={chartColor} width={320} height={120} />
        </View>
        <View style={styles.chartFooter}>
          <Text style={styles.chartFooterLabel}>
            {priceHistory?.length ?? 0} data points
          </Text>
          {minPrice && maxPrice && (
            <Text style={styles.chartFooterRange}>
              ${minPrice.toFixed(0)} – ${maxPrice.toFixed(0)}
            </Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.watchButton,
            watching && { backgroundColor: colors.avoid + '22', borderColor: colors.avoid + '55' },
          ]}
          onPress={() => toggleWatch.mutate(route.params.id)}
          disabled={toggleWatch.isPending}
        >
          <Text style={[styles.watchButtonText, watching && { color: colors.avoid }]}>
            {watching ? '❤️  Watching' : '🤍  Watch'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.alertButton} onPress={handleAlertMe}>
          <Text style={styles.alertButtonText}>🔔  Alert</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.portfolioButton} onPress={handleAddToPortfolio}>
          <Text style={styles.portfolioButtonText}>+  Add</Text>
        </TouchableOpacity>
      </View>

      {/* Score + range tiles */}
      <View style={styles.tileRow}>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>GrailIQ Score</Text>
          <Text style={[styles.tileValue, { color: colors.gold }]}>
            {product.grailiqScore || '—'}
          </Text>
          <Text style={styles.tileHint}>0–100 scale</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Price Range</Text>
          <Text style={styles.tileValue}>
            {minPrice && maxPrice
              ? `$${minPrice.toFixed(0)}–${maxPrice.toFixed(0)}`
              : '—'}
          </Text>
          <Text style={styles.tileHint}>{timeRange} window</Text>
        </View>
      </View>

      {/* Investment Signal */}
      {product.investmentSignal && (
        <View
          style={[
            styles.signalCard,
            { borderColor: SIGNAL_COLORS[product.investmentSignal] + '40' },
          ]}
        >
          <View style={styles.signalHeader}>
            <Text style={styles.cardTitle}>Investment Signal</Text>
            <SignalBadge signal={product.investmentSignal} size="md" />
          </View>
          {product.signalRationale && (
            <Text style={styles.rationale}>{product.signalRationale}</Text>
          )}
        </View>
      )}

      {/* Product Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Product Details</Text>
        <DetailRow label="Type" value={product.type.replace(/_/g, ' ')} />
        {msrp && <DetailRow label="MSRP" value={`$${msrp.toFixed(2)}`} />}
        {product.tcgplayerId && (
          <DetailRow label="TCGPlayer ID" value={product.tcgplayerId} />
        )}
        {product.scoreUpdatedAt && (
          <DetailRow
            label="Score Updated"
            value={new Date(product.scoreUpdatedAt).toLocaleDateString()}
          />
        )}
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textSecondary, fontSize: fontSize.sm },
  value: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', textTransform: 'capitalize' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },

  header: { marginBottom: spacing.lg, marginTop: spacing.sm },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productType: {
    color: colors.primaryLight,
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  productName: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  priceRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  priceNow: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  priceChangePill: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  priceChangeText: { fontSize: fontSize.sm, fontWeight: '700' },
  msrp: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },

  // Chart card
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  chartWrap: {
    marginTop: spacing.md,
    marginHorizontal: -spacing.xs,
    alignItems: 'center',
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chartFooterLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  chartFooterRange: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },

  // Time range selector
  timeRangeRow: { flexDirection: 'row', gap: spacing.xs },
  timeRangeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
  },
  timeRangeActive: { backgroundColor: colors.primary },
  timeRangeText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
  timeRangeTextActive: { color: colors.white },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  watchButton: {
    flex: 1,
    backgroundColor: colors.overlay05,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  watchButtonText: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  alertButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  alertButtonText: { color: colors.white, fontWeight: '800', fontSize: fontSize.sm },
  portfolioButton: {
    flex: 1,
    backgroundColor: 'rgba(127,119,221,0.12)',
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  portfolioButtonText: { color: colors.primary, fontWeight: '800', fontSize: fontSize.base },

  // Tiles
  tileRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  tileLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  tileValue: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '800',
  },
  tileHint: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },

  // Signal + details
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  signalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rationale: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
});
