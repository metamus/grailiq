import { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { useProducts } from '../hooks/useProducts';
import { Sparkline } from '../components/Sparkline';
import { generateTrend, signalToBias, signalToColor } from '../utils/sparkData';
import { LoadingScreen } from '../components/LoadingScreen';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import type { Product } from '../types';

const typeLabels: Record<string, string> = {
  booster_box: 'Booster Box',
  etb: 'Elite Trainer Box',
  booster_pack: 'Booster Pack',
  collection_box: 'Collection Box',
  blister_pack: 'Blister Pack',
  tin: 'Tin',
  premium_collection: 'Premium Collection',
  other: 'Other',
};

const signalColors: Record<string, string> = {
  buy: colors.buy,
  hold: colors.hold,
  watch: colors.textSecondary,
  avoid: colors.avoid,
};

/**
 * Mobile Compare screen — picks up to 3 products and shows score / signal /
 * price side-by-side. Horizontal ScrollView because 3 full cards don't fit
 * on a phone in portrait.
 */
export function CompareScreen() {
  const { data: products, isLoading } = useProducts();
  const [selected, setSelected] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const chosen = useMemo<Product[]>(() => {
    if (!products) return [];
    return selected
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
  }, [products, selected]);

  const candidates = useMemo(() => {
    if (!products) return [];
    const taken = new Set(selected);
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !taken.has(p.id))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .slice(0, 20);
  }, [products, selected, query]);

  const best = chosen.reduce<Product | null>((acc, p) => {
    if (!p.grailiqScore) return acc;
    if (!acc || !acc.grailiqScore) return p;
    return parseFloat(p.grailiqScore) > parseFloat(acc.grailiqScore) ? p : acc;
  }, null);

  if (isLoading) return <LoadingScreen />;

  const add = (id: string) => {
    if (selected.length < 3 && !selected.includes(id)) {
      setSelected([...selected, id]);
    }
    setPickerOpen(false);
    setQuery('');
  };

  const remove = (id: string) => setSelected(selected.filter((x) => x !== id));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.heroCard}>
        <Text style={styles.heroBadge}>⚖  SIDE-BY-SIDE COMPARE</Text>
        <Text style={styles.heroTitle}>Stack them up</Text>
        <Text style={styles.heroSub}>
          Pick up to 3 products and compare score + signal + price.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.columnScroll}
      >
        {[0, 1, 2].map((slot) => {
          const p = chosen[slot];
          if (!p) {
            return (
              <TouchableOpacity
                key={slot}
                style={styles.emptyColumn}
                onPress={() => setPickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyPlus}>＋</Text>
                <Text style={styles.emptyText}>Add product</Text>
                <Text style={styles.emptySub}>Slot {slot + 1}</Text>
              </TouchableOpacity>
            );
          }
          return <Column key={p.id} product={p} isBest={best?.id === p.id && chosen.length > 1} onRemove={() => remove(p.id)} />;
        })}
      </ScrollView>

      <Modal transparent visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <TextInput
              placeholder="Search products…"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              autoFocus
            />
            <FlatList
              data={candidates}
              keyExtractor={(i) => i.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerRow} onPress={() => add(item.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.pickerMeta}>
                      {typeLabels[item.type] || item.type}
                      {item.msrp ? ` · MSRP $${item.msrp}` : ''}
                    </Text>
                  </View>
                  {item.grailiqScore && (
                    <Text style={styles.pickerScore}>{item.grailiqScore}</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyList}>No matches</Text>}
            />
            <TouchableOpacity onPress={() => setPickerOpen(false)} style={styles.cancelRow}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Column({ product, isBest, onRemove }: { product: Product; isBest: boolean; onRemove: () => void }) {
  const bias = signalToBias(product.investmentSignal);
  const color = signalToColor(product.investmentSignal);
  const points = generateTrend(product.id, bias, 20);
  const signalColor = product.investmentSignal ? signalColors[product.investmentSignal] : colors.textMuted;

  return (
    <View style={[styles.column, isBest && styles.bestColumn]}>
      {isBest && <Text style={styles.bestBadge}>🏆 HIGHEST SCORE</Text>}
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.columnType}>{typeLabels[product.type] || product.type}</Text>
      <Text style={styles.columnName} numberOfLines={3}>
        {product.name}
      </Text>

      <View style={{ marginVertical: spacing.md }}>
        <Sparkline points={points} color={color} width={210} height={40} />
      </View>

      <Row label="Score" value={product.grailiqScore ?? '—'} big />
      <Row
        label="Signal"
        value={product.investmentSignal ? product.investmentSignal.toUpperCase() : '—'}
        valueColor={signalColor}
      />
      <Row label="MSRP" value={product.msrp ? `$${product.msrp}` : '—'} />
    </View>
  );
}

function Row({ label, value, valueColor, big }: { label: string; value: string; valueColor?: string; big?: boolean }) {
  return (
    <View style={styles.rowLine}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, big && styles.rowValueBig, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBadge: { color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  heroTitle: { color: colors.text, fontSize: fontSize['2xl'], fontWeight: '800', marginTop: 4 },
  heroSub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4 },
  columnScroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  column: {
    width: 240,
    marginRight: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  bestColumn: {
    borderColor: colors.gold + '66',
  },
  bestBadge: {
    position: 'absolute',
    top: -10,
    left: spacing.md,
    backgroundColor: colors.gold,
    color: colors.background,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  removeButton: { position: 'absolute', top: spacing.sm, right: spacing.sm, padding: 6 },
  removeText: { color: colors.textMuted, fontSize: 18 },
  columnType: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  columnName: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '700',
    marginTop: 4,
    minHeight: 40,
  },
  rowLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  rowLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' },
  rowValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  rowValueBig: { fontSize: fontSize.xl, color: colors.primaryLight },

  emptyColumn: {
    width: 240,
    marginRight: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.overlay05,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
  },
  emptyPlus: { color: colors.textMuted, fontSize: 36, fontWeight: '300' },
  emptyText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700', marginTop: 4 },
  emptySub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  searchInput: {
    backgroundColor: colors.overlay05,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  pickerMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 3 },
  pickerScore: { color: colors.primaryLight, fontSize: fontSize.base, fontWeight: '800' },
  emptyList: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
  cancelRow: { padding: spacing.md, alignItems: 'center' },
  cancelText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '700' },
});
