import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      login: (userData, token) => set({ 
        user: userData, 
        token, 
        isAuthenticated: true,
        isAdmin: userData.role === 'admin' 
      }),
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        isAdmin: false 
      }),
    }),
    {
      name: 'prince-esquire-auth',
    }
  )
);
