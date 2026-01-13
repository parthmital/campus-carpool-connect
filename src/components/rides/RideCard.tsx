import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, ChevronRight } from "lucide-react";
import type { Ride } from "@/types/ride";
import { format } from "date-fns";
import { useRides } from "@/contexts/RidesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface RideCardProps {
	ride: Ride;
}

export function RideCard({ ride }: RideCardProps) {
	const navigate = useNavigate();
	const { toast } = useToast();
	const { user } = useAuth();
	const { hasJoinedRide, joinRide, leaveRide } = useRides();

	const [loading, setLoading] = useState(false);

	const joined = hasJoinedRide(ride.id);
	const formattedDate = format(new Date(ride.date), "EEE, MMM d");
	const timeWindow = `${ride.startTime} - ${ride.endTime}`;
	const seatsText =
		ride.availableSeats === 1 ? "1 seat" : `${ride.availableSeats} seats`;

	const isCreator = !!user && ride.creatorId === user.id;
	const canJoin = !!user && !joined && !isCreator && ride.availableSeats > 0;

	const handleJoinLeave = async () => {
		if (!user) {
			toast({
				title: "Login required",
				description: "You must be logged in to join a ride.",
				variant: "destructive",
			});
			navigate("/login");
			return;
		}

		if (isCreator) {
			toast({
				title: "Not allowed",
				description: "You can’t join your own ride.",
				variant: "destructive",
			});
			return;
		}

		setLoading(true);
		try {
			if (joined) {
				const success = await leaveRide(ride.id);
				if (!success) {
					toast({
						title: "Could not leave",
						description: "Please try again.",
						variant: "destructive",
					});
				}
			} else {
				const success = await joinRide(ride.id);
				if (!success) {
					toast({
						title: "Could not join",
						description: "This ride may be full. Please try again.",
						variant: "destructive",
					});
				}
			}
		} catch (e) {
			console.error(e);
			toast({
				title: "Error",
				description: "An error occurred. Please try again.",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="animate-fade-in overflow-hidden transition-all hover:shadow-md">
			<CardContent className="p-4">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0 flex-1 space-y-3">
						<div className="flex items-start gap-3">
							<div className="flex flex-col items-center gap-1 pt-0.5">
								<div className="h-2 w-2 rounded-full bg-primary" />
								<div className="h-6 w-0.5 bg-border" />
								<div className="h-2 w-2 rounded-full bg-success" />
							</div>

							<div className="min-w-0 flex-1">
								<p className="truncate font-medium text-foreground">
									{ride.source}
								</p>
								<p className="mt-2 truncate text-sm text-muted-foreground">
									{ride.destination}
								</p>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
							<span className="flex items-center gap-1">
								<Calendar className="h-3.5 w-3.5" />
								{formattedDate}
							</span>

							<span className="flex items-center gap-1">
								<Clock className="h-3.5 w-3.5" />
								{timeWindow}
							</span>

							<span className="flex items-center gap-1 font-medium text-success">
								<Users className="h-3.5 w-3.5" />
								{seatsText}
							</span>
						</div>
					</div>

					<div className="flex flex-col items-end gap-2">
						{!isCreator && (
							<Button
								onClick={handleJoinLeave}
								disabled={loading || (!joined && !canJoin)}
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
						)}

						<Button asChild variant="ghost" size="sm">
							<Link to={`/ride/${ride.id}`}>
								View
								<ChevronRight className="ml-1 h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
