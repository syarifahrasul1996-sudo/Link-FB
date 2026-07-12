// App.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { safeLoadFromStorage } from './utils/localStorageHelper';

import {
  Search,
  Settings,
  RefreshCw,
  Clock,
  Facebook,
  Database,
  Link,
  ChevronDown,
  ChevronUp,
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
    const parsed = safeLoadFromStorage<TabConfig[]>(
      'fb_link_manager_tabs',
      DEFAULT_TABS,
      (data) => 
        Array.isArray(data) && 
        data.every(
          (t: any) => 
            t && 
            typeof t === 'object' && 
            typeof t.id === 'string' && 
            typeof t.name === 'string' && 
            typeof t.gid === 'string'
        )
    );
    // Automatic migration from older placeholder configurations or if they have the old default GID
    const hasOldGid = parsed.some((t: any) => t.gid === '1855620942' || t.gid === '0' || t.gid === '928475201');
    if (hasOldGid) {
      localStorage.setItem('fb_link_manager_tabs', JSON.stringify(DEFAULT_TABS));
      return DEFAULT_TABS;
    }
    return parsed;
  });

  const [selectedTabId, setSelectedTabId] = useState<string>(() => {
    return localStorage.getItem('fb_link_manager_selected_tab_id') || 'acc-1';
  });

  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    const parsed = safeLoadFromStorage<string[]>(
      'fb_link_manager_completed_ids',
      [],
      (data) => Array.isArray(data) && data.every((item: any) => typeof item === 'string')
    );
    return new Set(parsed);
  });

  const [completedSectionsOrder, setCompletedSectionsOrder] = useState<string[]>(() => {
    const parsed = safeLoadFromStorage<string[]>(
      'fb_link_manager_completed_sections_order',
      [],
      (data) => Array.isArray(data) && data.every((item: any) => typeof item === 'string')
    );
    return parsed.map((key: string) => {
      // Migrate old un-scoped keys (e.g., "specific_sec_1") to the default account (acc-1)
      if (
        key.startsWith('specific_sec_') ||
        key.startsWith('my_post_sec_') ||
        key.startsWith('group_sec_')
      ) {
        return `acc-1_${key}`;
      }
      return key;
    });
  });

  const deepLinkMode = false;

  // --- UI/UX State variables ---
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tabErrors, setTabErrors] = useState<Record<string, string>>({});
  const [tabInfoMsgs, setTabInfoMsgs] = useState<Record<string, string>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor scroll for 'Back to Top' button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Current Malaysia Date for display
  const [malaysiaDateStr, setMalaysiaDateStr] = useState(getMalaysiaDateString());

  // Cached spreadsheet parsed data
  const [liveTabItems, setLiveTabItems] = useState<Record<string, FacebookItem[]>>({});
  const [editingItem, setEditingItem] = useState<FacebookItem | null>(null);

  // Refs to handle race conditions in async Google Sheet fetches
  const lastRequestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // State for one-by-one deleted items
  const [deletedItemIds, setDeletedItemIds] = useState<Set<string>>(() => {
    const parsed = safeLoadFromStorage<string[]>(
      'fb_link_manager_deleted_ids',
      [],
      (data) => Array.isArray(data) && data.every((item: any) => typeof item === 'string')
    );
    return new Set(parsed);
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
    return safeLoadFromStorage<Record<string, string>>(
      'fb_link_manager_url_overrides',
      {},
      (data) => 
        data !== null && 
        typeof data === 'object' && 
        !Array.isArray(data) && 
        Object.values(data).every((val: any) => typeof val === 'string')
    );
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

  // Helper to chunk lists of items into groups of 25 (stable based on unfiltered list)
  const getSectionChunks = (allCategoryItems: FacebookItem[], filteredCategoryItems: FacebookItem[], categoryKey: string, completedIds: Set<string>) => {
    const chunks = [];
    
    for (let i = 0; i < allCategoryItems.length; i += 25) {
      const fullChunkItems = allCategoryItems.slice(i, i + 25);
      
      // Filter items in this chunk that match the search
      const visibleChunkItems = fullChunkItems.filter(item => 
        filteredCategoryItems.some(f => f.id === item.id)
      );
      
      if (visibleChunkItems.length === 0) continue;

      const sectionIndex = Math.floor(i / 25) + 1;
      const key = `${selectedTabId}_${categoryKey}_sec_${sectionIndex}`;
      
      // A chunk is considered fully completed if ALL its original items are in completedIds
      const isFullyCompleted = fullChunkItems.length > 0 && fullChunkItems.every(item => completedIds.has(item.id));
      
      chunks.push({
        key,
        sectionIndex,
        items: visibleChunkItems,
        startIndex: i + 1,
        endIndex: Math.min(i + 25, allCategoryItems.length),
        isFullyCompleted
      });
    }

    // Sort chunks strictly by their completion rotation history (completedSectionsOrder):
    // 1. Sections that are in completedSectionsOrder go to the bottom of the list, sorted by their order of completion.
    // 2. Sections that are NOT in completedSectionsOrder (never completed) stay at the top, sorted alphabetically/numerically by sectionIndex.
    chunks.sort((a, b) => {
      const aOrderIndex = completedSectionsOrder.indexOf(a.key);
      const bOrderIndex = completedSectionsOrder.indexOf(b.key);
      
      const aInOrder = aOrderIndex !== -1;
      const bInOrder = bOrderIndex !== -1;

      if (aInOrder && bInOrder) {
        // Sort by completion history order (more recently completed sections go further down)
        return aOrderIndex - bOrderIndex;
      }
      
      if (aInOrder) return 1;  // Previously completed sections go below "never completed" ones
      if (bInOrder) return -1;
      
      // Fallback to alphabetical/numerical index for sections never completed
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
    // Initial mount diagnostic logging
    const initialMalaysiaDate = getMalaysiaDateString();
    const initialStoredDate = localStorage.getItem('fb_link_manager_last_reset_date');
    const initialMs = getMsUntilMalaysiaMidnight();
    const initialCountdown = formatMillisecondsToCountdown(initialMs);
    
    console.log(`%c[Timezone Initialized]
- Local Browser Time: ${new Date().toString()}
- Local Timezone Offset: ${new Date().getTimezoneOffset()} minutes
- Malaysia Date String (Today): ${initialMalaysiaDate}
- Stored Last Reset Date: ${initialStoredDate || 'None (will set on next tick)'}
- Time Until next Malaysia Midnight: ${initialCountdown} (${initialMs} ms)
- Rollover Will Trigger Instantly: ${initialStoredDate && initialStoredDate !== initialMalaysiaDate ? 'YES (Mismatch)' : 'NO (Match)'}
`, "color: #2563eb; font-weight: bold;");

    let tickCount = 0;

    const timer = setInterval(() => {
      const d = new Date();
      const tdMalaysia = getMalaysiaDateString();
      setMalaysiaDateStr(tdMalaysia);
      
      const storedResetDate = localStorage.getItem('fb_link_manager_last_reset_date');
      
      // Throttle logging: Log diagnostics once every 15 seconds (to avoid spam, but keep it active)
      tickCount++;
      if (tickCount % 15 === 0) {
        const msUntilMidnight = getMsUntilMalaysiaMidnight();
        const countdownStr = formatMillisecondsToCountdown(msUntilMidnight);
        console.log(`[Timer Diagnostic - Every 15s]
- Local Browser Time: ${d.toString()}
- Current Malaysia Date: "${tdMalaysia}"
- Stored Last Reset Date: "${storedResetDate || 'None'}"
- Remaining until midnight: ${countdownStr}
- Status: ${storedResetDate === tdMalaysia ? 'ACTIVE (Match)' : 'MISMATCH (Will trigger reset if stored date exists)'}
`);
      }

      // Check for midnight rollover to reset checkmarks
      if (storedResetDate && storedResetDate !== tdMalaysia) {
        console.warn(`%c[Midnight Reset Rollover Triggered]
- Mismatch detected! 
- Stored Reset Date: "${storedResetDate}"
- Current Malaysia Date: "${tdMalaysia}"
- Cleared Completed IDs state and updated stored reset date.
`, "color: #ea580c; font-weight: bold; background-color: #ffedd5; padding: 4px;");

        // Midnight Malaysia Time hit! Reset completed items (checkmarks).
        setCompletedIds(new Set());
        localStorage.setItem('fb_link_manager_completed_ids', JSON.stringify([]));
        
        // DO NOT reset completedSectionsOrder here so the order is remembered across days.
        
        localStorage.setItem('fb_link_manager_last_reset_date', tdMalaysia);
      } else if (!storedResetDate) {
        console.log(`[Timer Setup] Initialized last reset date in LocalStorage to today: "${tdMalaysia}"`);
        localStorage.setItem('fb_link_manager_last_reset_date', tdMalaysia);
      }
    }, 1000);

    return () => {
      console.log("[Timer Cleanup] Cleared clock and rollover interval timer.");
      clearInterval(timer);
    };
  }, []);

  // --- Save / Fetch Handlers ---
  const saveCompletedIdsToStorage = (updatedSet: Set<string>) => {
    localStorage.setItem('fb_link_manager_completed_ids', JSON.stringify(Array.from(updatedSet)));
  };

  const saveCompletedSectionsOrderToStorage = (updatedOrder: string[]) => {
    localStorage.setItem('fb_link_manager_completed_sections_order', JSON.stringify(updatedOrder));
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
    const requestId = ++lastRequestIdRef.current;
    
    // Invalidate/abort previous in-flight fetches
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setErrorMsg(null);

    // Clear errors and info messages for the target tabs
    setTabErrors(prev => {
      const next = { ...prev };
      targetTabs.forEach(t => {
        delete next[t.id];
      });
      return next;
    });
    setTabInfoMsgs(prev => {
      const next = { ...prev };
      targetTabs.forEach(t => {
        delete next[t.id];
      });
      return next;
    });
    
    try {
      const newTabItemsMap: Record<string, FacebookItem[]> = {};

      // Fetch all target tabs concurrently to render complete stats and switch tab smoothly
      await Promise.all(
        targetTabs.map(async (tab) => {
          try {
            // 1. Validate sheet URL
            if (!targetUrl.trim() || !targetUrl.includes('docs.google.com/spreadsheets')) {
              if (lastRequestIdRef.current !== requestId || !isMountedRef.current) return;
              setTabErrors(prev => ({ ...prev, [tab.id]: 'Invalid Google Sheet URL' }));
              newTabItemsMap[tab.id] = [];
              return;
            }

            // 2. Validate GID
            const trimmedGid = tab.gid?.trim() || '';
            const isGidValid = trimmedGid === '' || /^\d+$/.test(trimmedGid);
            if (!isGidValid) {
              if (lastRequestIdRef.current !== requestId || !isMountedRef.current) return;
              setTabErrors(prev => ({ ...prev, [tab.id]: 'Invalid or missing GID' }));
              newTabItemsMap[tab.id] = [];
              return;
            }

            const downloadUrl = getGoogleSheetDownloadUrl(targetUrl, tab.gid);
            
            let response: Response;
            try {
              response = await fetch(downloadUrl, { signal });
            } catch (fetchErr: any) {
              if (fetchErr?.name === 'AbortError') {
                return;
              }
              if (lastRequestIdRef.current !== requestId || !isMountedRef.current) return;
              console.error(`Network error loading Tab "${tab.name}":`, fetchErr);
              setTabErrors(prev => ({ ...prev, [tab.id]: 'Network error: Failed to connect to Google Sheets servers.' }));
              newTabItemsMap[tab.id] = [];
              return;
            }

            if (lastRequestIdRef.current !== requestId || !isMountedRef.current) return;

            if (!response.ok) {
              let msg = `Network error: Failed to load sheet (${response.status} ${response.statusText || 'Bad Request'}).`;
              if (response.status === 404) {
                msg = 'Google Sheet not found. Please verify the URL and ensure the spreadsheet exists.';
              } else if (response.status === 400) {
                msg = 'Invalid GID or sheet configuration. Please verify GID values in the configuration.';
              } else if (response.status === 401 || response.status === 403) {
                msg = 'Sheet is private or not publicly accessible. Ensure sharing settings are set to "Anyone with the link".';
              }
              setTabErrors(prev => ({ ...prev, [tab.id]: msg }));
              newTabItemsMap[tab.id] = [];
              return;
            }

            const csvText = await response.text();
            if (lastRequestIdRef.current !== requestId || !isMountedRef.current) return;

            if (!csvText || csvText.trim() === '') {
              // Empty sheet
              newTabItemsMap[tab.id] = [];
              setTabInfoMsgs(prev => ({ ...prev, [tab.id]: 'This tab is empty. No rows found.' }));
              return;
            }

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
              setTabErrors(prev => ({ 
                ...prev, 
                [tab.id]: 'Sheet is private or not publicly accessible. Ensure sharing settings are set to "Anyone with the link".' 
              }));
              newTabItemsMap[tab.id] = [];
              return;
            }

            // Parse CSV
            let rows: string[][];
            try {
              rows = parseCSV(csvText);
            } catch (parseErr) {
              if (lastRequestIdRef.current !== requestId || !isMountedRef.current) return;
              setTabErrors(prev => ({ ...prev, [tab.id]: 'Unexpected response format: Failed to parse CSV data.' }));
              newTabItemsMap[tab.id] = [];
              return;
            }

            if (lastRequestIdRef.current !== requestId || !isMountedRef.current) return;

            if (rows.length === 0) {
              // Empty CSV / No valid data found
              newTabItemsMap[tab.id] = [];
              setTabInfoMsgs(prev => ({ ...prev, [tab.id]: 'This tab has no valid CSV data rows.' }));
              return;
            }

            const items = transformRowsToItems(rows, tab.id);
            newTabItemsMap[tab.id] = items;

            if (items.length === 0) {
              // Loaded successfully but no valid links found
              setTabInfoMsgs(prev => ({ ...prev, [tab.id]: 'No valid links found on this tab.' }));
            }

          } catch (tabErr: any) {
            if (tabErr?.name === 'AbortError') return;
            if (lastRequestIdRef.current !== requestId || !isMountedRef.current) return;
            console.error(`Unexpected error loading Tab "${tab.name}":`, tabErr);
            setTabErrors(prev => ({ 
              ...prev, 
              [tab.id]: tabErr?.message || 'An unexpected error occurred while loading this tab.' 
            }));
            newTabItemsMap[tab.id] = [];
          }
        })
      );

      if (lastRequestIdRef.current !== requestId || !isMountedRef.current) {
        return;
      }

      setLiveTabItems(prev => ({
        ...prev,
        ...newTabItemsMap
      }));
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (lastRequestIdRef.current !== requestId || !isMountedRef.current) return;
      console.error("Critical error inside fetchGoogleSheetData:", err);
      setErrorMsg(
        err?.message ||
        "Failed to load spreadsheet. Ensure Google Sheet shares are open to 'Anyone with link' and GID values are valid."
      );
    } finally {
      if (lastRequestIdRef.current === requestId && isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Sync spreadsheet on load or configuration changes
  useEffect(() => {
    fetchGoogleSheetData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
    
    // Use the correctly filtered list to ensure index matching with UI chunks
    const rawItems = liveTabItems[selectedTabId] || [];
    const items = rawItems.filter(item => !deletedItemIds.has(item.id));
    const itemToToggle = items.find(item => item.id === id);

    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    
    setCompletedIds(updated);
    saveCompletedIdsToStorage(updated);

    // If we just toggled an item, check if its section is now fully completed today
    if (itemToToggle) {
      const categoryKey = itemToToggle.category;
      const categoryItems = items
        .filter(it => it.category === categoryKey)
        .sort((a, b) => a.label.localeCompare(b.label));

      const itemIndex = categoryItems.findIndex(it => it.id === id);
      if (itemIndex !== -1) {
        const sectionIndex = Math.floor(itemIndex / 25) + 1;
        const sectionKey = `${selectedTabId}_${categoryKey}_sec_${sectionIndex}`;
        
        const sectionStart = Math.floor(itemIndex / 25) * 25;
        const sectionItems = categoryItems.slice(sectionStart, sectionStart + 25);
        
        // Check if all items in this section are now completed today
        const isFullyCompletedToday = sectionItems.length > 0 && sectionItems.every(it => updated.has(it.id));
        
        if (isFullyCompletedToday) {
          // It's fully completed! Move it to the bottom of the order list.
          // We filter out any previous occurrence and append it to the end.
          setCompletedSectionsOrder(prev => {
            const filteredOrder = prev.filter(k => k !== sectionKey);
            const newOrder = [...filteredOrder, sectionKey];
            saveCompletedSectionsOrderToStorage(newOrder);
            return newOrder;
          });
        } else {
          // If any item in the section is unchecked (or not fully complete anymore), 
          // we KEEP it in completedSectionsOrder so its relative position is remembered 
          // even when it moves back to the top "Unfinished" group.
          // Only remove if it was never in there? (Implicitly handled by the sort logic).
        }
      }
    }
  };

  // --- Get Items Computed based on source selection ---
  const rawItemsForActiveTab: FacebookItem[] = useMemo(() => {
    const items = liveTabItems[selectedTabId] || [];
    return items.filter(item => !deletedItemIds.has(item.id));
  }, [liveTabItems, selectedTabId, deletedItemIds]);

  // --- Categorize and alphabetical sorting (UNFILTERED) for stable sectioning ---
  const categorizedItems = useMemo(() => {
    const raw = rawItemsForActiveTab;

    const specific: FacebookItem[] = [];
    const my_post: FacebookItem[] = [];
    const group: FacebookItem[] = [];

    raw.forEach(item => {
      const override = urlOverrides[item.id];
      const targetItem = override 
        ? { 
            ...item, 
            targetUrl: override,
            deepLinkUrl: override.startsWith('http') ? `fb://facewebmodal/f?href=${encodeURIComponent(override)}` : override,
            isLabelOnly: false
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

    const alphaSort = (a: FacebookItem, b: FacebookItem) => a.label.localeCompare(b.label);
    specific.sort(alphaSort);
    my_post.sort(alphaSort);
    group.sort(alphaSort);

    return { specific, my_post, group };
  }, [rawItemsForActiveTab, urlOverrides]);

  // --- Filter the categorized items for live searching ---
  const filteredCategorizedItems = useMemo(() => {
    const filter = (list: FacebookItem[]) => 
      list.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

    return {
      specific: filter(categorizedItems.specific),
      my_post: filter(categorizedItems.my_post),
      group: filter(categorizedItems.group)
    };
  }, [categorizedItems, searchQuery]);

  // --- Progress Indicators (per account tab level) ---
  const activeTabProgressObject: AccountProgress = useMemo(() => {
    const activeItems = rawItemsForActiveTab;
    
    const groupTotal = activeItems.filter(item => item.category === 'group').length;
    const groupCompleted = activeItems.filter(item => item.category === 'group' && completedIds.has(item.id)).length;

    const specificTotal = activeItems.filter(item => item.category === 'specific').length;
    const specificCompleted = activeItems.filter(item => item.category === 'specific' && completedIds.has(item.id)).length;

    const myPostTotal = activeItems.filter(item => item.category === 'my_post').length;
    const myPostCompleted = activeItems.filter(item => item.category === 'my_post' && completedIds.has(item.id)).length;

    const total = groupTotal + specificTotal + myPostTotal;
    const completed = groupCompleted + specificCompleted + myPostCompleted;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

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
      const activeItems = items.filter(item => !deletedItemIds.has(item.id));
      
      const groupTotal = activeItems.filter(item => item.category === 'group').length;
      const groupCompleted = activeItems.filter(item => item.category === 'group' && completedIds.has(item.id)).length;

      const specificTotal = activeItems.filter(item => item.category === 'specific').length;
      const specificCompleted = activeItems.filter(item => item.category === 'specific' && completedIds.has(item.id)).length;

      const myPostTotal = activeItems.filter(item => item.category === 'my_post').length;
      const myPostCompleted = activeItems.filter(item => item.category === 'my_post' && completedIds.has(item.id)).length;

      const total = groupTotal + specificTotal + myPostTotal;
      const completed = groupCompleted + specificCompleted + myPostCompleted;
      const percentage = total > 0 ? (completed / total) * 100 : 0;
      
      rawMap[tab.id] = { total, completed, percentage };
    });

    return rawMap;
  }, [liveTabItems, tabs, completedIds, deletedItemIds]);

  const activeTabName = useMemo(() => {
    return tabs.find(t => t.id === selectedTabId)?.name || 'Selected Tab';
  }, [tabs, selectedTabId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-150 flex flex-col font-sans relative">
      
      {/* Decorative ambient glass circles inside a clipped wrapper to prevent horizontal scrollbars while keeping header sticky */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-300/10 blur-[140px]" />
      </div>

      {/* HEADER BAR */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-3xs z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Left corner: Logo Title section */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-slate-200/50">
              <img 
                src="https://i.imgur.com/A1pHTmz.png" 
                alt="Facebook Link Manager Logo"
                className="w-full h-full object-cover animate-pulse-slow"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden xs:block">
              <h1 className="font-sans font-extrabold text-xs sm:text-sm text-slate-800 tracking-tight flex items-center gap-1">
                Link Companion
                <span className="hidden sm:inline-flex bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[7.5px] tracking-widest font-extrabold px-1 py-0.5 rounded-full uppercase">
                  PRO
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">Your simple link and group story tracker</p>
            </div>
          </div>

          {/* Flexible and Full-width Account Switcher Dropdown */}
          <div className="flex-1 min-w-0 relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className={`flex items-center justify-between gap-1.5 px-3.5 h-8 bg-slate-50 border rounded-full text-xs font-extrabold transition-all active:scale-95 cursor-pointer shadow-3xs select-none w-full ${
                dropdownOpen 
                  ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/10 text-blue-700' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/40 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-3xs animate-pulse" />
                <span className="truncate tracking-tight text-left">
                  {activeTabName}
                </span>
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-fade-in divide-y divide-slate-100 overflow-hidden max-h-[290px] overflow-y-auto">
                <div className="px-3.5 py-1 text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  Switch Active Account
                </div>
                {tabs.map((tab) => {
                  const isSelected = tab.id === selectedTabId;
                  const progress = allTabsProgressInfo[tab.id];
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSelectedTabId(tab.id);
                        localStorage.setItem('fb_link_manager_selected_tab_id', tab.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex flex-col gap-0.5 transition-all duration-150 cursor-pointer select-none ${
                        isSelected 
                          ? 'bg-blue-50/50 hover:bg-blue-50' 
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className={`text-[11.5px] truncate tracking-tight ${
                          isSelected ? 'font-extrabold text-blue-700' : 'font-bold text-slate-700'
                        }`}>
                          {tab.name}
                        </span>
                        
                        {isSelected && (
                          <Check className="w-3 h-3 text-blue-600 stroke-[3.5] shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between w-full">
                        {tabErrors[tab.id] ? (
                          <span className="text-[8.5px] font-extrabold text-red-600 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-red-500 shrink-0 animate-pulse" />
                            Connection error
                          </span>
                        ) : tabInfoMsgs[tab.id] ? (
                          <span className="text-[8.5px] font-extrabold text-amber-600 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                            {tabInfoMsgs[tab.id].includes('empty') ? 'Empty' : 'No links'}
                          </span>
                        ) : (
                          <>
                            <span className="text-[9px] font-bold text-slate-400">
                              <span className="text-slate-600 font-extrabold font-mono">{progress?.completed || 0}/{progress?.total || 0}</span> done ({Math.round(progress?.percentage || 0)}%)
                            </span>
                            {progress?.total > 0 && (
                              <div className="w-14 bg-slate-100 rounded-full h-1 overflow-hidden shrink-0 ml-2">
                                <div 
                                  className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right corner: Settings */}
          <div className="shrink-0">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-center h-8 w-8 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-full text-slate-500 hover:text-slate-700 transition-all active:scale-95 shadow-3xs cursor-pointer"
              title="Configure Google Sheet"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-3xs flex flex-col justify-center w-full">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block ml-0.5">
                  Search & Filter Tasks
                </label>
                {deletedItemIds.size > 0 && (
                  <button
                    onClick={handleRestoreDeleted}
                    className="text-[9.5px] font-extrabold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    Restore {deletedItemIds.size} Deleted Link{deletedItemIds.size > 1 ? 's' : ''}
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg leading-none text-[11.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
                  placeholder="Search links (e.g. 'Community', 'Main')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              </div>
            </div>

            {/* TAB SPECIFIC FETCH ERRORS AND EMPTY WARNINGS */}
            {tabErrors[selectedTabId] && (
              <div className="p-5 bg-red-50 border border-red-200/60 rounded-2xl text-red-850 space-y-3 shadow-2xs animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-sm text-red-900">Tab "{activeTabName}" Load Error</h4>
                    <p className="text-xs text-red-700 font-medium mt-1 leading-relaxed">
                      {tabErrors[selectedTabId]}
                    </p>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-red-150/40 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => fetchGoogleSheetData([tabs.find(t => t.id === selectedTabId)!], sheetUrl)}
                    className="px-3.5 py-1.5 bg-red-100 hover:bg-red-150 text-xs font-bold text-red-800 flex items-center gap-1.5 transition-all rounded-xl active:scale-95 border border-red-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Syncing This Tab
                  </button>
                  <span className="text-[10px] font-medium text-red-600">
                    Verify this GID or share settings. Other tabs may still work fine.
                  </span>
                </div>
              </div>
            )}

            {tabInfoMsgs[selectedTabId] && !tabErrors[selectedTabId] && (
              <div className="p-5 bg-amber-50 border border-amber-200/60 rounded-2xl text-amber-850 space-y-3 shadow-2xs animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-sm text-amber-900">Tab "{activeTabName}" Status</h4>
                    <p className="text-xs text-amber-700 font-medium mt-1 leading-relaxed">
                      {tabInfoMsgs[selectedTabId]}
                    </p>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-amber-150/40 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => fetchGoogleSheetData([tabs.find(t => t.id === selectedTabId)!], sheetUrl)}
                    className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-150 text-xs font-bold text-amber-800 flex items-center gap-1.5 transition-all rounded-xl active:scale-95 border border-amber-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Tab
                  </button>
                  <span className="text-[10px] font-medium text-amber-600">
                    Tab loaded successfully, but didn't parse any valid entries today.
                  </span>
                </div>
              </div>
            )}

            {/* MOBILE ONLY COLUMN CONTROLLER SWITCHER */}
            <div className="lg:hidden space-y-1.5 animate-fade-in px-0.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                Show task types
              </span>
              <div className="grid grid-cols-3 bg-white p-1 rounded-2xl border border-slate-200 shadow-3xs gap-1 w-full">
                <button
                  onClick={() => setActiveMobileColumn('specific')}
                  className={`py-2.5 px-1 rounded-xl text-[10.5px] min-[360px]:text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] ${
                    activeMobileColumn === 'specific'
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 shrink-0 min-w-0">
                    <Bookmark className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Direct</span>
                  </div>
                  <span className={`text-[9.5px] font-mono font-extrabold px-1.5 py-0.5 rounded-full ${
                    activeMobileColumn === 'specific'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 border border-slate-200/50'
                  }`}>
                    {activeTabProgressObject.categories.specific.completed}/{activeTabProgressObject.categories.specific.total}
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveMobileColumn('my_post')}
                  className={`py-2.5 px-1 rounded-xl text-[10.5px] min-[360px]:text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] ${
                    activeMobileColumn === 'my_post'
                      ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 shrink-0 min-w-0">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">My Posts</span>
                  </div>
                  <span className={`text-[9.5px] font-mono font-extrabold px-1.5 py-0.5 rounded-full ${
                    activeMobileColumn === 'my_post'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 border border-slate-200/50'
                  }`}>
                    {activeTabProgressObject.categories.my_post.completed}/{activeTabProgressObject.categories.my_post.total}
                  </span>
                </button>

                <button
                  onClick={() => setActiveMobileColumn('group')}
                  className={`py-2.5 px-1 rounded-xl text-[10.5px] min-[360px]:text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] ${
                    activeMobileColumn === 'group'
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 shrink-0 min-w-0">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">My Group</span>
                  </div>
                  <span className={`text-[9.5px] font-mono font-extrabold px-1.5 py-0.5 rounded-full ${
                    activeMobileColumn === 'group'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 border border-slate-200/50'
                  }`}>
                    {activeTabProgressObject.categories.group.completed}/{activeTabProgressObject.categories.group.total}
                  </span>
                </button>
              </div>
            </div>            {/* Bento Categories Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
              
              {/* Column 1: Specific Post Links (COL D) */}
              <div className={`flex-col bg-white rounded-3xl border border-slate-200/80 p-5.5 shadow-xs min-h-[420px] transition-all duration-300 hover:shadow-sm ${
                activeMobileColumn === 'specific' ? 'flex' : 'hidden lg:flex'
              }`}>
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-slow" />
                    <h2 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-widest">
                      Direct Post Links
                    </h2>
                    <span className="bg-blue-50 text-blue-700 text-[10.5px] font-extrabold rounded-full px-2.5 py-0.5 border border-blue-100 font-mono">
                      {activeTabProgressObject.categories.specific.completed}/{activeTabProgressObject.categories.specific.total}
                    </span>
                  </div>
                  <span className="bg-blue-50/50 text-blue-700 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-blue-100/40">
                    Direct
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 max-h-[600px] lg:max-h-[850px] min-h-[140px]">
                  <AnimatePresence initial={false}>
                    {filteredCategorizedItems.specific.length > 0 ? (
                      getSectionChunks(categorizedItems.specific, filteredCategorizedItems.specific, 'specific', completedIds).map((chunk, index, arr) => (
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
              <div className={`flex-col bg-white rounded-3xl border border-slate-200/80 p-5.5 shadow-xs min-h-[420px] transition-all duration-300 hover:shadow-sm ${
                activeMobileColumn === 'my_post' ? 'flex' : 'hidden lg:flex'
              }`}>
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse-slow" />
                    <h2 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-widest">
                      My Group Posts
                    </h2>
                    <span className="bg-sky-50 text-sky-700 text-[10.5px] font-extrabold rounded-full px-2.5 py-0.5 border border-sky-100 font-mono">
                      {activeTabProgressObject.categories.my_post.completed}/{activeTabProgressObject.categories.my_post.total}
                    </span>
                  </div>
                  <span className="bg-sky-50/50 text-sky-700 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-sky-100/40">
                    Shared
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 max-h-[600px] lg:max-h-[850px] min-h-[140px]">
                  <AnimatePresence initial={false}>
                    {filteredCategorizedItems.my_post.length > 0 ? (
                      getSectionChunks(categorizedItems.my_post, filteredCategorizedItems.my_post, 'my_post', completedIds).map((chunk, index, arr) => (
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
              <div className={`flex-col bg-white rounded-3xl border border-slate-200/80 p-5.5 shadow-xs min-h-[420px] transition-all duration-300 hover:shadow-sm ${
                activeMobileColumn === 'group' ? 'flex' : 'hidden lg:flex'
              }`}>
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse-slow" />
                    <h2 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-widest">
                      My Group
                    </h2>
                    <span className="bg-purple-50 text-purple-700 text-[10.5px] font-extrabold rounded-full px-2.5 py-0.5 border border-purple-100 font-mono">
                      {activeTabProgressObject.categories.group.completed}/{activeTabProgressObject.categories.group.total}
                    </span>
                  </div>
                  <span className="bg-purple-50/50 text-purple-700 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-purple-100/40">
                    Group Info
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 max-h-[600px] lg:max-h-[850px] min-h-[140px]">
                  <AnimatePresence initial={false}>
                    {filteredCategorizedItems.group.length > 0 ? (
                      getSectionChunks(categorizedItems.group, filteredCategorizedItems.group, 'group', completedIds).map((chunk, index, arr) => (
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

      {/* BACK TO TOP BUTTON */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-[100] p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/20 transition-all active:scale-90 group outline-none"
            title="Scroll to Top"
          >
            <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
