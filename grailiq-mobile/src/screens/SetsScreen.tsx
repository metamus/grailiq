import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { useSets } from '../hooks/useSets';
import { LoadingScreen } from '../components/LoadingScreen';

export function SetsScreen() {
  const navigation = useNavigation<any>();
  const { data: sets, isLoading, refetch } = useSets();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (!sets) return [];
    const sorted = [...sets].sort(
      (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.series.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
    );
  }, [sets, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sets</Text>
        <Text style={styles.subtitle}>
          {sets?.length ?? 0} tracked · {filtered.length} shown
        </Text>
      </View>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search sets, series, or code..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('SetDetail', { id: item.id })}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>
                {item.code.slice(0, 3).toUpperCase()}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Text style={styles.setName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.isOutOfPrint && (
                  <View style={styles.oopBadge}>
                    <Text style={styles.oopText}>OOP</Text>
                  </View>
                )}
              </View>
              <Text style={styles.series}>{item.series}</Text>
              <View style={styles.cardMetaRow}>
                <Text style={styles.meta}>{item.totalCards} cards</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.meta}>
                  {new Date(item.releaseDate).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'No sets match your search' : 'No sets yet'}
            </Text>
            <Text style={styles.emptyHint}>
              {search ? 'Try a different query' : 'Pull to refresh'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 14, opacity: 0.6 },
  clearIcon: { color: colors.textMuted, fontSize: fontSize.base, padding: spacing.xs },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.base,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(127,119,221,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(127,119,221,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    color: colors.primaryLight,
    fontSize: fontSize.sm,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardBody: { flex: 1 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  setName: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '700',
    flex: 1,
  },
  oopBadge: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  oopText: { color: colors.avoid, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  series: {
    color: colors.primaryLight,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  dot: { color: colors.textMuted, marginHorizontal: spacing.sm, fontSize: fontSize.xs },
  meta: { color: colors.textMuted, fontSize: fontSize.xs },
  chevron: { color: colors.textMuted, fontSize: 24, paddingHorizontal: spacing.sm },
  empty: { padding: spacing['4xl'], alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: '700' },
  emptyHint: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
});
