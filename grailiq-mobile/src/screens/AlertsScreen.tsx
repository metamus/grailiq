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
              <Text style={styles.headerTitle}>Restock Alerts</Text>
              <Text style={styles.headerSubtitle}>
                Get notified when products are back in stock at your favorite retailers.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.alertCard}>
            <TouchableOpacity
              style={styles.alertInfo}
              onPress={() => navigation.navigate('ProductDetail', { id: item.productId })}
            >
              <Text style={styles.alertName} numberOfLines={1}>
                {item.product.name}
              </Text>
              <Text style={styles.alertRetailer}>
                {RETAILER_LABELS[item.retailer] || item.retailer}
              </Text>
              {item.product.msrp && (
                <Text style={styles.alertMsrp}>
                  MSRP ${parseFloat(item.product.msrp).toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>
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
                  {item.isActive ? 'Active' : 'Paused'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id, item.product.name)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
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
  header: { marginBottom: spacing.xl },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  alertInfo: { marginBottom: spacing.md },
  alertName: { color: colors.text, fontSize: fontSize.base, fontWeight: '600' },
  alertRetailer: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: 4,
  },
  alertMsrp: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  alertActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flex: 1,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: '#05966920' },
  togglePaused: { backgroundColor: colors.surfaceLight },
  toggleText: { fontSize: fontSize.sm, fontWeight: '600' },
  toggleTextActive: { color: colors.buy },
  toggleTextPaused: { color: colors.textMuted },
  deleteButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#DC262610',
  },
  deleteText: { color: colors.avoid, fontSize: fontSize.sm, fontWeight: '600' },
});
