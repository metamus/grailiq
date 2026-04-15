import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Trash2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

interface AccountData {
  displayName: string;
  email: string;
  stripeCustomerId: string;
  subscriptionStatus: string;
}

const notificationMethods = [
  { id: 'email', label: 'Email' },
  { id: 'push', label: 'Push Notifications' },
];

export default function Account() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    quietHours: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  useEffect(() => {
    loadAccount();
  }, [user]);

  const loadAccount = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('users')
        .select('displayName, email, stripeCustomerId, subscriptionStatus')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setAccount(data);
      setDisplayName(data.displayName || '');
    } catch (err) {
      console.error('Failed to load account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      if (!user?.id) return;
      const { error } = await supabase
        .from('users')
        .update({ displayName })
        .eq('id', user.id);

      if (error) throw error;
      setAccount(prev => prev ? { ...prev, displayName } : null);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      if (!account?.stripeCustomerId) return;
      const response = await fetch('/api/v1/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: account.stripeCustomerId }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Failed to open billing portal:', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmed) {
      setShowDeleteConfirm(false);
      return;
    }

    try {
      setSaving(true);
      if (!user?.id) return;
      const response = await fetch('/api/v1/me', { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');

      await supabase.auth.signOut();
      navigate('/sign-in');
    } catch (err) {
      console.error('Failed to delete account:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading account...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-grailiq-gold-light" />
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
      </div>

      {/* Profile */}
      <div className="bg-grailiq-dark border border-white/10 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Profile</h2>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 bg-grailiq-ink border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-grailiq-gold/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <input
            type="email"
            value={account?.email || ''}
            readOnly
            className="w-full px-4 py-2 bg-grailiq-ink border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-2">To change email, contact support@grailiq.com</p>
        </div>
        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          className="bg-grailiq-gold-light hover:bg-grailiq-gold text-black"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Notifications */}
      <div className="bg-grailiq-dark border border-white/10 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Notifications</h2>
        <div className="space-y-3">
          {notificationMethods.map(method => (
            <label key={method.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationPrefs[method.id as keyof typeof notificationPrefs]}
                onChange={e =>
                  setNotificationPrefs(prev => ({
                    ...prev,
                    [method.id]: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">{method.label}</span>
            </label>
          ))}
        </div>
        <label className="flex items-center gap-3 cursor-pointer mt-4">
          <input
            type="checkbox"
            checked={notificationPrefs.quietHours}
            onChange={e =>
              setNotificationPrefs(prev => ({
                ...prev,
                quietHours: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-white">Quiet hours (11 PM - 8 AM)</span>
        </label>
      </div>

      {/* Subscription */}
      <div className="bg-grailiq-dark border border-white/10 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Subscription</h2>
        <div>
          <p className="text-sm text-gray-400 mb-2">Status: <span className="text-grailiq-gold-light capitalize font-semibold">{account?.subscriptionStatus || 'Free'}</span></p>
        </div>
        {account?.subscriptionStatus && account.subscriptionStatus !== 'free' && (
          <Button
            onClick={handleManageSubscription}
            variant="outline"
            className="text-white border-white/20 hover:bg-white/5"
          >
            Manage Subscription
          </Button>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-300 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Danger Zone
        </h2>
        <p className="text-sm text-gray-400">
          Deleting your account is permanent and cannot be undone. All data will be lost.
        </p>
        <Button
          onClick={() => {
            setShowDeleteConfirm(true);
            setDeleteConfirmed(false);
          }}
          variant="outline"
          className="text-red-400 border-red-900/50 hover:bg-red-950/30"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-grailiq-dark border border-red-900/50 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-xl font-bold text-red-400">Delete Account?</h3>
            <p className="text-sm text-gray-400">
              This will permanently delete your account, portfolio, watchlist, and all associated data. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="confirm-delete"
                checked={deleteConfirmed}
                onChange={e => setDeleteConfirmed(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="confirm-delete" className="text-sm text-gray-300">
                I understand this is permanent
              </label>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 text-white border-white/20 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={!deleteConfirmed || saving}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
