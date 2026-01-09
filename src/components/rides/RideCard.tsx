import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Users, ChevronRight } from "lucide-react";
import { Ride } from "@/types/ride";
import { format } from "date-fns";
import { useRides } from "@/contexts/RidesContext";
import { useAuth } from "@/contexts/AuthContext";
interface RideCardProps {
	ride: Ride;
}
export function RideCard({ ride }: RideCardProps) {
	const { user } = useAuth();
	const { hasJoinedRide, joinRide, leaveRide } = useRides();
	const [loading, setLoading] = useState(false);
	const joined = hasJoinedRide(ride.id);
	const formattedDate = format(new Date(ride.date), "EEE, MMM d");
	const timeWindow = `${ride.startTime} - ${ride.endTime}`;
	const seatsText =
		ride.seatsAvailable === 1 ? "1 seat" : `${ride.seatsAvailable} seats`;
	const handleJoinLeave = async () => {
		if (!user) return alert("You must be logged in to join a ride");
		setLoading(true);
		try {
			if (joined) {
				await leaveRide(ride.id);
			} else {
				const success = await joinRide(ride.id);
				if (!success)
					alert("Failed to join ride (maybe full or already joined)");
			}
		} catch (e) {
			console.error(e);
			alert("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};
	return (
		<Card className="overflow-hidden transition-all hover:shadow-md animate-fade-in">
			<CardContent className="p-4">
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0 space-y-3">
						{}
						<div className="flex items-start gap-3">
							<div className="flex flex-col items-center gap-1 pt-0.5">
								<div className="h-2 w-2 rounded-full bg-primary" />
								<div className="w-0.5 h-6 bg-border" />
								<div className="h-2 w-2 rounded-full bg-success" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-medium text-foreground truncate">
									{ride.source}
								</p>
								<p className="text-sm text-muted-foreground truncate mt-2">
									{ride.destination}
								</p>
							</div>
						</div>
						{}
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
							<span className="flex items-center gap-1">
								<Calendar className="h-3.5 w-3.5" />
								{formattedDate}
							</span>
							<span className="flex items-center gap-1">
								<Clock className="h-3.5 w-3.5" />
								{timeWindow}
							</span>
							<span className="flex items-center gap-1 text-success font-medium">
								<Users className="h-3.5 w-3.5" />
								{seatsText}
							</span>
						</div>
					</div>
					{}
					<div className="flex flex-col gap-2 items-end">
						<Button
							onClick={handleJoinLeave}
							disabled={loading || (!joined && ride.seatsAvailable === 0)}
							size="sm"
							variant={joined ? "destructive" : "default"}
						>
							{loading
								? joined
									? "Leaving..."
									: "Joining..."
								: joined
								? "Leave"
								: "Join"}
						</Button>
						<Button asChild variant="ghost" size="sm">
							<Link to={`/ride/${ride.id}`}>
								View
								<ChevronRight className="h-4 w-4 ml-1" />
							</Link>
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
