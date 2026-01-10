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
	CheckCircle,
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
					<p className="mt-1 text-sm text-muted-foreground">
						This ride may have been removed or doesn&apos;t exist.
					</p>
					<Button onClick={() => navigate("/")} className="mt-4">
						Back to Home
					</Button>
				</div>
			</AppLayout>
		);
	}

	const formattedDate = format(new Date(ride.date), "EEEE, MMMM d, yyyy");
	const timeWindow = `${ride.startTime} - ${ride.endTime}`;

	const isCreator = ride.creatorId === user?.id;
	const canJoin = !!user && ride.seatsAvailable > 0 && !isCreator && !joined;

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
				if (success) {
					toast({
						title: "Left ride",
						description: "You have left this ride.",
					});
				} else {
					toast({
						title: "Could not leave",
						description: "Please try again.",
						variant: "destructive",
					});
				}
			} else {
				const success = await joinRide(ride.id);
				if (success) {
					toast({
						title: "Joined ride",
						description: "You can now contact the driver via WhatsApp.",
					});
				} else {
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
				description: "Failed. Please try again.",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!window.confirm("Delete this ride? This cannot be undone.")) return;

		setIsDeleting(true);
		try {
			await deleteRide(ride.id);
			toast({ title: "Ride deleted", description: "Your ride was removed." });
			navigate("/");
		} catch (e: any) {
			console.error(e);
			toast({
				title: "Delete failed",
				description: e?.message ?? "Could not delete ride",
				variant: "destructive",
			});
		} finally {
			setIsDeleting(false);
		}
	};

	const copyWhatsApp = async () => {
		if (!ride.creatorWhatsApp) {
			toast({
				title: "No WhatsApp number",
				description: "The driver has not added a WhatsApp number.",
				variant: "destructive",
			});
			return;
		}

		await navigator.clipboard.writeText(ride.creatorWhatsApp);
		toast({
			title: "Copied!",
			description: "WhatsApp number copied to clipboard.",
		});
	};

	const openWhatsApp = () => {
		if (!ride.creatorWhatsApp) {
			toast({
				title: "No WhatsApp number",
				description: "The driver has not added a WhatsApp number.",
				variant: "destructive",
			});
			return;
		}

		const message = encodeURIComponent(
			`Hi! I joined your ride from ${ride.source} to ${ride.destination} on ${formattedDate}.`
		);

		window.open(
			`https://wa.me/${ride.creatorWhatsApp}?text=${message}`,
			"_blank"
		);
	};

	return (
		<AppLayout>
			<div className="mx-auto max-w-2xl space-y-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate("/")}
					className="-ml-2 text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="mr-1 h-4 w-4" />
					Back to rides
				</Button>

				<Card className="animate-fade-in">
					<CardHeader className="pb-4">
						{/* CHANGED: stack title + actions on mobile; one row on sm+ */}
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<CardTitle className="text-lg">Ride Details</CardTitle>

							<div className="flex items-center gap-2">
								{isCreator && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => navigate(`/ride/${rideId}/edit`)}
									>
										<Pencil className="mr-2 h-4 w-4" />
										Edit
									</Button>
								)}

								<div
									className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
										ride.seatsAvailable > 0
											? "bg-success/10 text-success"
											: "bg-muted text-muted-foreground"
									}`}
								>
									<Users className="h-4 w-4" />
									{ride.seatsAvailable}{" "}
									{ride.seatsAvailable === 1 ? "seat" : "seats"} left
								</div>
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-6">
						<div className="flex items-start gap-4">
							<div className="flex flex-col items-center gap-1 pt-1">
								<div className="h-3 w-3 rounded-full bg-primary" />
								<div className="h-8 w-0.5 bg-border" />
								<div className="h-3 w-3 rounded-full bg-success" />
							</div>

							<div className="flex-1 space-y-4">
								<div>
									<p className="text-xs uppercase tracking-wide text-muted-foreground">
										From
									</p>
									<p className="font-medium text-foreground">{ride.source}</p>
								</div>

								<div>
									<p className="text-xs uppercase tracking-wide text-muted-foreground">
										To
									</p>
									<p className="font-medium text-foreground">
										{ride.destination}
									</p>
								</div>
							</div>
						</div>

						<Separator />

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="flex items-start gap-3">
								<Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
								<div>
									<p className="text-xs uppercase tracking-wide text-muted-foreground">
										Date
									</p>
									<p className="font-medium text-foreground">{formattedDate}</p>
								</div>
							</div>

							<div className="flex items-start gap-3">
								<Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
								<div>
									<p className="text-xs uppercase tracking-wide text-muted-foreground">
										Time Window
									</p>
									<p className="font-medium text-foreground">{timeWindow}</p>
								</div>
							</div>
						</div>

						<Separator />

						<div className="flex items-start gap-3">
							<UserIcon className="mt-0.5 h--5 w-5 text-muted-foreground" />
							<div>
								<p className="text-xs uppercase tracking-wide text-muted-foreground">
									Posted by
								</p>
								<p className="font-medium text-foreground">
									{ride.creatorName}
								</p>
								<p className="text-sm text-muted-foreground">
									{ride.creatorEmail}
								</p>
							</div>
						</div>

						<div className="space-y-2 pt-2">
							{isCreator ? (
								<div className="space-y-2">
									<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
										<CheckCircle className="h-4 w-4" />
										This is your ride
									</div>

									<Button
										variant="destructive"
										className="w-full"
										onClick={handleDelete}
										disabled={isDeleting}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										{isDeleting ? "Deleting..." : "Delete ride"}
									</Button>
								</div>
							) : (
								<Button
									onClick={handleJoinLeave}
									disabled={(!canJoin && !joined) || loading}
									className="w-full"
									size="lg"
									variant={joined ? "destructive" : "default"}
								>
									{loading
										? joined
											? "Leaving..."
											: "Joining..."
										: joined
										? "Leave Ride"
										: "Join This Ride"}
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				{joined && !isCreator && (
					<Card className="animate-fade-in border-success/30 bg-success/5">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base text-success">
								<MessageCircle className="h-5 w-5" />
								Contact Driver
							</CardTitle>
						</CardHeader>

						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Coordinate pickup details directly with the driver on WhatsApp.
							</p>

							<div className="flex flex-col gap-2 sm:flex-row">
								<Button
									onClick={openWhatsApp}
									className="flex-1 bg-[#25D366] text-white hover:bg-[#20BD5A]"
								>
									<ExternalLink className="mr-2 h-4 w-4" />
									Chat on WhatsApp
								</Button>

								<Button
									variant="outline"
									onClick={copyWhatsApp}
									className="flex-1"
								>
									<Copy className="mr-2 h-4 w-4" />
									Copy Number
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</AppLayout>
	);
}
