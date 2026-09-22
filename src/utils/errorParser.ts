/**
 * Centralized API Error Parser for Quantum Factory Brain
 * Extracts human-readable error messages from complex backend responses,
 * preventing "[object Object]" in the UI while preserving the real root cause.
 */

export interface ParsedApiError {
  message: string;
  errorCode?: string;
  statusCode?: number;
  details?: any;
}

export function parseApiError(error: any): ParsedApiError {
  if (!error) {
    return { message: 'An unknown error occurred' };
  }

  // If already a simple string
  if (typeof error === 'string') {
    // Check if it's stringified JSON
    if (error.trim().startsWith('{') || error.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(error);
        return parseApiError(parsed);
      } catch {
        return { message: error };
      }
    }
    return { message: error };
  }

  // Handle standard JavaScript Error object where message might be stringified or object
  if (error instanceof Error) {
    if (error.message) {
      if (error.message.trim().startsWith('{') || error.message.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(error.message);
          return parseApiError(parsed);
        } catch {
          return { message: error.message };
        }
      }
      return { message: error.message };
    }
  }

  // Extract error code if present
  const errorCode = error.error_code || error.errorCode || error.code;
  const statusCode = error.statusCode || error.status;

  // Priority search for the most descriptive message string
  let message = '';

  if (typeof error.message === 'string' && error.message.trim() && error.message !== '[object Object]') {
    message = error.message;
  } else if (typeof error.error === 'string' && error.error.trim()) {
    message = error.error;
  } else if (typeof error.error?.message === 'string' && error.error.message.trim()) {
    message = error.error.message;
  } else if (typeof error.details === 'string' && error.details.trim()) {
    message = error.details;
  } else if (typeof error.details?.message === 'string' && error.details.message.trim()) {
    message = error.details.message;
  } else if (typeof error.statusText === 'string' && error.statusText.trim()) {
    message = error.statusText;
  }

  // If no string found yet, check validation error arrays/objects
  if (!message && error.errors) {
    if (Array.isArray(error.errors)) {
      const messages = error.errors
        .map((e: any) => (typeof e === 'string' ? e : e?.message || JSON.stringify(e)))
        .filter(Boolean);
      if (messages.length > 0) {
        message = messages.join('; ');
      }
    } else if (typeof error.errors === 'object') {
      const messages = Object.entries(error.errors)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : v}`)
        .filter(Boolean);
      if (messages.length > 0) {
        message = messages.join('; ');
      }
    }
  }

  // Fallback: safely stringify if non-empty object
  if (!message) {
    try {
      const serialized = JSON.stringify(error, null, 2);
      if (serialized && serialized !== '{}') {
        message = serialized.length > 300 ? serialized.slice(0, 300) + '...' : serialized;
      } else {
        message = 'Request failed with unspecified error.';
      }
    } catch {
      message = String(error);
    }
  }

  // Append error code if helpful
  if (errorCode && !message.includes(String(errorCode))) {
    // message remains clean, errorCode is returned in structured format
  }

  return {
    message,
    errorCode: errorCode ? String(errorCode) : undefined,
    statusCode: typeof statusCode === 'number' ? statusCode : undefined,
    details: error.details || error.data || undefined,
  };
}

/**
 * Convenience helper returning just the human-readable string
 */
export function getApiErrorMessage(error: any): string {
  const parsed = parseApiError(error);
  if (parsed.errorCode && !parsed.message.includes(parsed.errorCode)) {
    return `[${parsed.errorCode}] ${parsed.message}`;
  }
  return parsed.message;
}
