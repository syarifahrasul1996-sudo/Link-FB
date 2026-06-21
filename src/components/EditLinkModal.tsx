import React, { useState } from 'react';
import { FacebookItem } from '../types';
import { X, Save } from 'lucide-react';

interface EditLinkModalProps {
  item: FacebookItem;
  onSave: (id: string, newUrl: string) => void;
  onClose: () => void;
}

export default function EditLinkModal({ item, onSave, onClose }: EditLinkModalProps) {
  const [url, setUrl] = useState(item.targetUrl);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">Edit Link</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-4 truncate">
          Editing: {item.label}
        </p>
        <div className="space-y-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl"
            placeholder="Enter new URL"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(item.id, url)}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
