import { useState } from 'react';
import { X } from 'lucide-react';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emojis = [
    { value: 5, emoji: '😍', label: 'Love it' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 2, emoji: '😞', label: 'Not great' },
    { value: 1, emoji: '🤬', label: 'Hate it' },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          message: message.substring(0, 1000),
          page: window.location.pathname,
        }),
      });

      if (response.ok) {
        setMessage('');
        setRating(null);
        setOpen(false);
      }
    } catch (err) {
      console.error('Feedback submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 z-40 h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-yellow-500 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center text-white font-bold text-lg"
        title="Send feedback"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-6 z-50 w-96 bg-[#12121F] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600/20 to-yellow-500/20 p-4 flex justify-between items-center border-b border-purple-500/30">
        <h3 className="text-white font-semibold">How's GrailIQ working for you?</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Let us know what you think..."
          className="w-full h-24 bg-[#1F1F2E] border border-purple-500/20 rounded-lg p-3 text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:border-purple-500/50"
          maxLength={1000}
        />

        <div className="text-xs text-gray-500">
          {message.length} / 1000
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Rating (optional)</p>
          <div className="flex justify-between gap-2">
            {emojis.map(({ value, emoji, label }) => (
              <button
                key={value}
                onClick={() => setRating(rating === value ? null : value)}
                className={`flex-1 py-2 px-1 rounded-lg transition-colors text-lg ${
                  rating === value
                    ? 'bg-purple-600/40 border border-purple-500'
                    : 'bg-[#1F1F2E] border border-gray-600/30 hover:border-purple-500/50'
                }`}
                title={label}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !message.trim()}
          className="w-full py-2 px-4 bg-gradient-to-r from-yellow-500 to-purple-600 text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
        >
          {submitting ? 'Sending...' : 'Send Feedback'}
        </button>
      </div>
    </div>
  );
}
