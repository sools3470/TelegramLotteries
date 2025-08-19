import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTelegram } from "./use-telegram";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithTelegram: () => Promise<void>;
  loginWithGmail: (email: string, name: string, profileImage?: string) => Promise<void>;
  logout: () => void;
  authMethod: "telegram" | "gmail" | "guest" | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user: telegramUser, isInTelegram, isLoading: telegramLoading } = useTelegram();
  const [authMethod, setAuthMethod] = useState<"telegram" | "gmail" | "guest" | null>(null);
  const didAutoLoginRef = useRef(false);
  const queryClient = useQueryClient();
  const storedEmail = typeof window !== 'undefined'
    ? (() => {
        try {
          const raw = localStorage.getItem('authUser');
          return raw ? JSON.parse(raw)?.email || null : null;
        } catch {
          return null;
        }
      })()
    : null;
  
  // Check if user exists in database
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      if (telegramUser?.id) {
        try {
          const response = await fetch(`/api/auth/user?telegramId=${telegramUser.id}`);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.warn("Failed to fetch user by telegram ID:", error);
        }
      }
      
      // Try to get user from localStorage for Gmail users
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.email) {
          try {
            const response = await fetch(`/api/auth/user?email=${userData.email}`);
            if (response.ok) {
              return await response.json();
            }
          } catch (error) {
            console.warn("Failed to fetch user by email:", error);
          }
        }
      }
      return null;
    },
    retry: false,
    enabled: Boolean(telegramUser?.id || storedEmail || !isInTelegram),
  });

  // Auto-login with Telegram as soon as Telegram user arrives
  useEffect(() => {
    if (isInTelegram && telegramUser && !didAutoLoginRef.current) {
      didAutoLoginRef.current = true;
      loginWithTelegram();
    }
  }, [isInTelegram, telegramUser]);

  // Determine auth method
  useEffect(() => {
    if (user) {
      setAuthMethod(user.authMethod as "telegram" | "gmail" | "guest");
    } else {
      setAuthMethod(null);
    }
  }, [user]);

  const telegramLoginMutation = useMutation({
    mutationFn: async () => {
      if (!telegramUser) throw new Error("No Telegram user data");
      
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: telegramUser.id.toString(),
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name || "",
          profileImageUrl: undefined, // Not available in telegram user type
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to authenticate with Telegram");
      }
      
      return await response.json();
    },
    onSuccess: (userData) => {
      localStorage.setItem('authUser', JSON.stringify(userData));
      queryClient.setQueryData(['/api/auth/user'], userData);
      refetch();
    },
  });

  const gmailLoginMutation = useMutation({
    mutationFn: async ({ email, name, profileImage }: { email: string; name: string; profileImage?: string }) => {
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const response = await fetch("/api/auth/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          profileImageUrl: profileImage,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to authenticate with Gmail");
      }
      
      return await response.json();
    },
    onSuccess: (userData) => {
      localStorage.setItem('authUser', JSON.stringify(userData));
      queryClient.setQueryData(['/api/auth/user'], userData);
      refetch();
    },
  });

  const loginWithTelegram = async () => {
    if (telegramUser) {
      await telegramLoginMutation.mutateAsync();
    }
  };

  const loginWithGmail = async (email: string, name: string, profileImage?: string) => {
    await gmailLoginMutation.mutateAsync({ email, name, profileImage });
  };

  const logout = () => {
    localStorage.removeItem('authUser');
    queryClient.setQueryData(['/api/auth/user'], null);
    setAuthMethod(null);
    refetch();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: (telegramLoading || isLoading || telegramLoginMutation.isPending || gmailLoginMutation.isPending),
        isAuthenticated: !!user,
        loginWithTelegram,
        loginWithGmail,
        logout,
        authMethod,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}