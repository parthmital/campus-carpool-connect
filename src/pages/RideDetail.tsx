import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useRides } from "@/contexts/RidesContext";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	Clock,
	Copy,
	ExternalLink,
	MessageCircle,
	Pencil,
	Trash2,
	User as UserIcon,
	Users,
} from "lucide-react";

export default function RideDetail() {
	const { id } = useParams<{ id: string }>();
	const rideId = id || "";
	const navigate = useNavigate();
	const { toast } = useToast();
	const { user } = useAuth();
	const { getRideById, joinRide, leaveRide, hasJoinedRide, deleteRide } =
		useRides();

	const [loading, setLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const ride = getRideById(rideId);
	const joined = hasJoinedRide(rideId);

	if (!ride) {
		return (
			<AppLayout>
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
					<h2 className="text-lg font-medium">Ride not found</h2>
					<Button onClick={() => navigate("/")} className="mt-4">
						Back to Home
					</Button>
				</div>
			</AppLayout>
		);
	}

	const isCreator = ride.creatorId === user?.id;
	const canJoin = !!user && ride.availableSeats > 0 && !isCreator && !joined;

	const handleJoinLeave = async () => {
		if (!user) {
			toast({
				title: "Login required",
				description: "Please sign in to join.",
			});
			navigate("/login");
			return;
		}

		setLoading(true);
		try {
			const success = joined
				? await leaveRide(ride.id)
				: await joinRide(ride.id);
			if (success) {
				toast({ title: joined ? "Left ride" : "Joined ride" });
			}
		} catch (e) {
			toast({ title: "Error", variant: "destructive" });
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!window.confirm("Delete this ride?")) return;
		setIsDeleting(true);
		try {
			await deleteRide(ride.id);
			navigate("/");
		} finally {
			setIsDeleting(false);
		}
	};

	const openWhatsApp = () => {
		const msg = encodeURIComponent(
			`Hi ${ride.creatorName}, I've joined your ride from ${ride.source} to ${ride.destination}.`
		);
		window.open(`https://wa.me/${ride.creatorWhatsApp}?text=${msg}`, "_blank");
	};

	return (
		<AppLayout>
			<div className="mx-auto max-w-2xl space-y-4 pb-10">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate("/")}
					className="-ml-2"
				>
					<ArrowLeft className="mr-1 h-4 w-4" /> Back to rides
				</Button>

				<Card>
					<CardHeader>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<CardTitle>Ride Details</CardTitle>
							<div className="flex items-center gap-2">
								{isCreator && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => navigate(`/ride/${rideId}/edit`)}
									>
										<Pencil className="mr-2 h-4 w-4" /> Edit
									</Button>
								)}
								<div
									className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
										ride.availableSeats > 0
											? "bg-green-100 text-green-700"
											: "bg-gray-100 text-gray-600"
									}`}
								>
									<Users className="h-4 w-4" />
									{ride.availableSeats} seats left
								</div>
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-6">
						<div className="space-y-4">
							<div>
								<p className="text-xs uppercase text-muted-foreground font-semibold">
									Route
								</p>
								<p className="text-lg font-medium">
									{ride.source} → {ride.destination}
								</p>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">
										{format(new Date(ride.date), "PPP")}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Clock className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">
										{ride.startTime} - {ride.endTime}
									</span>
								</div>
							</div>
						</div>

						<Separator />

						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
								<UserIcon className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="text-sm font-medium">{ride.creatorName}</p>
								<p className="text-xs text-muted-foreground">Ride Creator</p>
							</div>
						</div>

						<div className="pt-4">
							{isCreator ? (
								<Button
									variant="destructive"
									className="w-full"
									onClick={handleDelete}
									disabled={isDeleting}
								>
									<Trash2 className="mr-2 h-4 w-4" />{" "}
									{isDeleting ? "Deleting..." : "Delete Ride"}
								</Button>
							) : (
								<Button
									onClick={handleJoinLeave}
									disabled={(!canJoin && !joined) || loading}
									className="w-full h-12 text-lg"
									variant={joined ? "destructive" : "default"}
								>
									{joined
										? "Leave Ride"
										: ride.availableSeats === 0
										? "Ride Full"
										: "Join Ride"}
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				{joined && !isCreator && (
					<Card className="border-green-200 bg-green-50/50">
						<CardContent className="pt-6 space-y-4">
							<div className="flex items-center gap-2 text-green-700 font-semibold">
								<MessageCircle className="h-5 w-5" />
								Contact Ride Creator
							</div>
							<p className="text-sm text-green-600">
								You are part of this ride. Message the ride creator to coordinate.
							</p>
							<Button
								onClick={openWhatsApp}
								className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
							>
								<ExternalLink className="mr-2 h-4 w-4" /> Chat on WhatsApp
							</Button>
						</CardContent>
					</Card>
				)}
			</div>
		</AppLayout>
	);
}
