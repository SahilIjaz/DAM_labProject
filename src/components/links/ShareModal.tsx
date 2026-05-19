'use client';

import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataType: string;
  dataId: string;
  dataName?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  dataType,
  dataId,
  dataName = 'Data',
}: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit' | 'comment'>('view');
  const [isPublic, setIsPublic] = useState(false);
  const [maxViews, setMaxViews] = useState<number | null>(null);
  const [expiresIn, setExpiresIn] = useState<string>('none'); // 'none', '1day', '7days', '30days'
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const createShare = async () => {
    setLoading(true);
    try {
      let expiresAt = undefined;
      if (expiresIn !== 'none') {
        const date = new Date();
        if (expiresIn === '1day') date.setDate(date.getDate() + 1);
        if (expiresIn === '7days') date.setDate(date.getDate() + 7);
        if (expiresIn === '30days') date.setDate(date.getDate() + 30);
        expiresAt = date.toISOString();
      }

      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          data_type: dataType,
          data_id: dataId,
          access_level: accessLevel,
          is_public: isPublic,
          max_views: maxViews,
          expires_at: expiresAt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await response.json();
      setShareUrl(data.share_url);
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Share {dataName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {shareUrl ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Share Link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <p className="text-sm text-green-600">✓ Share link created successfully!</p>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Access Level</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="view">View Only</option>
                <option value="comment">View & Comment</option>
                <option value="edit">Edit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expiration</label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="none">Never Expires</option>
                <option value="1day">1 Day</option>
                <option value="7days">7 Days</option>
                <option value="30days">30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Views (Optional)</label>
              <input
                type="number"
                min="1"
                value={maxViews || ''}
                onChange={(e) => setMaxViews(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="public" className="text-sm">
                Public (Anyone with link can access)
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={createShare}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Share Link'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
