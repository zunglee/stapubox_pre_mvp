import { apiRequest } from "./queryClient";

export interface AuthState {
  user: any | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
}

class AuthManager {
  private listeners: Set<(state: AuthState) => void> = new Set();
  private state: AuthState = {
    user: null,
    sessionToken: localStorage.getItem("sessionToken"),
    isAuthenticated: false
  };

  constructor() {
    // Initialize authentication state
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Check for existing session token
    const token = this.state.sessionToken;
    if (token) {
      try {
        const response = await fetch("/api/users/profile", {
          credentials: "include"  // Use cookies instead of headers
        });
        
        if (response.ok) {
          const data = await response.json();
          this.updateState({
            user: data.user,
            sessionToken: token,
            isAuthenticated: true
          });
        } else {
          this.logout();
        }
      } catch (error) {
        this.logout();
      }
    }
  }

  private updateState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): AuthState {
    return this.state;
  }

  async sendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      await apiRequest("POST", "/api/auth/send-otp", { phoneNumber });
      return { success: true, message: "OTP sent successfully" };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to send OTP" 
      };
    }
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<{ 
    success: boolean; 
    message: string; 
    requiresRegistration?: boolean;
    user?: any;
  }> {
    try {
      const response = await apiRequest("POST", "/api/auth/verify-otp", { phoneNumber, otp });
      const data = await response.json();
      
      if (data.requiresRegistration) {
        // Store the OTP session token for profile registration
        if (data.sessionToken) {
          localStorage.setItem("sessionToken", data.sessionToken);
          this.updateState({
            sessionToken: data.sessionToken,
            isAuthenticated: false // Not fully authenticated until profile complete
          });
        }
        return { 
          success: true, 
          message: "OTP verified", 
          requiresRegistration: true 
        };
      }
      
      if (data.sessionToken) {
        localStorage.setItem("sessionToken", data.sessionToken);
        this.updateState({
          user: data.user,
          sessionToken: data.sessionToken,
          isAuthenticated: true
        });
        
        return { 
          success: true, 
          message: "Login successful",
          user: data.user
        };
      }
      
      return { success: false, message: "Invalid response" };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Verification failed" 
      };
    }
  }

  async register(userData: any): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const response = await apiRequest("POST", "/api/users/register", userData);
      const data = await response.json();
      
      if (data.sessionToken) {
        localStorage.setItem("sessionToken", data.sessionToken);
        this.updateState({
          user: data.user,
          sessionToken: data.sessionToken,
          isAuthenticated: true
        });
        
        return { 
          success: true, 
          message: "Registration successful",
          user: data.user
        };
      }
      
      return { success: false, message: "Registration failed" };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Registration failed" 
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.state.sessionToken) {
        await apiRequest("POST", "/api/auth/logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("sessionToken");
      this.updateState({
        user: null,
        sessionToken: null,
        isAuthenticated: false
      });
    }
  }

  getAuthHeaders(): HeadersInit {
    if (this.state.sessionToken) {
      return {
        "Authorization": `Bearer ${this.state.sessionToken}`
      };
    }
    return {};
  }
}

export const authManager = new AuthManager();

// React hook for using auth state
import { useState, useEffect } from "react";

export function useAuth() {
  const [authState, setAuthState] = useState(authManager.getState());

  useEffect(() => {
    return authManager.subscribe(setAuthState);
  }, []);

  return authState;
}
