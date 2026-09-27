import toast from 'react-hot-toast';

const baseStyle = {
  background: '#2b3b55',
  color: '#f9f1de',
  border: '1px solid rgba(197, 138, 61, 0.25)',
  fontSize: '13px',
  fontWeight: 600,
};

export const AI_RETRY_MESSAGE =
  'We could not finish reading that photo just now. Please wait about a minute, then try again.';

export const adminToast = {
  success: (message) =>
    toast.success(message, {
      style: baseStyle,
      iconTheme: { primary: '#c58a3d', secondary: '#2b3b55' },
    }),
  error: (message) =>
    toast.error(message, {
      style: { ...baseStyle, border: '1px solid rgba(248, 113, 113, 0.35)' },
      iconTheme: { primary: '#f87171', secondary: '#2b3b55' },
    }),
  info: (message) =>
    toast(message, {
      style: baseStyle,
      icon: 'ℹ️',
    }),
};

const isTransientNetworkError = (error) => {
  const status = error?.response?.status;
  const code = error?.code || '';
  const msg = String(error?.message || error?.response?.statusText || '');
  return (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    /timeout|timed out|aborted|network|gateway|504|502|503|ECONNRESET/i.test(msg)
  );
};

export const apiErrorMessage = (error, fallback = 'Something went wrong') => {
  if (isTransientNetworkError(error)) return AI_RETRY_MESSAGE;

  const rawMsg = String(error?.message || '');
  // Axios generic "Network Error" (often CORS/timeouts) → same friendly retry copy
  if (/^network error$/i.test(rawMsg.trim())) return AI_RETRY_MESSAGE;

  const fromApi =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.userMessage ||
    '';

  if (fromApi && !/timeout|gateway|504|502|html|nginx|<html|network error/i.test(String(fromApi))) {
    return fromApi;
  }

  // Raw axios/html noise → friendly AI message when it looks gateway-related
  if (/timeout|gateway|504|502|html|nginx|network error/i.test(rawMsg)) {
    return AI_RETRY_MESSAGE;
  }

  return fromApi || (rawMsg && !/^network error$/i.test(rawMsg) ? rawMsg : '') || fallback;
};
