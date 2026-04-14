import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAddPortfolioItem } from '@/hooks/usePortfolio';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';
import { Package, DollarSign, Hash, Calendar, ShoppingBag, StickyNote, CheckCircle } from 'lucide-react';

interface AddToPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  currentPrice?: number | null;
}

const sourceOptions = [
  { value: '', label: 'Select source...' },
  { value: 'pokemon_center', label: 'Pokemon Center' },
  { value: 'tcgplayer', label: 'TCGPlayer' },
  { value: 'ebay', label: 'eBay' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'target', label: 'Target' },
  { value: 'walmart', label: 'Walmart' },
  { value: 'best_buy', label: 'Best Buy' },
  { value: 'lcs', label: 'Local Card Shop' },
  { value: 'other', label: 'Other' },
];

/** Modal for adding a product to the user's portfolio */
export function AddToPortfolioModal({ isOpen, onClose, product, currentPrice }: AddToPortfolioModalProps) {
  const addItem = useAddPortfolioItem();
  const [success, setSuccess] = useState(false);

  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState(
    currentPrice ? currentPrice.toFixed(2) : product.msrp ? parseFloat(product.msrp).toFixed(2) : '',
  );
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');

  const totalCost = (parseFloat(purchasePrice || '0') * parseInt(quantity || '0', 10)) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchasePrice || !quantity) return;

    await addItem.mutateAsync({
      productId: product.id,
      quantity: parseInt(quantity, 10),
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate: purchaseDate || undefined,
      source: source || undefined,
      notes: notes || undefined,
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      // Reset form
      setQuantity('1');
      setPurchasePrice(currentPrice ? currentPrice.toFixed(2) : product.msrp ? parseFloat(product.msrp).toFixed(2) : '');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setSource('');
      setNotes('');
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Portfolio">
      {success ? (
        <div className="flex flex-col items-center py-8">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900">Added to Portfolio!</p>
          <p className="text-sm text-gray-500 mt-1">
            {quantity}x {product.name}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Summary */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="h-10 w-10 rounded-lg bg-grailiq-purple/10 flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 text-grailiq-purple" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
              <p className="text-xs text-gray-500">
                MSRP {formatPrice(product.msrp)} {currentPrice ? `· Market ${formatPrice(currentPrice)}` : ''}
              </p>
            </div>
          </div>

          {/* Quantity + Price Row */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              min="1"
              max="999"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              icon={<Hash className="h-4 w-4" />}
              required
            />
            <Input
              label="Purchase Price"
              type="number"
              step="0.01"
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              icon={<DollarSign className="h-4 w-4" />}
              placeholder="0.00"
              required
            />
          </div>

          {/* Total cost */}
          {totalCost > 0 && (
            <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-grailiq-purple/5 border border-grailiq-purple/10">
              <span className="text-xs text-gray-500 font-medium">Total Cost</span>
              <span className="text-sm font-bold text-grailiq-purple">{formatPrice(totalCost)}</span>
            </div>
          )}

          {/* Date */}
          <Input
            label="Purchase Date"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            icon={<Calendar className="h-4 w-4" />}
          />

          {/* Source */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Purchase Source</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm shadow-sm focus:border-grailiq-purple focus:ring-1 focus:ring-grailiq-purple focus:outline-none appearance-none bg-white"
              >
                {sourceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 text-gray-400">
                <StickyNote className="h-4 w-4" />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="e.g. Sealed, mint condition"
                className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm shadow-sm focus:border-grailiq-purple focus:ring-1 focus:ring-grailiq-purple focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={addItem.isPending} className="flex-1">
              Add to Portfolio
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
