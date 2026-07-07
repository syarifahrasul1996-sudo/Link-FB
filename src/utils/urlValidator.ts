// src/utils/urlValidator.ts

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates whether a URL is a secure, valid Facebook-related link.
 * Used to restrict link overrides to secure https facebook domains.
 */
export function validateFacebookUrl(url: string): ValidationResult {
  const trimmed = url.trim();
  if (!trimmed) {
    return { isValid: false, error: 'URL cannot be empty.' };
  }

  if (!trimmed.startsWith('https://')) {
    return { isValid: false, error: 'Only secure https:// links are allowed.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch (e) {
    return { isValid: false, error: 'Please enter a valid URL.' };
  }

  if (parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Only secure https:// links are allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  
  // Facebook-related domains list
  const allowedDomains = ['facebook.com', 'fb.com', 'fb.watch', 'messenger.com'];
  
  const isAllowed = allowedDomains.some(domain => 
    hostname === domain || hostname.endsWith('.' + domain)
  );

  if (!isAllowed) {
    return { 
      isValid: false, 
      error: 'Only Facebook-related domains (e.g., facebook.com, fb.com, fb.watch, messenger.com) are allowed.' 
    };
  }

  // Double check that there are no unsafe sequences in the URL
  const lowerUrl = trimmed.toLowerCase();
  if (
    lowerUrl.includes('javascript:') || 
    lowerUrl.includes('data:') || 
    lowerUrl.includes('vbscript:') || 
    lowerUrl.includes('mailto:') || 
    lowerUrl.includes('file:')
  ) {
    return { isValid: false, error: 'URL contains unsafe schemes or sequences.' };
  }

  return { isValid: true };
}

/**
 * A simpler boolean helper that can be reused anywhere edited links are accepted.
 */
export function isSafeEditableUrl(url: string): boolean {
  return validateFacebookUrl(url).isValid;
}

/**
 * Ensures a URL is safe to use in an href attribute.
 * Falls back to 'https://facebook.com' if invalid or unsafe.
 */
export function getSafeUrlForRender(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return '#';
  }
  
  const lowerUrl = trimmed.toLowerCase();
  if (
    lowerUrl.startsWith('javascript:') || 
    lowerUrl.startsWith('data:') || 
    lowerUrl.startsWith('vbscript:') || 
    lowerUrl.startsWith('mailto:') || 
    lowerUrl.startsWith('file:')
  ) {
    return 'https://facebook.com';
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return 'https://facebook.com';
}
