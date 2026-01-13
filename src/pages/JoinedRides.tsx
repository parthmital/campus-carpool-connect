import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRides } from "@/contexts/RidesContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function JoinedRides() {
	const navigate = useNavigate();
	const { toast } = useToast();
	const { user } = useAuth();
	const { getJoinedRides, isLoading, leaveRide } = useRides();

	const joined = getJoinedRides();

	const handleLeave = async (rideId: string) => {
		const ride = joined.find((x) => x.id === rideId);

		if (ride && user && ride.creatorId === user.id) {
			toast({
				title: "Not allowed",
				description: "You can't leave your own ride.",
				variant: "destructive",
			});
			return;
		}

		const ok = window.confirm("Leave this ride?");
		if (!ok) return;

		const success = await leaveRide(rideId);
		if (success) {
			toast({ title: "Left ride", description: "You have left this ride." });
		} else {
			toast({
				title: "Could not leave",
				description: "Please try again.",
				variant: "destructive",
			});
		}
	};

	return (
		<AppLayout>
			<div className="space-y-4">
				<h2 className="text-sm font-medium text-muted-foreground">
					Joined rides
				</h2>

				{isLoading ? (
					<p className="text-muted-foreground">Loading...</p>
				) : joined.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-center">
							<p className="text-muted-foreground">No joined rides yet.</p>
							<Button
								className="mt-3"
								variant="outline"
								onClick={() => navigate("/")}
							>
								Browse rides
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-3">
						{joined.map((r) => {
							const isMyRide = !!user && r.creatorId === user.id;

							return (
								<Card key={r.id}>
									<CardHeader className="pb-2">
										<CardTitle className="text-base">
											{r.source} → {r.destination}
										</CardTitle>
									</CardHeader>

									<CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
										<div className="text-sm text-muted-foreground">
											{r.date} • {r.startTime}–{r.endTime} • {r.availableSeats}{" "}
											seats
										</div>

										<div className="flex gap-2">
											<Button
												variant="outline"
												onClick={() => navigate(`/ride/${r.id}`)}
											>
												View
											</Button>

											{!isMyRide && (
												<Button
													variant="outline"
													onClick={() => handleLeave(r.id)}
												>
													Leave
												</Button>
											)}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</AppLayout>
	);
}
