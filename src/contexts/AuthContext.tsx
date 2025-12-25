import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types/ride";

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	needsWhatsApp: boolean;
	login: () => Promise<void>;
	logout: () => Promise<void>;
	setWhatsApp: (whatsApp: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Allowed email domains for college emails
const ALLOWED_DOMAINS = ["vitstudent.ac.in"];

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Prevent overlapping profile loads (SIGNED_IN + TOKEN_REFRESHED etc.)
	const profileLoadInFlight = useRef<Promise<void> | null>(null);

	const mapProfileToUser = (profile: any): User => ({
		id: profile.id,
		name: profile.name,
		email: profile.email,
		photoUrl: profile.photo_url || undefined,
		whatsApp: profile.whatsapp || undefined,
	});

	const validateCollegeEmailOrSignOut = useCallback(
		async (supabaseUser: SupabaseUser) => {
			const email = supabaseUser.email ?? "";
			const emailDomain = email.split("@")[1]?.toLowerCase();

			if (
				!emailDomain ||
				!ALLOWED_DOMAINS.some((domain) =>
					emailDomain.endsWith(domain.toLowerCase()),
				)
			) {
				await supabase.auth.signOut();
				alert("Please sign in with a college email address");
				return false;
			}

			return true;
		},
		[],
	);

	const loadUserProfile = useCallback(
		async (supabaseUser: SupabaseUser) => {
			// Deduplicate concurrent calls
			if (profileLoadInFlight.current) return profileLoadInFlight.current;

			const run = (async () => {
				try {
					console.log("Loading user profile for:", supabaseUser.email);

					const ok = await validateCollegeEmailOrSignOut(supabaseUser);
					if (!ok) {
						setUser(null);
						return;
					}

					console.log("Fetching user profile for ID:", supabaseUser.id);
					console.log(
						"Supabase URL configured:",
						!!import.meta.env.VITE_SUPABASE_URL,
					);

					const { data: profile, error } = await supabase
						.from("user_profiles")
						.select("*")
						.eq("id", supabaseUser.id)
						.single();

					console.log("Profile fetch result:", { profile, error });

					if (!error && profile) {
						setUser(mapProfileToUser(profile));
						return;
					}

					// PGRST116: "JSON object requested, multiple (or no) rows returned"
					// Commonly treated as "no rows" when using .single()
					if (error?.code === "PGRST116") {
						console.log("Profile doesn't exist, creating new profile");

						const { data: newProfile, error: createError } = await supabase
							.from("user_profiles")
							.insert({
								id: supabaseUser.id,
								email: supabaseUser.email!,
								name:
									supabaseUser.user_metadata?.full_name ||
									supabaseUser.email!.split("@")[0],
								photo_url:
									supabaseUser.user_metadata?.avatar_url ||
									supabaseUser.user_metadata?.picture,
							})
							.select()
							.single();

						if (createError) {
							console.error("Error creating profile:", createError);

							if (
								createError.code === "PGRST205" ||
								createError.message?.includes("Could not find the table") ||
								createError.message?.includes("404")
							) {
								alert(
									"Database tables not found. Please run the SQL schema script (supabase-schema.sql) in your Supabase SQL Editor to create the required tables.",
								);
							} else {
								alert("Failed to create user profile. Please try again.");
							}

							setUser(null);
							return;
						}

						setUser(mapProfileToUser(newProfile));
						return;
					}

					if (
						error?.code === "PGRST205" ||
						error?.message?.includes("Could not find the table") ||
						error?.message?.includes("404")
					) {
						alert(
							"Database tables not found. Please run the SQL schema script (supabase-schema.sql) in your Supabase SQL Editor to create the required tables.",
						);
						setUser(null);
						return;
					}

					console.error("Error fetching profile:", error);
					alert("Failed to load user profile. Please try again.");
					setUser(null);
				} catch (e) {
					console.error("Error loading user profile:", e);
					alert("An unexpected error occurred. Please try again.");
					setUser(null);
				} finally {
					console.log("Setting isLoading to false");
					setIsLoading(false);
					profileLoadInFlight.current = null;
				}
			})();

			profileLoadInFlight.current = run;
			return run;
		},
		[validateCollegeEmailOrSignOut],
	);

	useEffect(() => {
		let mounted = true;

		// Initial session
		supabase.auth
			.getSession()
			.then(({ data: { session } }) => {
				if (!mounted) return;

				if (session?.user) {
					setIsLoading(true);
					loadUserProfile(session.user);
				} else {
					setUser(null);
					setIsLoading(false);
				}
			})
			.catch((e) => {
				console.error("getSession error:", e);
				if (!mounted) return;
				setUser(null);
				setIsLoading(false);
			});

		// IMPORTANT: do NOT make this callback async / do NOT await inside it.
		// Supabase docs warn this can deadlock; defer async work with setTimeout. [web:61]
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			console.log("Auth state changed:", event, session?.user?.email);

			if (event === "SIGNED_OUT") {
				setUser(null);
				setIsLoading(false);
				return;
			}

			if (
				(event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
				session?.user
			) {
				setIsLoading(true);

				setTimeout(() => {
					loadUserProfile(session.user).catch(console.error);
				}, 0);

				return;
			}
		});

		return () => {
			mounted = false;
			subscription.unsubscribe();
		};
	}, [loadUserProfile]);

	const login = useCallback(async () => {
		setIsLoading(true);
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/`,
					queryParams: {
						access_type: "offline",
						prompt: "consent",
					},
				},
			});

			if (error) {
				console.error("Error signing in:", error);
				alert("Failed to sign in. Please try again.");
				setIsLoading(false);
			}
		} catch (e) {
			console.error("Unexpected error during login:", e);
			setIsLoading(false);
		}
	}, []);

	const logout = useCallback(async () => {
		setIsLoading(true);
		try {
			await supabase.auth.signOut();
		} finally {
			setUser(null);
			setIsLoading(false);
		}
	}, []);

	const setWhatsApp = useCallback(
		async (whatsApp: string) => {
			if (!user) return;

			const { error } = await supabase
				.from("user_profiles")
				.update({ whatsapp: whatsApp, updated_at: new Date().toISOString() })
				.eq("id", user.id);

			if (error) {
				console.error("Error updating WhatsApp:", error);
				throw error;
			}

			setUser((prev) => (prev ? { ...prev, whatsApp } : null));
		},
		[user],
	);

	const needsWhatsApp = !!user && !user.whatsApp;

	const value = useMemo<AuthContextType>(
		() => ({
			user,
			isAuthenticated: !!user,
			isLoading,
			needsWhatsApp,
			login,
			logout,
			setWhatsApp,
		}),
		[user, isLoading, needsWhatsApp, login, logout, setWhatsApp],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
