import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const isSellerUser = (user) =>
  user?.role === 'SELLER' || user?.accountType === 'pos';

const isAdminUser = (user) =>
  user && ['admin', 'staff', 'ADMIN'].includes(user.role);

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isSeller: false,
      login: (userData, token) =>
        set({
          user: { ...userData, accountType: userData.accountType || 'user' },
          token,
          isAuthenticated: true,
          isAdmin: isAdminUser(userData),
          isSeller: isSellerUser(userData),
        }),
      posLogin: (userData, token) =>
        set({
          user: { ...userData, accountType: 'pos' },
          token,
          isAuthenticated: true,
          isAdmin: false,
          isSeller: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
          isSeller: false,
        }),
      updateUser: (userData) =>
        set((state) => ({
          user: { ...(state.user || {}), ...userData },
        })),
    }),
    {
      name: 'prince-esquire-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        isSeller: state.isSeller,
      }),
      merge: (persisted, current) => {
        const p = persisted && typeof persisted === 'object' ? persisted : {};
        const c = current && typeof current === 'object' ? current : {};
        // Keep in-memory login if rehydration finishes after posLogin/admin login
        if (c.isAuthenticated && c.token) return { ...c, ...p, ...c };
        return { ...c, ...p };
      },
    }
  )
);

/** True when user is admin, staff, or POS seller */
export const isStaffSession = (state) =>
  state.isAuthenticated &&
  (state.isAdmin || state.isSeller || isSellerUser(state.user) || isAdminUser(state.user));
