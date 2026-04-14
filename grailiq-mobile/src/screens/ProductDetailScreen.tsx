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
import { StatCard } from '../components/StatCard';
import { SignalBadge } from '../components/SignalBadge';
import { LoadingScreen } from '../components/LoadingScreen';
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
        <Text style={styles.productType}>
          {product.type.replace(/_/g, ' ').toUpperCase()}
        </Text>
        <Text style={styles.productName}>{product.name}</Text>
        {msrp && <Text style={styles.msrp}>MSRP ${msrp.toFixed(2)}</Text>}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.alertButton} onPress={handleAlertMe}>
          <Text style={styles.alertButtonText}>🔔 Alert Me</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.portfolioButton} onPress={handleAddToPortfolio}>
          <Text style={styles.portfolioButtonText}>+ Portfolio</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard
          label="Market Price"
          value={latestPrice ? `$${latestPrice.toFixed(2)}` : '—'}
        />
        <StatCard
          label="vs MSRP"
          value={msrpDiff ? `${Number(msrpDiff) > 0 ? '+' : ''}${msrpDiff}%` : '—'}
          valueColor={
            msrpDiff
              ? Number(msrpDiff) > 0
                ? colors.avoid
                : colors.buy
              : undefined
          }
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          label="Price Range"
          value={
            minPrice && maxPrice
              ? `$${minPrice.toFixed(0)} – $${maxPrice.toFixed(0)}`
              : '—'
          }
        />
        <StatCard
          label="GrailIQ Score"
          value={product.grailiqScore || '—'}
          valueColor={colors.primary}
        />
      </View>

      {/* Time Range Selector */}
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

      {/* Price History Summary */}
      {priceHistory && priceHistory.length > 0 && (
        <View style={styles.priceHistoryCard}>
          <Text style={styles.cardTitle}>Price History</Text>
          <Text style={styles.dataPoints}>
            {priceHistory.length} data points in selected range
          </Text>
          {priceHistory.slice(-5).reverse().map((point, idx) => (
            <View key={point.id || idx} style={styles.priceRow}>
              <Text style={styles.priceDate}>
                {new Date(point.recordedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.priceSource}>{point.source}</Text>
              <Text style={styles.priceValue}>${parseFloat(point.price).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

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
  header: { marginBottom: spacing.xl },
  productType: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  productName: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  msrp: { color: colors.textSecondary, fontSize: fontSize.base },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  alertButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  alertButtonText: { color: colors.white, fontWeight: '700', fontSize: fontSize.base },
  portfolioButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  portfolioButtonText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.base },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  timeRangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.xl,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  timeRangeActive: { backgroundColor: colors.primary },
  timeRangeText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  timeRangeTextActive: { color: colors.white },
  priceHistoryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  dataPoints: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  priceDate: { color: colors.textSecondary, fontSize: fontSize.sm, width: 60 },
  priceSource: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
  },
  priceValue: { color: colors.text, fontSize: fontSize.base, fontWeight: '600' },
  signalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
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
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
});
