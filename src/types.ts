// types.ts

export interface TabConfig {
  id: string; // unique internal identifier
  name: string; // display name (e.g. "Marketing Tab", "Personal Tab")
  gid: string; // Google Sheets tab GID (e.g. "0", "15438865")
}

export interface FacebookItem {
  id: string; // unique row id (e.g. `${tabId}-${index}`)
  label: string; // Column A: Button label
  groupLink: string; // Column B: Facebook group link
  groupPostLink: string; // Column C: My post link in that group
  specificPostLink: string; // Column D: My specific post link
  category: 'specific' | 'my_post' | 'group'; // computed category
  targetUrl: string; // computed target link to launch
  deepLinkUrl: string; // computed facebook App deep link URL
  isLabelOnly?: boolean; // true if no valid URL exists for the row
}

export interface AccountProgress {
  total: number;
  completed: number;
  percentage: number;
  categories: {
    specific: { total: number; completed: number };
    my_post: { total: number; completed: number };
    group: { total: number; completed: number };
  };
}

export interface AppSettings {
  sheetUrl: string;
  tabs: TabConfig[];
}

export interface DiagnosticInfo {
  tabId: string;
  tabName: string;
  url: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  statusCode?: number;
  statusText?: string;
  contentType?: string;
  rawText?: string;
  parsingError?: string;
  isHtmlDetected: boolean;
  rowsCount?: number;
  itemsCount?: number;
  fetchedAt?: string;
}
