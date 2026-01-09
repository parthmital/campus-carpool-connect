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
import { Ride } from "@/types/ride";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
interface SearchFilters {
	source?: string;
	destination?: string;
	date?: string;
	startTime?: string;
	endTime?: string;
}
type RideEditablePatch = Partial<
	Omit<
		Ride,
		| "id"
		| "creatorId"
		| "creatorName"
		| "creatorEmail"
		| "creatorWhatsApp"
		| "createdAt"
		| "seatsAvailable"
	>
>;
interface RidesContextType {
	rides: Ride[];
	joinedRides: Set<string>;
	isLoading: boolean;
	error: string | null;
	realtimeStatus: string | null;
	createRide: (
		ride: Omit<Ride, "id" | "createdAt" | "seatsAvailable">
	) => Promise<void>;
	joinRide: (rideId: string) => Promise<boolean>;
	leaveRide: (rideId: string) => Promise<boolean>;
	deleteRide: (rideId: string) => Promise<void>;
	updateRide: (rideId: string, patch: RideEditablePatch) => Promise<void>;
	getMyRides: () => Ride[];
	getJoinedRides: () => Ride[];
	isMyRide: (rideId: string) => boolean;
	getRideById: (id: string) => Ride | undefined;
	searchRides: (filters: SearchFilters) => Ride[];
	hasJoinedRide: (rideId: string) => boolean;
	reload: () => Promise<void>;
}
const RidesContext = createContext<RidesContextType | undefined>(undefined);
const dbRideToRide = (r: any): Ride => ({
	id: r.id,
	source: r.source,
	destination: r.destination,
	date: r.date,
	startTime: r.start_time,
	endTime: r.end_time,
	seatsAvailable: r.seats_available,
	creatorId: r.creator_id,
	creatorName: r.creator_name,
	creatorEmail: r.creator_email,
	creatorWhatsApp: r.creator_whatsapp || "",
	createdAt: r.created_at,
});
export function RidesProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();
	const [rides, setRides] = useState<Ride[]>([]);
	const [joinedRides, setJoinedRides] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);
	const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
	const loadRides = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		const { data, error } = await supabase
			.from("rides")
			.select("*")
			.order("created_at", { ascending: false });
		if (error) {
			setError(error.message);
			setIsLoading(false);
			return;
		}
		setRides((data ?? []).map(dbRideToRide));
		setIsLoading(false);
	}, []);
	const loadJoinedRides = useCallback(async () => {
		if (!user) {
			setJoinedRides(new Set());
			return;
		}
		const { data, error } = await supabase
			.from("ride_participants")
			.select("ride_id")
			.eq("user_id", user.id);
		if (error) return;
		setJoinedRides(new Set((data ?? []).map((x) => x.ride_id)));
	}, [user]);
	const reload = useCallback(async () => {
		await Promise.all([loadRides(), loadJoinedRides()]);
	}, [loadRides, loadJoinedRides]);
	useEffect(() => {
		reload();
	}, [reload, user?.id]);
	useEffect(() => {
		const channel = supabase
			.channel("rides-realtime")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "rides" },
				() => reload()
			)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "ride_participants" },
				() => reload()
			)
			.subscribe((status) => setRealtimeStatus(status));
		channelRef.current = channel;
		return () => {
			if (channelRef.current) supabase.removeChannel(channelRef.current);
		};
	}, [reload]);
	const createRide = useCallback(
		async (ride) => {
			if (!user) throw new Error("Auth required");
			const { error } = await supabase.from("rides").insert({
				source: ride.source,
				destination: ride.destination,
				date: ride.date,
				start_time: ride.startTime,
				end_time: ride.endTime,
				seats_available: ride.seatsAvailable,
				creator_id: user.id,
				creator_name: ride.creatorName,
				creator_email: ride.creatorEmail,
				creator_whatsapp: ride.creatorWhatsApp || null,
			});
			if (error) throw error;
			await reload();
		},
		[user, reload]
	);
	const joinRide = useCallback(
		async (rideId: string) => {
			if (!user) throw new Error("Auth required");
			const { data, error } = await supabase.rpc("join_ride_transaction", {
				p_ride_id: rideId,
				p_user_id: user.id,
			});
			if (error || !data) return false;
			await reload();
			return true;
		},
		[user, reload]
	);
	const leaveRide = useCallback(
		async (rideId: string) => {
			if (!user) throw new Error("Auth required");
			const { data, error } = await supabase.rpc("leave_ride_transaction", {
				p_ride_id: rideId,
				p_user_id: user.id,
			});
			if (error || !data) return false;
			await reload();
			return true;
		},
		[user, reload]
	);
	const deleteRide = useCallback(
		async (rideId: string) => {
			if (!user) throw new Error("Auth required");
			const { error } = await supabase.from("rides").delete().eq("id", rideId);
			if (error) throw error;
			await reload();
		},
		[user, reload]
	);
	const updateRide = useCallback(
		async (rideId: string, patch: RideEditablePatch) => {
			if (!user) throw new Error("Auth required");
			const dbPatch: any = {};
			if (patch.source) dbPatch.source = patch.source;
			if (patch.destination) dbPatch.destination = patch.destination;
			if (patch.date) dbPatch.date = patch.date;
			if (patch.startTime) dbPatch.start_time = patch.startTime;
			if (patch.endTime) dbPatch.end_time = patch.endTime;
			const { error } = await supabase
				.from("rides")
				.update(dbPatch)
				.eq("id", rideId);
			if (error) throw error;
			await reload();
		},
		[user, reload]
	);
	const value: RidesContextType = {
		rides,
		joinedRides,
		isLoading,
		error,
		realtimeStatus,
		createRide,
		joinRide,
		leaveRide,
		deleteRide,
		updateRide,
		getMyRides: () =>
			user ? rides.filter((r) => r.creatorId === user.id) : [],
		getJoinedRides: () => rides.filter((r) => joinedRides.has(r.id)),
		isMyRide: (id) =>
			!!user && rides.some((r) => r.id === id && r.creatorId === user.id),
		getRideById: (id) => rides.find((r) => r.id === id),
		searchRides: (filters) =>
			rides.filter((r) => {
				if (r.seatsAvailable <= 0) return false;
				if (
					filters.source &&
					!r.source.toLowerCase().includes(filters.source.toLowerCase())
				)
					return false;
				if (
					filters.destination &&
					!r.destination
						.toLowerCase()
						.includes(filters.destination.toLowerCase())
				)
					return false;
				if (filters.date && r.date !== filters.date) return false;
				return true;
			}),
		hasJoinedRide: (id) => joinedRides.has(id),
		reload,
	};
	return (
		<RidesContext.Provider value={value}>{children}</RidesContext.Provider>
	);
}
export function useRides() {
	const ctx = useContext(RidesContext);
	if (!ctx) throw new Error("useRides must be used within RidesProvider");
	return ctx;
}
