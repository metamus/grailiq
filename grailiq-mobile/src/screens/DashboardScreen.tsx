import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { useProducts } from '../hooks/useProducts';
import { useSets } from '../hooks/useSets';
import { SignalBadge } from '../components/SignalBadge';
import { LoadingScreen } from '../components/LoadingScreen';
import { Sparkline } from '../components/Sparkline';
import { generateTrend, signalToBias, signalToColor } from '../utils/sparkData';

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { data: products, isLoading: loadingProducts, refetch: refetchProducts } = useProducts();
  const { data: sets, isLoading: loadingSets, refetch: refetchSets } = useSets();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProducts(), refetchSets()]);
    setRefreshing(false);
  };

  if (loadingProducts && loadingSets) return <LoadingScreen />;

  const buySignals = products?.filter((p) => p.investmentSignal === 'buy').length ?? 0;
  const avoidSignals = products?.filter((p) => p.investmentSignal === 'avoid').length ?? 0;
  const avgScore =
    products && products.length > 0
      ? products.reduce((sum, p) => sum + parseFloat(p.grailiqScore || '0'), 0) / products.length
      : 0;

  const topProducts = [...(products || [])]
    .filter((p) => p.grailiqScore)
    .sort((a, b) => parseFloat(b.grailiqScore || '0') - parseFloat(a.grailiqScore || '0'))
    .slice(0, 5);

  const latestSets = [...(sets || [])]
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, 4);

  // Demo portfolio value (real P&L will come from API when wired)
  const demoPortfolioValue = 12847.5;
  const demoPortfolioChange = 1284.3;
  const demoPortfolioChangePct = 11.1;
  const portfolioTrend = generateTrend('portfolio-hero', 'up', 20);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Hero brand */}
      <View style={styles.hero}>
        <View>
          <Text style={styles.heroBrand}>
            Grail<Text style={{ color: colors.primary }}>IQ</Text>
          </Text>
          <Text style={styles.heroSubtitle}>Good morning — here's the market.</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Portfolio hero card */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.portfolioCard}
        onPress={() => navigation.navigate('PortfolioTab')}
      >
        <View style={styles.portfolioHeader}>
          <Text style={styles.portfolioLabel}>Portfolio Value</Text>
          <View style={styles.portfolioPill}>
            <Text style={styles.portfolioPillText}>30D</Text>
          </View>
        </View>
        <Text style={styles.portfolioValue}>{formatCurrency(demoPortfolioValue)}</Text>
        <View style={styles.portfolioChangeRow}>
          <Text style={styles.portfolioChangePos}>
            ▲ {formatCurrency(demoPortfolioChange)}
          </Text>
          <Text style={styles.portfolioChangePct}>+{demoPortfolioChangePct.toFixed(1)}%</Text>
        </View>
        <View style={styles.portfolioChart}>
          <Sparkline points={portfolioTrend} color={colors.primaryLight} width={320} height={70} />
        </View>
      </TouchableOpacity>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statChipLabel}>Sets Tracked</Text>
          <Text style={styles.statChipValue}>{sets?.length ?? 0}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statChipLabel}>Products</Text>
          <Text style={styles.statChipValue}>{products?.length ?? 0}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statChipLabel}>Buy Signals</Text>
          <Text style={[styles.statChipValue, { color: colors.buy }]}>{buySignals}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statChipLabel}>Avoid</Text>
          <Text style={[styles.statChipValue, { color: colors.avoid }]}>{avoidSignals}</Text>
        </View>
      </View>

      {/* Average score tile */}
      <View style={styles.scoreTile}>
        <View>
          <Text style={styles.scoreTileLabel}>Average GrailIQ Score</Text>
          <Text style={styles.scoreTileValue}>{avgScore > 0 ? avgScore.toFixed(1) : '—'}</Text>
          <Text style={styles.scoreTileHint}>Across {products?.length ?? 0} tracked products</Text>
        </View>
        <View style={styles.scoreRing}>
          <Text style={styles.scoreRingText}>{avgScore > 0 ? Math.round(avgScore) : '?'}</Text>
        </View>
      </View>

      {/* Top Rated Products */}
      {topProducts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Signals</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SetsTab')}>
              <Text style={styles.sectionLink}>Browse all ›</Text>
            </TouchableOpacity>
          </View>
          {topProducts.map((product) => {
            const signal = product.investmentSignal;
            const color = signalToColor(signal);
            const trend = generateTrend(product.id, signalToBias(signal));
            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productRow}
                onPress={() => navigation.navigate('ProductDetail', { id: product.id })}
                activeOpacity={0.7}
              >
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.productType}>{product.type.replace(/_/g, ' ')}</Text>
                </View>
                <View style={styles.productSpark}>
                  <Sparkline points={trend} color={color} width={64} height={28} />
                </View>
                <View style={styles.productRight}>
                  <Text style={styles.scoreText}>{product.grailiqScore}</Text>
                  <SignalBadge signal={signal} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Latest Sets */}
      {latestSets.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Sets</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SetsTab')}>
              <Text style={styles.sectionLink}>View all ›</Text>
            </TouchableOpacity>
          </View>
          {latestSets.map((set) => (
            <TouchableOpacity
              key={set.id}
              style={styles.setRow}
              onPress={() => navigation.navigate('SetDetail', { id: set.id })}
              activeOpacity={0.7}
            >
              <View style={styles.setIcon}>
                <Text style={styles.setIconText}>{set.series.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.setName} numberOfLines={1}>
                  {set.name}
                </Text>
                <Text style={styles.setSeries}>{set.series}</Text>
              </View>
              <Text style={styles.setDate}>
                {new Date(set.releaseDate).toLocaleDateString('en-US', {
                  month: 'short',
                  year: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PortfolioTab')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionEmoji}>💼</Text>
          <Text style={styles.actionText}>Portfolio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AlertsTab')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionEmoji}>🔔</Text>
          <Text style={styles.actionText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('SetsTab')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionEmoji}>📦</Text>
          <Text style={styles.actionText}>Sets</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },

  // Hero
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  heroBrand: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.buy,
  },
  liveText: {
    color: colors.buy,
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // Portfolio card
  portfolioCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  portfolioLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  portfolioPill: {
    backgroundColor: 'rgba(127,119,221,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(127,119,221,0.35)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  portfolioPillText: {
    color: colors.primaryLight,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  portfolioValue: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  portfolioChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  portfolioChangePos: {
    color: colors.buy,
    fontSize: fontSize.base,
    fontWeight: '700',
  },
  portfolioChangePct: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  portfolioChart: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing.sm,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statChipLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  statChipValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },

  // Score tile
  scoreTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(244,196,48,0.3)',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  scoreTileLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  scoreTileValue: {
    color: colors.gold,
    fontSize: fontSize['3xl'],
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  scoreTileHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  scoreRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,196,48,0.08)',
  },
  scoreRingText: {
    color: colors.gold,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },

  // Section
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  sectionLink: {
    color: colors.primaryLight,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Product row
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: spacing.md,
  },
  productInfo: { flex: 1 },
  productName: { color: colors.text, fontSize: fontSize.base, fontWeight: '600' },
  productType: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  productSpark: { width: 64, height: 28 },
  productRight: { alignItems: 'flex-end', gap: spacing.xs, minWidth: 60 },
  scoreText: { color: colors.primary, fontSize: fontSize.lg, fontWeight: '800' },

  // Set row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: spacing.md,
  },
  setIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(127,119,221,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setIconText: {
    color: colors.primaryLight,
    fontSize: fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  setName: { color: colors.text, fontSize: fontSize.base, fontWeight: '600' },
  setSeries: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  setDate: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },

  // Quick actions
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  actionEmoji: { fontSize: 26, marginBottom: spacing.sm },
  actionText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
});
