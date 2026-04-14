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
      <TextInput
        style={styles.searchInput}
        placeholder="Search sets..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('SetDetail', { id: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.setName} numberOfLines={1}>{item.name}</Text>
              {item.isOutOfPrint && (
                <View style={styles.oopBadge}>
                  <Text style={styles.oopText}>OOP</Text>
                </View>
              )}
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.series}>{item.series}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.meta}>{item.code.toUpperCase()}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.meta}>{item.totalCards} cards</Text>
            </View>
            <Text style={styles.date}>
              {new Date(item.releaseDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {search ? 'No sets match your search' : 'No sets found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    margin: spacing.lg,
    color: colors.text,
    fontSize: fontSize.base,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'] },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  setName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  oopBadge: {
    backgroundColor: '#DC262615',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  oopText: { color: colors.avoid, fontSize: fontSize.xs, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  series: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  dot: { color: colors.textMuted, marginHorizontal: spacing.sm },
  meta: { color: colors.textSecondary, fontSize: fontSize.sm },
  date: { color: colors.textMuted, fontSize: fontSize.xs },
  empty: { padding: spacing['3xl'], alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.base },
});
