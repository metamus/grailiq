import { useNavigation } from '@react-navigation/native';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  useWatchlist,
  useRemoveWatch,
  type WatchlistEntry,
} from '../hooks/useWatchlist';
import { Sparkline } from '../components/Sparkline';
import { generateTrend, signalToBias, signalToColor } from '../utils/sparkData';
import { EmptyState } from '../components/EmptyState';
import { LoadingScreen } from '../components/LoadingScreen';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

const typeIcons: Record<string, string> = {
  booster_box: '📦',
  etb: '🎯',
  booster_pack: '🃏',
  collection_box: '🎁',
  blister_pack: '💎',
  tin: '🥫',
  premium_collection: '👑',
  other: '📋',
};

const signalColors: Record<string, { bg: string; border: string; text: string }> = {
  buy: { bg: colors.buy + '22', border: colors.buy + '55', text: colors.buy },
  hold: { bg: colors.hold + '22', border: colors.hold + '55', text: colors.hold },
  watch: { bg: colors.watch + '22', border: colors.watch + '55', text: colors.textSecondary },
  avoid: { bg: colors.avoid + '22', border: colors.avoid + '55', text: colors.avoid },
};

export function WatchlistScreen() {
  const nav = useNavigation<any>();
  const { data, isLoading, refetch, isRefetching } = useWatchlist();
  const remove = useRemoveWatch();

  if (isLoading) return <LoadingScreen />;

  const items = data ?? [];

  const confirmRemove = (entry: WatchlistEntry) => {
    Alert.alert('Remove from watchlist?', entry.product.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => remove.mutate(entry.id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: WatchlistEntry }) => {
    const { product } = item;
    const bias = signalToBias(product.investmentSignal);
    const color = signalToColor(product.investmentSignal);
    const points = generateTrend(product.id, bias, 14);
    const sig = product.investmentSignal;
    const sigStyle = sig ? signalColors[sig] : null;
    const targetPrice = item.targetPrice ? parseFloat(item.targetPrice) : null;
    const atTarget =
      targetPrice !== null && item.currentPrice !== null && item.currentPrice <= targetPrice;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => nav.navigate('ProductDetail', { productId: product.id })}
        onLongPress={() => confirmRemove(item)}
      >
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{typeIcons[product.type] || '📋'}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={styles.metaRow}>
            {targetPrice !== null && (
              <Text
                style={[
                  styles.meta,
                  atTarget && { color: colors.buy, fontWeight: '700' },
                ]}
              >
                {atTarget ? '🎯 Hit target' : `Target $${targetPrice.toFixed(2)}`}
              </Text>
            )}
            {sigStyle && (
              <View
                style={[
                  styles.signalBadge,
                  { backgroundColor: sigStyle.bg, borderColor: sigStyle.border },
                ]}
              >
                <Text style={[styles.signalText, { color: sigStyle.text }]}>
                  {sig?.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.rightCol}>
          <Sparkline points={points} color={color} width={60} height={22} />
          {item.currentPrice !== null && (
            <Text style={styles.priceNow}>${item.currentPrice.toFixed(2)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={renderItem}
      contentContainerStyle={[styles.container, items.length === 0 && { flexGrow: 1 }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        items.length > 0 ? (
          <Text style={styles.subtitle}>
            {items.length} product{items.length === 1 ? '' : 's'} tracked · long-press to remove
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          title="Nothing on your watchlist"
          description="Tap the heart on a product to save it for later without logging a purchase."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.overlay05,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  name: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  signalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  signalText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priceNow: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
