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
	>
>;

interface RidesContextType {
	rides: Ride[];
	joinedRides: Set<string>;
	isLoading: boolean;
	error: string | null;
	realtimeStatus: string | null;

	createRide: (ride: Omit<Ride, "id" | "createdAt">) => Promise<void>;
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

const dbRideToRide = (dbRide: any): Ride => ({
	id: dbRide.id,
	source: dbRide.source,
	destination: dbRide.destination,
	date: dbRide.date,
	startTime: dbRide.start_time,
	endTime: dbRide.end_time,
	seatsAvailable: dbRide.seats_available,
	creatorId: dbRide.creator_id,
	creatorName: dbRide.creator_name,
	creatorEmail: dbRide.creator_email,
	creatorWhatsApp: dbRide.creator_whatsapp || "",
	createdAt: dbRide.created_at,
});

function abortableTimeout(ms: number) {
	const ac = new AbortController();
	const t = setTimeout(() => ac.abort(), ms);
	return { ac, cancel: () => clearTimeout(t) };
}

export function RidesProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();

	const [rides, setRides] = useState<Ride[]>([]);
	const [joinedRides, setJoinedRides] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);

	const realtimeEnabled = useMemo(() => true, []);
	const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

	const loadRides = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		const { ac, cancel } = abortableTimeout(15000);

		try {
			const {
				data,
				error: qErr,
				status,
			} = await supabase
				.from("rides")
				.select("*")
				.order("created_at", { ascending: false })
				.abortSignal(ac.signal);

			if (qErr) {
				console.error("Error loading rides:", { status, qErr });
				setError(qErr.message ?? "Failed to load rides");
				return;
			}

			setRides((data ?? []).map(dbRideToRide));
		} catch (e: any) {
			console.error("Unexpected error loading rides:", e);
			setError(e?.message ?? "Unexpected error loading rides");
		} finally {
			cancel();
			setIsLoading(false);
		}
	}, []);

	const loadJoinedRides = useCallback(async () => {
		if (!user) {
			setJoinedRides(new Set());
			return;
		}

		const { ac, cancel } = abortableTimeout(15000);

		try {
			const { data, error: qErr } = await supabase
				.from("ride_participants")
				.select("ride_id")
				.eq("user_id", user.id)
				.abortSignal(ac.signal);

			if (qErr) {
				console.error("Error loading joined rides:", qErr);
				return;
			}

			setJoinedRides(new Set((data ?? []).map((p: any) => p.ride_id)));
		} catch (e) {
			console.error("Unexpected error loading joined rides:", e);
		} finally {
			cancel();
		}
	}, [user]);

	const reload = useCallback(async () => {
		await Promise.all([loadRides(), loadJoinedRides()]);
	}, [loadRides, loadJoinedRides]);

	useEffect(() => {
		reload();
	}, [reload, user?.id]);

	useEffect(() => {
		if (!realtimeEnabled) return;

		const channel = supabase
			.channel("rides-changes")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "rides" },
				(payload) => {
					console.log("Realtime rides event received:", payload);
					loadRides();
				},
			)
			.subscribe((status, err) => {
				setRealtimeStatus(status);
				console.log("Realtime rides status:", status);
				if (status === "CHANNEL_ERROR" && err)
					console.error("Realtime error:", err);
				if (status === "TIMED_OUT") console.warn("Realtime timed out.");
			});

		channelRef.current = channel;

		return () => {
			try {
				if (channelRef.current) supabase.removeChannel(channelRef.current);
			} finally {
				channelRef.current = null;
			}
		};
	}, [loadRides, realtimeEnabled]);

	const createRide = useCallback(
		async (rideData: Omit<Ride, "id" | "createdAt">) => {
			if (!user) throw new Error("User must be authenticated to create a ride");

			const { data, error: qErr } = await supabase
				.from("rides")
				.insert({
					source: rideData.source,
					destination: rideData.destination,
					date: rideData.date,
					start_time: rideData.startTime,
					end_time: rideData.endTime,
					seats_available: rideData.seatsAvailable,
					creator_id: rideData.creatorId,
					creator_name: rideData.creatorName,
					creator_email: rideData.creatorEmail,
					creator_whatsapp: rideData.creatorWhatsApp || null,
				})
				.select()
				.single();

			if (qErr) {
				console.error("Error creating ride:", qErr);
				throw qErr;
			}

			if (data) setRides((prev) => [dbRideToRide(data), ...prev]);
		},
		[user],
	);

	const joinRide = useCallback(
		async (rideId: string): Promise<boolean> => {
			if (!user) throw new Error("User must be authenticated to join a ride");

			const ride = rides.find((r) => r.id === rideId);
			if (!ride || ride.seatsAvailable <= 0) return false;
			if (joinedRides.has(rideId)) return false;

			try {
				const { error: participantError } = await supabase
					.from("ride_participants")
					.insert({ ride_id: rideId, user_id: user.id });

				if (participantError) {
					console.error("Error joining ride:", participantError);
					return false;
				}

				console.log(`Attempting to join ride ${rideId}. Current seats: ${ride.seatsAvailable}. New seats: ${ride.seatsAvailable - 1}`);
				const { error: updateError } = await supabase
					.from("rides")
					.update({ seats_available: ride.seatsAvailable - 1 })
					.eq("id", rideId);
				if (updateError) {
					console.error("Supabase update error during join:", updateError);
				} else {
					console.log("Supabase update successful during join.");
				}

				if (updateError) {
					console.error("Error updating seats:", updateError);
					await supabase
						.from("ride_participants")
						.delete()
						.eq("ride_id", rideId)
						.eq("user_id", user.id);
					return false;
				}

				setJoinedRides((prev) => new Set(prev).add(rideId));
				setRides((prev) =>
					prev.map((r) =>
						r.id === rideId
							? { ...r, seatsAvailable: r.seatsAvailable - 1 }
							: r,
					),
				);

				return true;
			} catch (e) {
				console.error("Unexpected error joining ride:", e);
				return false;
			}
		},
		[user, rides, joinedRides],
	);

	const leaveRide = useCallback(
		async (rideId: string): Promise<boolean> => {
			if (!user) throw new Error("User must be authenticated to leave a ride");
			if (!joinedRides.has(rideId)) return false;

			const ride = rides.find((r) => r.id === rideId);
			if (!ride) return false;

			try {
				const { error: delErr } = await supabase
					.from("ride_participants")
					.delete()
					.eq("ride_id", rideId)
					.eq("user_id", user.id);

				// Supabase delete should be combined with filters like eq(). [web:118]
				if (delErr) {
					console.error("Error leaving ride (delete participant):", delErr);
					return false;
				}

				console.log(`Attempting to leave ride ${rideId}. Current seats: ${ride.seatsAvailable}. New seats: ${ride.seatsAvailable + 1}`);
				const { error: updErr } = await supabase
					.from("rides")
					.update({ seats_available: ride.seatsAvailable + 1 })
					.eq("id", rideId);
				if (updErr) {
					console.error("Supabase update error during leave:", updErr);
				} else {
					console.log("Supabase update successful during leave.");
				}

				if (updErr) {
					console.error("Error restoring seat count:", updErr);
					await supabase
						.from("ride_participants")
						.insert({ ride_id: rideId, user_id: user.id });
					return false;
				}

				setJoinedRides((prev) => {
					const next = new Set(prev);
					next.delete(rideId);
					return next;
				});

				setRides((prev) =>
					prev.map((r) =>
						r.id === rideId
							? { ...r, seatsAvailable: r.seatsAvailable + 1 }
							: r,
					),
				);

				return true;
			} catch (e) {
				console.error("Unexpected error leaving ride:", e);
				return false;
			}
		},
		[user, joinedRides, rides],
	);

	const deleteRide = useCallback(
		async (rideId: string) => {
			if (!user) throw new Error("User must be authenticated to delete a ride");

			const prev = rides;
			setRides((curr) => curr.filter((r) => r.id !== rideId));

			const { error: qErr } = await supabase
				.from("rides")
				.delete()
				.eq("id", rideId);

			// Supabase delete should be combined with filters like eq(). [web:118]
			if (qErr) {
				setRides(prev);
				throw qErr;
			}

			setJoinedRides((curr) => {
				const next = new Set(curr);
				next.delete(rideId);
				return next;
			});
		},
		[user, rides],
	);

	const updateRide = useCallback(
		async (rideId: string, patch: RideEditablePatch) => {
			if (!user) throw new Error("User must be authenticated to edit a ride");

			const dbPatch: any = {};
			if (patch.source !== undefined) dbPatch.source = patch.source;
			if (patch.destination !== undefined)
				dbPatch.destination = patch.destination;
			if (patch.date !== undefined) dbPatch.date = patch.date;
			if (patch.startTime !== undefined) dbPatch.start_time = patch.startTime;
			if (patch.endTime !== undefined) dbPatch.end_time = patch.endTime;
			if (patch.seatsAvailable !== undefined)
				dbPatch.seats_available = patch.seatsAvailable;

			const { data, error } = await supabase
				.from("rides")
				.update(dbPatch)
				.eq("id", rideId)
				.select()
				.single();

			// Supabase update() should be combined with filters like eq(), and select() returns rows. [web:220]
			if (error) throw error;

			setRides((prev) =>
				prev.map((r) => (r.id === rideId ? dbRideToRide(data) : r)),
			);
		},
		[user],
	);

	const getRideById = useCallback(
		(id: string) => rides.find((r) => r.id === id),
		[rides],
	);

	const hasJoinedRide = useCallback(
		(rideId: string) => joinedRides.has(rideId),
		[joinedRides],
	);

	const getMyRides = useCallback(() => {
		if (!user) return [];
		return rides.filter((r) => r.creatorId === user.id);
	}, [rides, user]);

	const getJoinedRidesList = useCallback(() => {
		return rides.filter((r) => joinedRides.has(r.id));
	}, [rides, joinedRides]);

	const isMyRide = useCallback(
		(rideId: string) => {
			const r = rides.find((x) => x.id === rideId);
			return !!user && !!r && r.creatorId === user.id;
		},
		[rides, user],
	);

	const searchRides = useCallback(
		(filters: SearchFilters): Ride[] => {
			return rides.filter((ride) => {
				if (ride.seatsAvailable === 0) return false;
				if (
					filters.source &&
					!ride.source.toLowerCase().includes(filters.source.toLowerCase())
				)
					return false;
				if (
					filters.destination &&
					!ride.destination
						.toLowerCase()
						.includes(filters.destination.toLowerCase())
				)
					return false;
				if (filters.date && ride.date !== filters.date) return false;
				if (filters.startTime && ride.startTime < filters.startTime)
					return false;
				if (filters.endTime && ride.endTime > filters.endTime) return false;
				return true;
			});
		},
		[rides],
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
		getMyRides,
		getJoinedRides: getJoinedRidesList,
		isMyRide,
		getRideById,
		searchRides,
		hasJoinedRide,
		reload,
	};

	return (
		<RidesContext.Provider value={value}>{children}</RidesContext.Provider>
	);
}

export function useRides() {
	const ctx = useContext(RidesContext);
	if (!ctx) throw new Error("useRides must be used within a RidesProvider");
	return ctx;
}
