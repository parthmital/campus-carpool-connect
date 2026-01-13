import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRides } from "@/contexts/RidesContext";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { LocationSelect } from "@/components/rides/LocationSelect";

interface FormErrors {
	source?: string;
	destination?: string;
	date?: string;
	startTime?: string;
	endTime?: string;
	totalSeats?: string;
}

export default function EditRide() {
	const { id } = useParams<{ id: string }>();
	const rideId = id || "";

	const navigate = useNavigate();
	const { toast } = useToast();
	const { user } = useAuth();
	const { getRideById, updateRide } = useRides();

	const ride = getRideById(rideId);

	const isCreator = useMemo(
		() => !!ride && ride.creatorId === user?.id,
		[ride, user?.id],
	);

	// If the user is not authenticated, redirect to login
	// This check needs to be before accessing `user` to avoid potential errors
	// if this page is accessed by an unauthenticated user.
	if (!user) {
		navigate("/login");
		return null;
	}

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [form, setForm] = useState({
		source: "",
		destination: "",
		date: "",
		startTime: "",
		endTime: "",
		totalSeats: "",
	});

	useEffect(() => {
		if (!ride) return;

		setForm({
			source: ride.source,
			destination: ride.destination,
			date: ride.date,
			startTime: ride.startTime,
			endTime: ride.endTime,
			totalSeats: String(ride.totalSeats),
		});
	}, [ride]);

	const validate = (): boolean => {
		const next: FormErrors = {};
		const seats = parseInt(form.totalSeats, 10);

		if (!form.source.trim()) next.source = "Source is required";
		if (!form.destination.trim()) next.destination = "Destination is required";
		if (!form.date) next.date = "Date is required";
		if (!form.startTime) next.startTime = "Start time is required";
		if (!form.endTime) next.endTime = "End time is required";

		if (form.startTime && form.endTime && form.startTime >= form.endTime) {
			next.endTime = "End time must be after start time";
		}

		if (!form.totalSeats) next.totalSeats = "Total seats is required";
		else if (Number.isNaN(seats) || seats < 1)
			next.totalSeats = "At least 1 seat required";
		else if (seats > 10) next.totalSeats = "Maximum 10 seats";

		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const setField = (key: keyof typeof form, value: string) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		if (errors[key as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [key]: undefined }));
		}
	};

	if (!ride) {
		return (
			<AppLayout>
				<p className="text-muted-foreground">Ride not found.</p>
				<Button
					className="mt-3"
					variant="outline"
					onClick={() => navigate("/")}
				>
					Back
				</Button>
			</AppLayout>
		);
	}

	if (!isCreator) {
		return (
			<AppLayout>
				<p className="text-muted-foreground">
					You can only edit your own ride.
				</p>
				<Button
					className="mt-3"
					variant="outline"
					onClick={() => navigate(`/ride/${rideId}`)}
				>
					Back to ride
				</Button>
			</AppLayout>
		);
	}

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		setIsSubmitting(true);
		try {
			await updateRide(rideId, {
				source: form.source.trim(),
				destination: form.destination.trim(),
				date: form.date,
				startTime: form.startTime,
				endTime: form.endTime,
				totalSeats: parseInt(form.totalSeats, 10),
			} as any);

			toast({
				title: "Ride updated",
				description: "Changes saved successfully.",
			});

			navigate(`/ride/${rideId}`);
		} catch (err: any) {
			console.error(err);
			toast({
				title: "Update failed",
				description: err?.message ?? "Could not update ride",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AppLayout>
			<div className="mx-auto max-w-lg">
				<Card className="animate-fade-in">
					<CardHeader>
						<CardTitle>Edit Ride</CardTitle>
						<CardDescription>Update details for your ride.</CardDescription>
					</CardHeader>

					<CardContent>
						<form onSubmit={onSubmit} className="space-y-4">
							<LocationSelect
								id="source"
								label="Source"
								value={form.source}
								onChange={(v) => setField("source", v)}
								placeholder="Select pickup location"
								error={errors.source}
							/>

							<LocationSelect
								id="destination"
								label="Destination"
								value={form.destination}
								onChange={(v) => setField("destination", v)}
								placeholder="Select drop location"
								error={errors.destination}
							/>

							<div className="space-y-2">
								<Label htmlFor="date">Date</Label>
								<Input
									id="date"
									type="date"
									value={form.date}
									onChange={(e) => setField("date", e.target.value)}
									className={errors.date ? "border-destructive" : ""}
								/>
								{errors.date && (
									<p className="text-xs text-destructive">{errors.date}</p>
								)}
							</div>

							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="startTime">Start Time</Label>
									<Input
										id="startTime"
										type="time"
										value={form.startTime}
										onChange={(e) => setField("startTime", e.target.value)}
										className={errors.startTime ? "border-destructive" : ""}
									/>
									{errors.startTime && (
										<p className="text-xs text-destructive">
											{errors.startTime}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="endTime">End Time</Label>
									<Input
										id="endTime"
										type="time"
										value={form.endTime}
										onChange={(e) => setField("endTime", e.target.value)}
										className={errors.endTime ? "border-destructive" : ""}
									/>
									{errors.endTime && (
										<p className="text-xs text-destructive">{errors.endTime}</p>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="totalSeats">Total Seats</Label>
								<Input
									id="totalSeats"
									type="number"
									min={1}
									max={10}
									value={form.totalSeats}
									onChange={(e) => setField("totalSeats", e.target.value)}
									className={errors.totalSeats ? "border-destructive" : ""}
								/>
								{errors.totalSeats && (
									<p className="text-xs text-destructive">
										{errors.totalSeats}
									</p>
								)}
							</div>

							<div className="flex justify-end gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => navigate(`/ride/${rideId}`)}
								>
									Cancel
								</Button>

								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<span className="inline-flex items-center">
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Saving...
										</span>
									) : (
										"Save changes"
									)}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</AppLayout>
	);
}
