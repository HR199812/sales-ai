import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, User } from "../types/index";

interface AuthStore {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;

	setUser: (user: User) => void;
	setToken: (token: string) => void;
	login: (email: string, password: string) => Promise<void>;
	register: (
		email: string,
		password: string,
		firstName: string,
		lastName: string,
	) => Promise<void>;
	logout: () => void;
	clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
	persist(
		(set) => ({
			user: null,
			token: null,
			isAuthenticated: false,
			isLoading: false,
			error: null,

			setUser: (user) => set({ user, isAuthenticated: true }),
			setToken: (token) => set({ token }),

			login: async (email: string, password: string) => {
				set({ isLoading: true, error: null });
				try {
					const response = await fetch("/api/auth/login", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ email, password }),
					});

					if (!response.ok) {
						const err = await response.json();
						throw new Error(err.error || "Login failed");
					}

					const data: AuthResponse = await response.json();
					set({
						token: data.token,
						user: { id: data.userId, email: data.email } as User,
						isAuthenticated: true,
						isLoading: false,
					});

					localStorage.setItem("token", data.token);
				} catch (error) {
					set({
						error: error instanceof Error ? error.message : "Login failed",
						isLoading: false,
					});
					throw error;
				}
			},

			register: async (
				email: string,
				password: string,
				firstName: string,
				lastName: string,
			) => {
				set({ isLoading: true, error: null });
				try {
					const response = await fetch("/api/auth/register", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ email, password, firstName, lastName }),
					});

					if (!response.ok) {
						const err = await response.json();
						throw new Error(err.error || "Registration failed");
					}

					const data: AuthResponse = await response.json();
					set({
						token: data.token,
						user: { id: data.userId, email: data.email } as User,
						isAuthenticated: true,
						isLoading: false,
					});

					localStorage.setItem("token", data.token);
				} catch (error) {
					set({
						error:
							error instanceof Error ? error.message : "Registration failed",
						isLoading: false,
					});
					throw error;
				}
			},

			logout: () => {
				set({
					user: null,
					token: null,
					isAuthenticated: false,
				});
				localStorage.removeItem("token");
			},

			clearError: () => set({ error: null }),
		}),
		{
			name: "auth-store",
			partialize: (state) => ({
				token: state.token,
				user: state.user,
				isAuthenticated: state.isAuthenticated,
			}),
		},
	),
);
