import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCreateAlert } from '@/hooks/useAlerts';
import type { Product } from '@/types';
import { Bell, CheckCircle, Store } from 'lucide-react';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const retailers = [
  { value: 'all', label: 'All Retailers', description: 'Get notified from any retailer' },
  { value: 'pokemon_center', label: 'Pokemon Center', description: 'Official Pokemon store' },
  { value: 'amazon', label: 'Amazon', description: 'Amazon marketplace' },
  { value: 'target', label: 'Target', description: 'Target stores & online' },
  { value: 'walmart', label: 'Walmart', description: 'Walmart stores & online' },
  { value: 'best_buy', label: 'Best Buy', description: 'Best Buy stores & online' },
];

/** Modal for creating a restock alert on a product */
export function CreateAlertModal({ isOpen, onClose, product }: CreateAlertModalProps) {
  const createAlert = useCreateAlert();
  const [selectedRetailer, setSelectedRetailer] = useState('all');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createAlert.mutateAsync({
      productId: product.id,
      retailer: selectedRetailer,
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSelectedRetailer('all');
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Restock Alert">
      {success ? (
        <div className="flex flex-col items-center py-8">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-amber-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900">Alert Created!</p>
          <p className="text-sm text-gray-500 mt-1 text-center">
            You'll be notified when <strong>{product.name}</strong> restocks.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Summary */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
              <p className="text-xs text-gray-500">Get notified when this product is back in stock</p>
            </div>
          </div>

          {/* Retailer Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Monitor Retailer</label>
            <div className="space-y-2">
              {retailers.map((retailer) => (
                <label
                  key={retailer.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedRetailer === retailer.value
                      ? 'border-grailiq-purple bg-grailiq-purple/5 ring-1 ring-grailiq-purple/20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="retailer"
                    value={retailer.value}
                    checked={selectedRetailer === retailer.value}
                    onChange={() => setSelectedRetailer(retailer.value)}
                    className="sr-only"
                  />
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedRetailer === retailer.value ? 'bg-grailiq-purple/15' : 'bg-gray-100'
                  }`}>
                    <Store className={`h-4 w-4 ${
                      selectedRetailer === retailer.value ? 'text-grailiq-purple' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${
                      selectedRetailer === retailer.value ? 'text-grailiq-purple' : 'text-gray-900'
                    }`}>
                      {retailer.label}
                    </p>
                    <p className="text-xs text-gray-500">{retailer.description}</p>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedRetailer === retailer.value
                      ? 'border-grailiq-purple'
                      : 'border-gray-300'
                  }`}>
                    {selectedRetailer === retailer.value && (
                      <div className="h-2 w-2 rounded-full bg-grailiq-purple" />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Info callout */}
          <div className="flex gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <Bell className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              You'll receive an email notification when this product becomes available.
              Free tier includes up to 3 active alerts.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createAlert.isPending} className="flex-1">
              Create Alert
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
