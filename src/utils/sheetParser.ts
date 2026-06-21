// utils/sheetParser.ts
import { FacebookItem } from '../types';

/**
 * A highly robust custom CSV Parser that handles double quotes,
 * commas inside fields, and multi-line values correctly.
 */
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // Skip the double-escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\n' || char === '\r') {
        row.push(cell.trim());
        result.push(row);
        row = [];
        cell = '';
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip LF in CRLF
        }
      } else {
        cell += char;
      }
    }
  }
  
  // Hande the last cell
  if (cell || row.length > 0) {
    row.push(cell.trim());
    result.push(row);
  }
  
  // Filter out completely empty rows
  return result.filter(r => r.length > 0 && r.some(cell => cell !== ''));
}

/**
 * Normalizes any standard Google Sheets edit or sharing URL into a CSV export URL.
 */
export function getGoogleSheetDownloadUrl(urlOrId: string, gid: string): string {
  const trimmed = urlOrId.trim();
  let spreadsheetId = trimmed;
  
  if (trimmed.includes('docs.google.com/spreadsheets')) {
    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      spreadsheetId = match[1];
    }
  }
  
  // If gid is '0' or empty or undefined, we download without the gid parameter
  // so Google Sheets automatically downloads the first active tab. This prevents
  // 400 Bad Request / 404 errors if the first tab has a custom GID.
  if (!gid || gid === '0' || gid.trim() === '') {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  }
  
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Transforms CSV rows into raw FacebookItem list.
 * Columns:
 * Column A: Button label
 * Column B: Facebook group link
 * Column C: My post link in that group
 * Column D: My specific post link
 */
export function transformRowsToItems(rows: string[][], tabId: string): FacebookItem[] {
  if (rows.length === 0) return [];
  
  // Detect if there is a header row (e.g. Row 1 contains headers like "Label", "Group", "Post" instead of valid URLs)
  let startIndex = 0;
  const firstRow = rows[0];
  
  // If first row looks like headers (none of B, C, D looks like a facebook/web link or Column A is literally headers)
  const isHeader = (
    firstRow[0]?.toLowerCase().includes('label') ||
    firstRow[0]?.toLowerCase().includes('button') ||
    firstRow[0]?.toLowerCase().includes('name') ||
    (!firstRow[1]?.startsWith('http') && !firstRow[2]?.startsWith('http') && !firstRow[3]?.startsWith('http'))
  );
  
  if (isHeader) {
    startIndex = 1;
  }
  
  const items: FacebookItem[] = [];
  
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    // Ensure we have enough columns, default to blank for missing columns
    const label = row[0] || '';
    const groupLink = row[1] || '';
    const groupPostLink = row[2] || '';
    const specificPostLink = row[3] || '';
    
    // An item must at least have a label to be rendered
    if (!label.trim()) {
      continue;
    }
    
    // Choose high-precedence target URL
    // If D available -> D, else C -> C, else B -> B
    let targetUrl = '';
    let category: 'specific' | 'my_post' | 'group' = 'group';
    
    const hasD = isUrlValid(specificPostLink);
    const hasC = isUrlValid(groupPostLink);
    const hasB = isUrlValid(groupLink);
    
    if (hasD) {
      targetUrl = specificPostLink.trim();
      category = 'specific';
    } else if (hasC) {
      targetUrl = groupPostLink.trim();
      category = 'my_post';
    } else if (hasB) {
      targetUrl = groupLink.trim();
      category = 'group';
    } else {
      // In case no valid url is provided, fallback to whatever text is there
      targetUrl = (specificPostLink || groupPostLink || groupLink || '').trim();
      category = 'group';
    }
    
    // Helper to generate a deep link scheme for the Facebook app
    // The standard fb scheme that works: fb://facewebmodal/f?href={url}
    const deepLinkUrl = targetUrl.startsWith('http') 
      ? `fb://facewebmodal/f?href=${encodeURIComponent(targetUrl)}`
      : targetUrl;
    
    items.push({
      id: `${tabId}-row-${i}`,
      label: label.trim(),
      groupLink: groupLink.trim(),
      groupPostLink: groupPostLink.trim(),
      specificPostLink: specificPostLink.trim(),
      category,
      targetUrl,
      deepLinkUrl
    });
  }
  
  return items;
}

function isUrlValid(url: string | undefined): boolean {
  if (!url) return false;
  const pruned = url.trim();
  return pruned.startsWith('http://') || pruned.startsWith('https://');
}
