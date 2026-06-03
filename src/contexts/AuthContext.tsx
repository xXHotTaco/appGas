import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getMe, loginUser, registerUser } from "@/lib/api";
import type { AuthUser } from "@/types/fuel";

const TOKEN_KEY = "@appGas:token";
const USER_KEY = "@appGas:user";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  }, []);

  const persistSession = useCallback(
    async (nextToken: string, nextUser: AuthUser) => {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, nextToken],
        [USER_KEY, JSON.stringify(nextUser)],
      ]);
      setToken(nextToken);
      setUser(nextUser);
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (!isMounted) return;

        if (savedToken) {
          setToken(savedToken);

          if (savedUser) {
            setUser(JSON.parse(savedUser) as AuthUser);
          }

          try {
            const me = await getMe(savedToken);
            if (isMounted) {
              setUser(me.user);
              await AsyncStorage.setItem(USER_KEY, JSON.stringify(me.user));
            }
          } catch {
            await clearSession();
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await loginUser(email, password);
      await persistSession(data.token, data.user);
    },
    [persistSession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await registerUser(name, email, password);
      await persistSession(data.token, data.user);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const refreshMe = useCallback(async () => {
    if (!token) return;

    try {
      const data = await getMe(token);
      setUser(data.user);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } catch {
      await clearSession();
    }
  }, [clearSession, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      refreshMe,
    }),
    [isLoading, login, logout, refreshMe, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return value;
}
