import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import { useAlerts, useToggleAlert, useDeleteAlert } from '../hooks/useAlerts';
import { EmptyState } from '../components/EmptyState';
import { LoadingScreen } from '../components/LoadingScreen';

const RETAILER_LABELS: Record<string, string> = {
  pokemon_center: 'Pokemon Center',
  amazon: 'Amazon',
  target: 'Target',
  walmart: 'Walmart',
  best_buy: 'Best Buy',
  all: 'All Retailers',
};

export function AlertsScreen() {
  const navigation = useNavigation<any>();
  const { data: alerts, isLoading, refetch } = useAlerts();
  const toggleAlert = useToggleAlert();
  const deleteAlert = useDeleteAlert();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Alert', `Remove alert for ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteAlert.mutate(id),
      },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  const items = alerts || [];

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
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Alerts</Text>
              <Text style={styles.headerSubtitle}>
                {items.filter((a) => a.isActive).length} active · {items.length} total
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.alertCard, !item.isActive && styles.alertCardPaused]}>
            <View style={styles.alertIcon}>
              <Text style={styles.alertIconText}>🔔</Text>
              <View
                style={[
                  styles.alertStatusDot,
                  { backgroundColor: item.isActive ? colors.buy : colors.watch },
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.alertInfo}
              onPress={() => navigation.navigate('ProductDetail', { id: item.productId })}
              activeOpacity={0.7}
            >
              <Text style={styles.alertName} numberOfLines={1}>
                {item.product.name}
              </Text>
              <View style={styles.alertMetaRow}>
                <Text style={styles.alertRetailer}>
                  {RETAILER_LABELS[item.retailer] || item.retailer}
                </Text>
                {item.product.msrp && (
                  <>
                    <Text style={styles.alertDot}>·</Text>
                    <Text style={styles.alertMsrp}>
                      MSRP ${parseFloat(item.product.msrp).toFixed(2)}
                    </Text>
                  </>
                )}
              </View>
              <View style={styles.alertActions}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    item.isActive ? styles.toggleActive : styles.togglePaused,
                  ]}
                  onPress={() =>
                    toggleAlert.mutate({ id: item.id, isActive: !item.isActive })
                  }
                >
                  <Text
                    style={[
                      styles.toggleText,
                      item.isActive ? styles.toggleTextActive : styles.toggleTextPaused,
                    ]}
                  >
                    {item.isActive ? 'ACTIVE' : 'PAUSED'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id, item.product.name)}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No alerts set up"
            description="Set up restock alerts to get notified when Pokemon TCG products are back in stock."
            actionLabel="Browse Products"
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
  headerTitle: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  alertCardPaused: { opacity: 0.65 },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(127,119,221,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  alertIconText: { fontSize: 20 },
  alertStatusDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  alertInfo: { flex: 1 },
  alertName: { color: colors.text, fontSize: fontSize.base, fontWeight: '700' },
  alertMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  alertRetailer: {
    color: colors.primaryLight,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  alertDot: { color: colors.textMuted, marginHorizontal: spacing.sm, fontSize: fontSize.xs },
  alertMsrp: { color: colors.textMuted, fontSize: fontSize.xs },
  alertActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  toggleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flex: 1,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.35)',
  },
  togglePaused: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
  },
  toggleText: { fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 0.5 },
  toggleTextActive: { color: colors.buy },
  toggleTextPaused: { color: colors.textMuted },
  deleteButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  deleteText: { color: colors.avoid, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
});
