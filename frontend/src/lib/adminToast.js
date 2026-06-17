import toast from 'react-hot-toast';

const baseStyle = {
  background: '#2b3b55',
  color: '#f9f1de',
  border: '1px solid rgba(197, 138, 61, 0.25)',
  fontSize: '13px',
  fontWeight: 600,
};

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

export const apiErrorMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || error?.userMessage || error?.message || fallback;
