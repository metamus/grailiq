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
import { StatCard } from '../components/StatCard';
import { SignalBadge } from '../components/SignalBadge';
import { LoadingScreen } from '../components/LoadingScreen';

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
  const avgScore =
    products && products.length > 0
      ? (
          products.reduce((sum, p) => sum + parseFloat(p.grailiqScore || '0'), 0) /
          products.length
        ).toFixed(1)
      : '—';

  const topProducts = [...(products || [])]
    .filter((p) => p.grailiqScore)
    .sort((a, b) => parseFloat(b.grailiqScore || '0') - parseFloat(a.grailiqScore || '0'))
    .slice(0, 5);

  const latestSets = [...(sets || [])]
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>GrailIQ</Text>
        <Text style={styles.heroSubtitle}>
          Pokemon TCG sealed product price intelligence
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard label="Sets" value={String(sets?.length ?? 0)} />
        <StatCard label="Products" value={String(products?.length ?? 0)} />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Buy Signals" value={String(buySignals)} valueColor={colors.buy} />
        <StatCard label="Avg Score" value={avgScore} valueColor={colors.primary} />
      </View>

      {/* Top Rated Products */}
      {topProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Rated Products</Text>
          {topProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productRow}
              onPress={() => navigation.navigate('ProductDetail', { id: product.id })}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.productType}>
                  {product.type.replace(/_/g, ' ')}
                </Text>
              </View>
              <View style={styles.productRight}>
                <Text style={styles.scoreText}>{product.grailiqScore}</Text>
                <SignalBadge signal={product.investmentSignal} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Latest Sets */}
      {latestSets.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Sets</Text>
          {latestSets.map((set) => (
            <TouchableOpacity
              key={set.id}
              style={styles.setRow}
              onPress={() => navigation.navigate('SetDetail', { id: set.id })}
            >
              <View>
                <Text style={styles.setName} numberOfLines={1}>{set.name}</Text>
                <Text style={styles.setSeries}>{set.series}</Text>
              </View>
              <Text style={styles.setDate}>
                {new Date(set.releaseDate).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
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
        >
          <Text style={styles.actionEmoji}>💼</Text>
          <Text style={styles.actionText}>Portfolio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AlertsTab')}
        >
          <Text style={styles.actionEmoji}>🔔</Text>
          <Text style={styles.actionText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('SetsTab')}
        >
          <Text style={styles.actionEmoji}>📦</Text>
          <Text style={styles.actionText}>Browse Sets</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  hero: { marginBottom: spacing['2xl'], paddingTop: spacing.lg },
  heroTitle: {
    color: colors.primary,
    fontSize: fontSize['4xl'],
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productInfo: { flex: 1, marginRight: spacing.md },
  productName: { color: colors.text, fontSize: fontSize.base, fontWeight: '600' },
  productType: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  productRight: { alignItems: 'flex-end', gap: spacing.xs },
  scoreText: { color: colors.primary, fontSize: fontSize.lg, fontWeight: '700' },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setName: { color: colors.text, fontSize: fontSize.base, fontWeight: '600', maxWidth: 220 },
  setSeries: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  setDate: { color: colors.textSecondary, fontSize: fontSize.sm },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing['2xl'],
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  actionEmoji: { fontSize: 24, marginBottom: spacing.sm },
  actionText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
});
