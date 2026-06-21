// components/SettingsPanel.tsx
import React, { useState } from 'react';
import { TabConfig } from '../types';
import { Settings, RefreshCw, Sliders, FileSpreadsheet, X, HelpCircle, Save, Check, Plus, Trash2 } from 'lucide-react';

interface SettingsPanelProps {
  currentUrl: string;
  currentTabs: TabConfig[];
  onSave: (url: string, tabs: TabConfig[]) => void;
  onResetToDefault: () => void;
  onClose: () => void;
}

export default function SettingsPanel({
  currentUrl,
  currentTabs,
  onSave,
  onResetToDefault,
  onClose,
}: SettingsPanelProps) {
  const [url, setUrl] = useState(currentUrl);
  const [tabs, setTabs] = useState<TabConfig[]>(() => currentTabs.map(t => ({ ...t })));
  const [isSaved, setIsSaved] = useState(false);

  const handleTabChange = (index: number, field: keyof TabConfig, value: string) => {
    const updated = [...tabs];
    updated[index] = { ...updated[index], [field]: value };
    setTabs(updated);
  };

  const handleAddTab = () => {
    const newId = `acc-${Date.now()}`;
    setTabs([...tabs, { id: newId, name: `Account ${tabs.length + 1}`, gid: '0' }]);
  };

  const handleRemoveTab = (index: number) => {
    if (tabs.length <= 1) {
      alert("You must keep at least one account/tab active!");
      return;
    }
    const updated = tabs.filter((_, idx) => idx !== index);
    setTabs(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(url, tabs);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/55 p-6 relative overflow-hidden transition-all">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-slate-800">App Setup & Configuration</h3>
            <p className="text-xs text-slate-500">Configure your Google Sheet sync settings</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
          title="Close Settings"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Google Sheet URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 uppercase tracking-wide">
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
            Google Sheet URL or ID
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
            placeholder="Paste public Google Sheet URL or ID..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 flex items-start gap-2 border border-slate-100 leading-relaxed">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-slate-700">How to Share & Connect Your Sheet:</span>
              <ol className="list-decimal pl-4 mt-1 space-y-1">
                <li>In Google Sheets, click <span className="font-semibold">Share</span> &gt; Change General Access to <span className="font-semibold">"Anyone with the link can view"</span>.</li>
                <li>Make sure your spreadsheet columns exactly match: <span className="font-semibold">Column A</span>: Label, <span className="font-semibold">Column B</span>: My group (Community), <span className="font-semibold">Column C</span>: My group posts, <span className="font-semibold">Column D</span>: Direct Post Tasks.</li>
                <li>Copy the URL from the browser address bar and paste it above!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Tab Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 uppercase tracking-wide">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              Tab & Account Settings ({tabs.length} {tabs.length === 1 ? 'Tab' : 'Tabs'})
            </label>
          </div>
          
          <div className="grid gap-3.5">
            {tabs.map((tab, idx) => (
              <div
                key={tab.id}
                className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 flex flex-col gap-3 relative"
              >
                {/* Header for individual config card to allow deletion */}
                <div className="flex justify-between items-center border-b border-slate-250/20 pb-2 mb-1">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                    Account/Tab {idx + 1}
                  </span>
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTab(idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                      title="Remove Account Tab"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                      Account/Tab Name
                    </span>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      placeholder="e.g. Zahir Ahmad (Account 1)"
                      value={tab.name}
                      onChange={(e) => handleTabChange(idx, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                      Sheet GID in URL (&gid=...)
                    </span>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                      placeholder="e.g. 0, 18239012"
                      value={tab.gid}
                      onChange={(e) => handleTabChange(idx, 'gid', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddTab}
              className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-dashed border-slate-200 hover:border-blue-500/60 bg-white/50 hover:bg-blue-50/10 text-slate-500 hover:text-blue-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Another Account / Tab GID
            </button>
          </div>
        </div>

        {/* Form CTA Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3.5">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all values back to Zahir, Huda, and Alif fallbacks?')) {
                onResetToDefault();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to Sample Accounts
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-sm ${
                isSaved
                  ? 'bg-blue-600 hover:bg-blue-600'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Configuration Saved!
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Setup
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
