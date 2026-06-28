// App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { TabConfig, FacebookItem, AccountProgress, DiagnosticInfo } from './types';
import { DEFAULT_SHEET_URL, DEFAULT_TABS, MOCK_DATA_BY_TAB } from './mockData';
import { parseCSV, getGoogleSheetDownloadUrl, transformRowsToItems } from './utils/sheetParser';
import { getMalaysiaDateString, getMsUntilMalaysiaMidnight, formatMillisecondsToCountdown } from './utils/timezone';
import FBItemCard from './components/FBItemCard';
import EditLinkModal from './components/EditLinkModal';
import SettingsPanel from './components/SettingsPanel';
// import DiagnosticPanel from './components/DiagnosticPanel';
import CollapsibleSection from './components/CollapsibleSection';
import { motion, AnimatePresence } from 'motion/react';

import {
  Search,
  Settings,
  RefreshCw,
  Clock,
  Facebook,
  Database,
  Link,
  ChevronDown,
  Info,
  Smartphone,
  Check,
  AlertCircle,
  HelpCircle,
  Bookmark,
  FileText,
  Users
} from 'lucide-react';

/* 
========================================================================
DEVELOPER CONFIGURATION NOTES (FOR CUSTOMIZATION):
1. To change the DEFAULT spreadsheet, replace DEFAULT_SHEET_URL below or in mockData.ts
2. To change the DEFAULT tabs/gids, replace DEFAULT_TABS structure below or in mockData.ts
========================================================================
*/

export default function App() {
  // --- Persisted State variables ---
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem('fb_link_manager_sheet_url') || DEFAULT_SHEET_URL;
  });

  const [tabs, setTabs] = useState<TabConfig[]>(() => {
    const raw = localStorage.getItem('fb_link_manager_tabs');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Automatic migration from older placeholder configurations or if they have the old default GID
        const hasOldGid = parsed.some((t: any) => t.gid === '1855620942' || t.gid === '0' || t.gid === '928475201');
        if (hasOldGid) {
          localStorage.setItem('fb_link_manager_tabs', JSON.stringify(DEFAULT_TABS));
          return DEFAULT_TABS;
        }
        return parsed;
      } catch (e) {
        return DEFAULT_TABS;
      }
    }
    return DEFAULT_TABS;
  });

  const [selectedTabId, setSelectedTabId] = useState<string>(() => {
    return localStorage.getItem('fb_link_manager_selected_tab_id') || 'acc-1';
  });

  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    const raw = localStorage.getItem('fb_link_manager_completed_ids');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  });

  const [everCompletedIds, setEverCompletedIds] = useState<Set<string>>(() => {
    const raw = localStorage.getItem('fb_link_manager_ever_completed_ids');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  });

  const deepLinkMode = false;

  // --- UI/UX State variables ---
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Current Malaysia Date for display
  const [malaysiaDateStr, setMalaysiaDateStr] = useState(getMalaysiaDateString());

  // Cached spreadsheet parsed data
  const [liveTabItems, setLiveTabItems] = useState<Record<string, FacebookItem[]>>({});
  const [editingItem, setEditingItem] = useState<FacebookItem | null>(null);

  // State for one-by-one deleted items
  const [deletedItemIds, setDeletedItemIds] = useState<Set<string>>(() => {
    const raw = localStorage.getItem('fb_link_manager_deleted_ids');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  });

  const handleDeleteItem = (id: string) => {
    const nextDeleted = new Set(deletedItemIds);
    nextDeleted.add(id);
    setDeletedItemIds(nextDeleted);
    localStorage.setItem('fb_link_manager_deleted_ids', JSON.stringify(Array.from(nextDeleted)));
  };

  const handleRestoreDeleted = () => {
    setDeletedItemIds(new Set());
    localStorage.removeItem('fb_link_manager_deleted_ids');
  };
  
  const [urlOverrides, setUrlOverrides] = useState<Record<string, string>>(() => {
    const raw = localStorage.getItem('fb_link_manager_url_overrides');
    return raw ? JSON.parse(raw) : {};
  });

  const handleEdit = (item: FacebookItem) => {
    setEditingItem(item);
  };
  
  const handleSaveOverride = (id: string, newUrl: string) => {
    const nextOverrides = { ...urlOverrides, [id]: newUrl };
    setUrlOverrides(nextOverrides);
    localStorage.setItem('fb_link_manager_url_overrides', JSON.stringify(nextOverrides));
    setEditingItem(null);
  };

  // Helper to chunk lists of items into groups of 25
  const getSectionChunks = (items: FacebookItem[], categoryKey: string, everCompletedIds: Set<string>) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += 25) {
      const chunkItems = items.slice(i, i + 25);
      const sectionIndex = Math.floor(i / 25) + 1;
      const key = `${categoryKey}_sec_${sectionIndex}`;
      
      // A chunk is considered fully completed if ALL its items are in everCompletedIds
      const isFullyCompleted = chunkItems.every(item => everCompletedIds.has(item.id));
      
      chunks.push({
        key,
        sectionIndex,
        items: chunkItems,
        startIndex: i + 1,
        endIndex: Math.min(i + 25, items.length),
        isFullyCompleted
      });
    }

    // Sort chunks: uncompleted first, fully completed last. 
    // Otherwise maintain their original section order.
    chunks.sort((a, b) => {
      if (a.isFullyCompleted !== b.isFullyCompleted) {
        return a.isFullyCompleted ? 1 : -1;
      }
      return a.sectionIndex - b.sectionIndex;
    });

    return chunks;
  };

  // Mobile column active tab state
  const [activeMobileColumn, setActiveMobileColumn] = useState<'specific' | 'my_post' | 'group'>('specific');

  // Multi-dropdown handler to close custom select on document click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleDocumentClick = () => {
      setDropdownOpen(false);
    };
    window.addEventListener('click', handleDocumentClick);
    return () => {
      window.removeEventListener('click', handleDocumentClick);
    };
  }, [dropdownOpen]);

  // --- Clock display timer and Automated Reset triggers ---
  useEffect(() => {
    const timer = setInterval(() => {
      const tdMalaysia = getMalaysiaDateString();
      setMalaysiaDateStr(tdMalaysia);
      
      // Check for midnight rollover to reset checkmarks
      const storedResetDate = localStorage.getItem('fb_link_manager_last_reset_date');
      if (storedResetDate && storedResetDate !== tdMalaysia) {
        // Midnight Malaysia Time hit! Reset completed items (checkmarks).
        // BUT we keep everCompletedIds so they stay at the bottom.
        setCompletedIds(new Set());
        localStorage.setItem('fb_link_manager_completed_ids', JSON.stringify([]));
        localStorage.setItem('fb_link_manager_last_reset_date', tdMalaysia);
      } else if (!storedResetDate) {
        localStorage.setItem('fb_link_manager_last_reset_date', tdMalaysia);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // --- Save / Fetch Handlers ---
  const saveCompletedIdsToStorage = (updatedSet: Set<string>) => {
    localStorage.setItem('fb_link_manager_completed_ids', JSON.stringify(Array.from(updatedSet)));
  };

  const saveEverCompletedIdsToStorage = (updatedSet: Set<string>) => {
    localStorage.setItem('fb_link_manager_ever_completed_ids', JSON.stringify(Array.from(updatedSet)));
  };

  // Persist direct preferences and selections
  useEffect(() => {
    localStorage.setItem('fb_link_manager_selected_tab_id', selectedTabId);
  }, [selectedTabId]);

  // Handle auto-correction when current tab is deleted or not found in tabs array
  useEffect(() => {
    if (tabs.length > 0) {
      const exists = tabs.some((tab) => tab.id === selectedTabId);
      if (!exists) {
        setSelectedTabId(tabs[0].id);
      }
    }
  }, [tabs, selectedTabId]);

  // Download Google Sheet CSV for the currently active tabs
  const fetchGoogleSheetData = async (targetTabs = tabs, targetUrl = sheetUrl) => {
    setLoading(true);
    setErrorMsg(null);
    
    try {
      const newTabItemsMap: Record<string, FacebookItem[]> = {};

      // Fetch all three tabs concurrently to render complete stats and switch tab smoothly
      await Promise.all(
        targetTabs.map(async (tab) => {
          const downloadUrl = getGoogleSheetDownloadUrl(targetUrl, tab.gid);

          try {
            const response = await fetch(downloadUrl);
            
            if (!response.ok) {
              const errorText = `Google Sheets servers responded with error (${response.status}: ${response.statusText || 'Bad Request'}).`;
              console.warn(`${errorText} on Tab "${tab.name}".`);
              
              newTabItemsMap[tab.id] = [];
              return;
            }
            
            const csvText = await response.text();
            
            // Check for HTML characteristics
            const lowerText = csvText.trim().toLowerCase();
            const isHtml = lowerText.startsWith('<!doctype html') || 
                           lowerText.includes('<html') || 
                           lowerText.includes('<head') || 
                           lowerText.includes('<body') || 
                           lowerText.includes('google-site-verification') ||
                           lowerText.includes('google accounts') ||
                           lowerText.includes('login') ||
                           lowerText.includes('signing in');
            
            if (isHtml) {
              newTabItemsMap[tab.id] = [];
            } else {
              const rows = parseCSV(csvText);
              
              const items = transformRowsToItems(rows, tab.id);
              newTabItemsMap[tab.id] = items;
            }
          } catch (tabErr: any) {
            console.error(`Error loading Tab "${tab.name}":`, tabErr);
            newTabItemsMap[tab.id] = [];
          }
        })
      );

      setLiveTabItems(newTabItemsMap);
    } catch (err: any) {
      console.error("Critical error inside fetchGoogleSheetData:", err);
      setErrorMsg(
        err?.message ||
        "Failed to load spreadsheet. Ensure Google Sheet shares are open to 'Anyone with link' and GID values are valid."
      );
    } finally {
      setLoading(false);
    }
  };

  // Sync spreadsheet on load or configuration changes
  useEffect(() => {
    fetchGoogleSheetData();
  }, [sheetUrl, tabs]);

  // --- Save settings handler ---
  const handleSaveSettings = (newUrl: string, newTabs: TabConfig[]) => {
    setSheetUrl(newUrl);
    setTabs(newTabs);
    localStorage.setItem('fb_link_manager_sheet_url', newUrl);
    localStorage.setItem('fb_link_manager_tabs', JSON.stringify(newTabs));
    setShowSettings(false);
  };

  const handleResetToDefault = () => {
    localStorage.removeItem('fb_link_manager_sheet_override');
    localStorage.removeItem('fb_link_manager_sheet_url');
    localStorage.removeItem('fb_link_manager_tabs');
    localStorage.removeItem('fb_link_manager_selected_tab_id');
    setSheetUrl(DEFAULT_SHEET_URL);
    setTabs(DEFAULT_TABS);
    setSelectedTabId(DEFAULT_TABS[0].id);
    setShowSettings(false);
    setErrorMsg(null);
  };

  // --- Complete Status toggling ---
  const handleToggleComplete = (id: string) => {
    const updated = new Set<string>(completedIds);
    const updatedEver = new Set<string>(everCompletedIds);
    
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
      // Once it's clicked, it stays in the "Ever Done" group forever (at the bottom)
      updatedEver.add(id);
    }
    
    setCompletedIds(updated);
    setEverCompletedIds(updatedEver);
    
    saveCompletedIdsToStorage(updated);
    saveEverCompletedIdsToStorage(updatedEver);
  };

  // --- Get Items Computed based on source selection ---
  const rawItemsForActiveTab: FacebookItem[] = useMemo(() => {
    const items = liveTabItems[selectedTabId] || [];
    return items.filter(item => !deletedItemIds.has(item.id));
  }, [liveTabItems, selectedTabId, deletedItemIds]);

  // --- Categorize, alphabetical sorting, and live searching ---
  const categorizedAndFilteredItems = useMemo(() => {
    const filtered = rawItemsForActiveTab.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group items into three specified categories
    const specific: FacebookItem[] = [];
    const my_post: FacebookItem[] = [];
    const group: FacebookItem[] = [];

    filtered.forEach(item => {
      // Apply override
      const override = urlOverrides[item.id];
      const targetItem = override 
        ? { 
            ...item, 
            targetUrl: override,
            deepLinkUrl: override.startsWith('http') ? `fb://facewebmodal/f?href=${encodeURIComponent(override)}` : override 
          }
        : item;

      if (targetItem.category === 'specific') {
        specific.push(targetItem);
      } else if (targetItem.category === 'my_post') {
        my_post.push(targetItem);
      } else if (targetItem.category === 'group') {
        group.push(targetItem);
      }
    });

    // Sort alphabetically so items stay in their designated chunks
    const alphaSort = (a: FacebookItem, b: FacebookItem) => {
      return a.label.localeCompare(b.label); 
    };
    
    specific.sort(alphaSort);
    my_post.sort(alphaSort);
    group.sort(alphaSort);

    return { specific, my_post, group };
  }, [rawItemsForActiveTab, searchQuery, urlOverrides]);

  // --- Progress Indicators (per account tab level) ---
  const activeTabProgressObject: AccountProgress = useMemo(() => {
    const activeItems = rawItemsForActiveTab;
    
    const groupTotal = activeItems.filter(item => item.category === 'group').length;
    const groupCompleted = activeItems.filter(item => item.category === 'group' && completedIds.has(item.id)).length;

    const total = groupTotal;
    const completed = groupCompleted;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    // Categorized statistics
    const specificTotal = activeItems.filter(item => item.category === 'specific').length;
    const specificCompleted = activeItems.filter(item => item.category === 'specific' && completedIds.has(item.id)).length;

    const myPostTotal = activeItems.filter(item => item.category === 'my_post').length;
    const myPostCompleted = activeItems.filter(item => item.category === 'my_post' && completedIds.has(item.id)).length;

    return {
      total,
      completed,
      percentage,
      categories: {
        specific: { total: specificTotal, completed: specificCompleted },
        my_post: { total: myPostTotal, completed: myPostCompleted },
        group: { total: groupTotal, completed: groupCompleted }
      }
    };
  }, [rawItemsForActiveTab, completedIds]);

  // --- Compute overall progress preview percentages for all tabs to display in accounts bar ---
  const allTabsProgressInfo = useMemo(() => {
    const rawMap: Record<string, { total: number; completed: number; percentage: number }> = {};
    
    tabs.forEach(tab => {
      const items = liveTabItems[tab.id] || [];
      const myPostItems = items.filter(item => item.category === 'my_post');
      const total = myPostItems.length;
      const completed = myPostItems.filter(item => completedIds.has(item.id)).length;
      const percentage = total > 0 ? (completed / total) * 100 : 0;
      
      rawMap[tab.id] = { total, completed, percentage };
    });

    return rawMap;
  }, [liveTabItems, tabs, completedIds]);

  const activeTabName = useMemo(() => {
    return tabs.find(t => t.id === selectedTabId)?.name || 'Selected Tab';
  }, [tabs, selectedTabId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-sky-100/30 flex flex-col font-sans relative overflow-hidden">
      
      {/* Decorative ambient glass circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-400/10 blur-[130px] pointer-events-none" />

      {/* HEADER BAR */}
      <header className="bg-white/70 backdrop-blur-md border-b border-white/40 shadow-xs relative z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo Title section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-xs">
              <img 
                src="https://i.imgur.com/A1pHTmz.png" 
                alt="Facebook Link Manager Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-sans font-extrabold text-lg text-slate-800 tracking-tight flex items-center gap-2">
                Link Companion
                <span className="hidden sm:inline-flex bg-blue-50 border border-blue-200/60 text-blue-700 text-[10px] tracking-wide font-extrabold px-2 py-0.5 rounded-md">
                  Task Flow
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Your simple link and group story tracker</p>
            </div>
          </div>

          {/* Timezone Ticker Widget */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right border-r border-slate-100 pr-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Malaysia timezone
              </span>
              <span className="text-sm font-semibold font-mono text-slate-700 mt-1">
                {malaysiaDateStr}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white/40 backdrop-blur-xs border border-white/55 px-3 py-1.5 rounded-lg text-xs">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="font-medium text-slate-600">
                Malaysia: <span className="font-bold font-mono text-blue-700">{malaysiaDateStr}</span>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/60 hover:bg-white/90 rounded-lg text-xs font-semibold text-slate-700 transition-all border border-white/70 active:scale-95 shadow-2xs backdrop-blur-xs"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Configure Sheet</span>
            </button>
          </div>
        </div>
      </header>

      {/* CORE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Edit Link Modal */}
        {editingItem && (
          <EditLinkModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={handleSaveOverride}
          />
        )}

        {/* Settings Panel Inline Overlay */}
        {showSettings && (
          <div className="mb-2 animate-fade-in">
            <SettingsPanel
              currentUrl={sheetUrl}
              currentTabs={tabs}
              onSave={handleSaveSettings}
              onResetToDefault={handleResetToDefault}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}

        {/* ACCOUNT TAB SELECTOR */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Select Account Tab
          </span>
          {/* CUSTOM ACCENT-THEMED DROPDOWN */}
          <div className="relative w-full max-w-md z-30">
            {/* Dropdown trigger button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className={`w-full bg-white/75 backdrop-blur-md text-left py-3 px-4.5 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-2xs cursor-pointer select-none outline-none focus:ring-2 focus:ring-blue-500/20 ${
                dropdownOpen 
                  ? 'border-blue-500/70 shadow-sm ring-2 ring-blue-500/10' 
                  : 'border-slate-200/80 hover:border-slate-350 hover:bg-white/90'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
                <div className="leading-tight min-w-0">
                  <span className="block font-bold text-[13px] text-slate-800 truncate">
                    {activeTabName}
                  </span>
                  <span className="block text-[11px] font-medium text-slate-500 mt-0.5">
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 ml-1.5 transition-transform duration-200 shrink-0 ${
                dropdownOpen ? 'rotate-180 text-blue-600 stroke-[3]' : 'stroke-[2.5]'
              }`} />
            </button>

            {/* Dropdown menu panel */}
            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-lg border border-slate-200/90 rounded-2xl shadow-lg shadow-blue-500/5 py-1.5 z-50 animate-fade-in divide-y divide-slate-100 overflow-hidden max-h-[290px] overflow-y-auto">
                {tabs.map((tab) => {
                  const isSelected = tab.id === selectedTabId;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSelectedTabId(tab.id);
                        localStorage.setItem('fb_link_manager_selected_tab_id', tab.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 flex flex-col gap-1.5 transition-all duration-150 cursor-pointer select-none ${
                        isSelected 
                          ? 'bg-blue-50/70 hover:bg-blue-50' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className={`text-[12.5px] truncate ${
                          isSelected ? 'font-extrabold text-blue-700' : 'font-bold text-slate-700'
                        }`}>
                          {tab.name}
                        </span>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3] shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* LOADING & ERRORS */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
            <div className="text-center">
              <span className="text-sm font-semibold text-slate-700 block">Synchronizing Facebook Links...</span>
              <span className="text-xs text-slate-400">Loading sheets tabs live from Google Servers</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-800 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Failed to Download Google Sheet</h4>
                <p className="text-xs text-red-600/90 mt-1 leading-relaxed">
                  {errorMsg}
                </p>
              </div>
            </div>
            
            <div className="pt-2 border-t border-red-100 flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchGoogleSheetData(tabs, sheetUrl)}
                className="px-4 py-2 bg-red-150 hover:bg-red-200 text-xs font-bold text-red-800 flex items-center gap-1.5 transition-colors rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Sync Connection
              </button>
            </div>
          </div>
        )}

        {/* MAIN WORKING GRID (rendered only when not loading) */}
        {!loading && (
          <div className="space-y-6">
            
            {/* Filter and Control Bar */}
            <div className="bg-white/45 backdrop-blur-md rounded-2xl p-3.5 border border-white/55 shadow-xs flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Search & Filter
                </label>
                {deletedItemIds.size > 0 && (
                  <button
                    onClick={handleRestoreDeleted}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    Restore {deletedItemIds.size} Deleted Link{deletedItemIds.size > 1 ? 's' : ''}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-9 pr-4 py-1.5 bg-white/55 hover:bg-white/90 border border-slate-200 rounded-xl leading-none text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium backdrop-blur-xs"
                  placeholder="Search links (e.g. 'Community', 'Main')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              </div>
            </div>            {/* MOBILE ONLY COLUMN CONTROLLER SWITCHER */}
            <div className="lg:hidden space-y-1.5 animate-fade-in px-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Show task types
              </span>
              <div className="grid grid-cols-3 bg-white/45 backdrop-blur-md p-1 rounded-2xl border border-white/55 shadow-xs gap-1 w-full">
                <button
                  onClick={() => setActiveMobileColumn('specific')}
                  className={`py-2 px-1 rounded-xl text-[10px] min-[360px]:text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 active:scale-[0.98] ${
                    activeMobileColumn === 'specific'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <Bookmark className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 shrink-0" />
                    <span className="truncate">Direct Tasks</span>
                  </div>
                  <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-md ${
                    activeMobileColumn === 'specific'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {activeTabProgressObject.categories.specific.completed}/{activeTabProgressObject.categories.specific.total}
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveMobileColumn('my_post')}
                  className={`py-2 px-1 rounded-xl text-[10px] min-[360px]:text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 active:scale-[0.98] ${
                    activeMobileColumn === 'my_post'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <FileText className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 shrink-0" />
                    <span className="truncate">My Posts</span>
                  </div>
                  <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-md ${
                    activeMobileColumn === 'my_post'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {activeTabProgressObject.categories.my_post.completed}/{activeTabProgressObject.categories.my_post.total}
                  </span>
                </button>

                <button
                  onClick={() => setActiveMobileColumn('group')}
                  className={`py-2 px-1 rounded-xl text-[10px] min-[360px]:text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 active:scale-[0.98] ${
                    activeMobileColumn === 'group'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <Users className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 shrink-0" />
                    <span className="truncate">My Group</span>
                  </div>
                  <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-md ${
                    activeMobileColumn === 'group'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {activeTabProgressObject.categories.group.completed}/{activeTabProgressObject.categories.group.total}
                  </span>
                </button>
              </div>
            </div>            {/* Bento Categories Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
              
              {/* Column 1: Specific Post Links (COL D) */}
              <div className={`flex-col bg-white/45 backdrop-blur-md rounded-3xl border border-white/55 p-5 min-h-[420px] ${
                activeMobileColumn === 'specific' ? 'flex' : 'hidden lg:flex'
              }`}>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200/40">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <h2 className="font-bold text-xs text-slate-600 uppercase tracking-widest">
                      Direct Post Links
                    </h2>
                    <span className="bg-blue-100/50 text-blue-700 text-[10.5px] font-bold rounded-full px-2 py-0.5 border border-blue-200/30 font-mono">
                      {activeTabProgressObject.categories.specific.completed}/{activeTabProgressObject.categories.specific.total}
                    </span>
                  </div>
                  <span className="bg-blue-50/70 text-blue-700 text-[10px] font-sans font-bold px-2 py-0.5 rounded border border-blue-105">
                    Direct
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 max-h-[600px] lg:max-h-[850px] min-h-[140px]">
                  <AnimatePresence initial={false}>
                    {categorizedAndFilteredItems.specific.length > 0 ? (
                      getSectionChunks(categorizedAndFilteredItems.specific, 'specific', everCompletedIds).map((chunk, index, arr) => (
                        <CollapsibleSection
                          key={chunk.key}
                          sectionKey={chunk.key}
                          sectionIndex={chunk.sectionIndex}
                          items={chunk.items}
                          startIndex={chunk.startIndex}
                          endIndex={chunk.endIndex}
                          completedIds={completedIds}
                          onToggleComplete={handleToggleComplete}
                          onEdit={handleEdit}
                          onDelete={handleDeleteItem}
                          deepLinkMode={deepLinkMode}
                          isLastSection={index === arr.length - 1}
                        />
                      ))
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-8 text-center bg-white/55 border border-white/50 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center text-slate-400 py-12"
                      >
                        <Bookmark className="w-8 h-8 text-slate-300 stroke-[1.2] mb-2" />
                        <span className="text-xs font-semibold text-slate-500">No Direct Post tasks</span>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] leading-normal">
                          {searchQuery ? `No matches found for "${searchQuery}"` : "This column is empty on selected account"}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Column 2: My Post Links (COL C) */}
              <div className={`flex-col bg-white/45 backdrop-blur-md rounded-3xl border border-white/55 p-5 min-h-[420px] ${
                activeMobileColumn === 'my_post' ? 'flex' : 'hidden lg:flex'
              }`}>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200/40">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                    <h2 className="font-bold text-xs text-slate-600 uppercase tracking-widest">
                      My Group Posts
                    </h2>
                    <span className="bg-sky-100/50 text-sky-700 text-[10.5px] font-bold rounded-full px-2 py-0.5 border border-sky-200/30 font-mono">
                      {activeTabProgressObject.categories.my_post.completed}/{activeTabProgressObject.categories.my_post.total}
                    </span>
                  </div>
                  <span className="bg-sky-50/70 text-sky-850 text-[10px] font-sans font-bold px-2 py-0.5 rounded border border-sky-105">
                    Shared
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 max-h-[600px] lg:max-h-[850px] min-h-[140px]">
                  <AnimatePresence initial={false}>
                    {categorizedAndFilteredItems.my_post.length > 0 ? (
                      getSectionChunks(categorizedAndFilteredItems.my_post, 'my_post', everCompletedIds).map((chunk, index, arr) => (
                        <CollapsibleSection
                          key={chunk.key}
                          sectionKey={chunk.key}
                          sectionIndex={chunk.sectionIndex}
                          items={chunk.items}
                          startIndex={chunk.startIndex}
                          endIndex={chunk.endIndex}
                          completedIds={completedIds}
                          onToggleComplete={handleToggleComplete}
                          onEdit={handleEdit}
                          onDelete={handleDeleteItem}
                          deepLinkMode={deepLinkMode}
                          isLastSection={index === arr.length - 1}
                        />
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-8 text-center bg-white/55 border border-white/50 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center text-slate-400 py-12"
                      >
                        <FileText className="w-8 h-8 text-slate-300 stroke-[1.2] mb-2" />
                        <span className="text-xs font-semibold text-slate-500">No group posts found</span>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] leading-normal">
                          {searchQuery ? `No matches found for "${searchQuery}"` : "This column is empty on selected account"}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Column 3: Group Links Only (COL B) */}
              <div className={`flex-col bg-white/45 backdrop-blur-md rounded-3xl border border-white/55 p-5 min-h-[420px] ${
                activeMobileColumn === 'group' ? 'flex' : 'hidden lg:flex'
              }`}>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200/40">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <h2 className="font-bold text-xs text-slate-600 uppercase tracking-widest">
                      My Group
                    </h2>
                    <span className="bg-purple-100/50 text-purple-700 text-[10.5px] font-bold rounded-full px-3 py-0.5 border border-purple-200/30 font-mono">
                      {activeTabProgressObject.categories.group.completed}/{activeTabProgressObject.categories.group.total}
                    </span>
                  </div>
                  <span className="bg-purple-50/70 text-purple-800 text-[10px] font-sans font-bold px-2 py-0.5 rounded border border-purple-105">
                    Group Info
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 max-h-[600px] lg:max-h-[850px] min-h-[140px]">
                  <AnimatePresence initial={false}>
                    {categorizedAndFilteredItems.group.length > 0 ? (
                      getSectionChunks(categorizedAndFilteredItems.group, 'group', everCompletedIds).map((chunk, index, arr) => (
                        <CollapsibleSection
                          key={chunk.key}
                          sectionKey={chunk.key}
                          sectionIndex={chunk.sectionIndex}
                          items={chunk.items}
                          startIndex={chunk.startIndex}
                          endIndex={chunk.endIndex}
                          completedIds={completedIds}
                          onToggleComplete={handleToggleComplete}
                          onEdit={handleEdit}
                          onDelete={handleDeleteItem}
                          deepLinkMode={deepLinkMode}
                          isLastSection={index === arr.length - 1}
                        />
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-8 text-center bg-white/55 border border-white/50 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center text-slate-400 py-12"
                      >
                        <Users className="w-8 h-8 text-slate-300 stroke-[1.2] mb-2" />
                        <span className="text-xs font-semibold text-slate-500">No groups found</span>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] leading-normal">
                          {searchQuery ? `No matches found for "${searchQuery}"` : "This column is empty on selected account"}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 py-4 text-center text-slate-500 text-[10px]">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-slate-500">
            Facebook Group & Post Manager &middot; Privacy Focused &middot; Malaysia Reset Synced
          </p>
        </div>
      </footer>
    </div>
  );
}
