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
const ALLOWED_DOMAINS = ["vitstudent.ac.in"];

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const profileLoadInFlight = useRef<Promise<void> | null>(null);

	const mapProfileToUser = useCallback(
		(p: any): User => ({
			id: p.id,
			name: p.name,
			email: p.email,
			whatsApp: p.whatsapp || undefined,
			createdAt: p.created_at,
		}),
		[]
	);

	const loadUserProfile = useCallback(
		async (sbUser: any) => {
			if (profileLoadInFlight.current) return;
			profileLoadInFlight.current = (async () => {
				try {
					const domain = sbUser.email?.split("@")[1]?.toLowerCase();
					if (!domain || !ALLOWED_DOMAINS.some((d) => domain.endsWith(d))) {
						await supabase.auth.signOut();
						return;
					}
					const { data: profile } = await supabase
						.from("user_profiles")
						.select("*")
						.eq("id", sbUser.id)
						.maybeSingle();
					if (profile) {
						setUser(mapProfileToUser(profile));
					} else {
						const { data: neu } = await supabase
							.from("user_profiles")
							.insert({
								id: sbUser.id,
								email: sbUser.email!,
								name:
									sbUser.user_metadata?.full_name ||
									sbUser.email!.split("@")[0],
							})
							.select("*")
							.single();
						if (neu) setUser(mapProfileToUser(neu));
					}
				} finally {
					setIsLoading(false);
					profileLoadInFlight.current = null;
				}
			})();
		},
		[mapProfileToUser]
	);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (session?.user) loadUserProfile(session.user);
			else setIsLoading(false);
		});
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_OUT") setUser(null);
			else if (session?.user) loadUserProfile(session.user);
		});
		return () => subscription.unsubscribe();
	}, [loadUserProfile]);

	const login = async () => {
		setIsLoading(true);
		await supabase.auth.signInWithOAuth({
			provider: "google",
			options: { redirectTo: window.location.origin },
		});
	};

	const logout = async () => {
		setIsLoading(true);
		await supabase.auth.signOut();
		setUser(null);
		setIsLoading(false);
	};

	const setWhatsApp = async (num: string) => {
		if (!user) return;
		const { error } = await supabase
			.from("user_profiles")
			.update({ whatsapp: num })
			.eq("id", user.id);
		if (error) throw error;
		setUser((prev) => (prev ? { ...prev, whatsApp: num } : null));
	};

	const value = useMemo(
		() => ({
			user,
			isAuthenticated: !!user,
			isLoading,
			needsWhatsApp: !!user && !user.whatsApp,
			login,
			logout,
			setWhatsApp,
		}),
		[user, isLoading]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within AuthProvider");
	return context;
};
