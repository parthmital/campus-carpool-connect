import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRides } from "@/contexts/RidesContext";
import { useNavigate } from "react-router-dom";
import { Car, Pencil, Trash2 } from "lucide-react";

export default function ManageRides() {
	const navigate = useNavigate();
	const { toast } = useToast();
	const { user } = useAuth();
	const { getMyRides, deleteRide, isLoading } = useRides();

	const myRides = getMyRides();

	useEffect(() => {
		if (!user) {
			navigate("/login");
		}
	}, [user, navigate]);

	const handleDelete = async (rideId: string) => {
		const ok = window.confirm("Delete this ride? This cannot be undone.");
		if (!ok) return;

		try {
			await deleteRide(rideId);
			toast({ title: "Ride deleted", description: "Your ride was removed." });
		} catch (e: any) {
			console.error(e);
			toast({
				title: "Delete failed",
				description: e?.message ?? "Could not delete ride",
				variant: "destructive",
			});
		}
	};

	return (
		<AppLayout>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-medium text-muted-foreground">
						My rides
					</h2>

					<Button onClick={() => navigate("/create")}>
						<Car className="mr-2 h-4 w-4" />
						Create ride
					</Button>
				</div>

				{isLoading ? (
					<Card>
						<CardContent className="py-8 text-center">
							<p className="text-muted-foreground">Loading...</p>
						</CardContent>
					</Card>
				) : myRides.length === 0 ? (
					<Card>
						<CardHeader>
							<CardTitle className="text-base">No rides yet</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							Create a ride and it will show up here.
						</CardContent>
					</Card>
				) : (
					<div className="space-y-3">
						{myRides.map((r) => (
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

										<Button
											variant="outline"
											onClick={() => navigate(`/ride/${r.id}/edit`)}
										>
											<Pencil className="mr-2 h-4 w-4" />
											Edit
										</Button>

										<Button
											variant="destructive"
											onClick={() => handleDelete(r.id)}
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Delete
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</AppLayout>
	);
}
