import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
if (!supabaseUrl || !supabaseAnonKey) {
	console.warn(
		"Supabase URL and Anon Key are required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
	);
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
	},
});
export interface Database {
	public: {
		Tables: {
			rides: {
				Row: {
					id: string;
					source: string;
					destination: string;
					date: string;
					start_time: string;
					end_time: string;
					total_seats: number;
					seats_available: number;
					creator_id: string;
					creator_name: string;
					creator_email: string;
					creator_whatsapp: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					source: string;
					destination: string;
					date: string;
					start_time: string;
					end_time: string;
					total_seats: number;
					seats_available: number;
					creator_id: string;
					creator_name: string;
					creator_email: string;
					creator_whatsapp?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					source?: string;
					destination?: string;
					date?: string;
					start_time?: string;
					end_time?: string;
					total_seats?: number;
					seats_available?: number;
					creator_id?: string;
					creator_name?: string;
					creator_email?: string;
					creator_whatsapp?: string | null;
					created_at?: string;
				};
			};
			ride_participants: {
				Row: {
					id: string;
					ride_id: string;
					user_id: string;
					joined_at: string;
				};
				Insert: {
					id?: string;
					ride_id: string;
					user_id: string;
					joined_at?: string;
				};
				Update: {
					id?: string;
					ride_id?: string;
					user_id?: string;
					joined_at?: string;
				};
			};
			user_profiles: {
				Row: {
					id: string;
					email: string;
					name: string;
					photo_url: string | null;
					whatsapp: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					email: string;
					name: string;
					photo_url?: string | null;
					whatsapp?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					name?: string;
					photo_url?: string | null;
					whatsapp?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
		};
	};
}
