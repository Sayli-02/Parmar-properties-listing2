import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  login: (email?: string, name?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      login: (email = 'client@parmargroup.com', name = 'Aditya Parmar') => {
        set({
          isLoggedIn: true,
          user: {
            name,
            email,
          },
        });
      },
      logout: () => {
        set({
          isLoggedIn: false,
          user: null,
        });
      },
    }),
    {
      name: 'parmar-client-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
