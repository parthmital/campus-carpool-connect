import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRides } from "@/contexts/RidesContext";
import { LocationSelect } from "@/components/rides/LocationSelect";
import { Car, Loader2 } from "lucide-react";
interface FormData {
	source: string;
	destination: string;
	date: string;
	startTime: string;
	endTime: string;
	seatsAvailable: string;
}
interface FormErrors {
	source?: string;
	destination?: string;
	date?: string;
	startTime?: string;
	endTime?: string;
	seatsAvailable?: string;
}
export default function CreateRide() {
	const navigate = useNavigate();
	const { toast } = useToast();
	const { user } = useAuth();
	const { createRide } = useRides();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState<FormData>({
		source: "",
		destination: "",
		date: "",
		startTime: "",
		endTime: "",
		seatsAvailable: "",
	});
	const [errors, setErrors] = useState<FormErrors>({});
	const validate = (): boolean => {
		const newErrors: FormErrors = {};
		const seats = parseInt(formData.seatsAvailable);
		if (!formData.source.trim()) newErrors.source = "Source is required";
		if (!formData.destination.trim())
			newErrors.destination = "Destination is required";
		if (!formData.date) newErrors.date = "Date is required";
		if (!formData.startTime) newErrors.startTime = "Start time is required";
		if (!formData.endTime) newErrors.endTime = "End time is required";
		if (
			formData.startTime &&
			formData.endTime &&
			formData.startTime >= formData.endTime
		)
			newErrors.endTime = "End time must be after start time";
		if (!formData.seatsAvailable)
			newErrors.seatsAvailable = "Seats available is required";
		else if (isNaN(seats) || seats < 1)
			newErrors.seatsAvailable = "At least 1 seat required";
		else if (seats > 10) newErrors.seatsAvailable = "Maximum 10 seats";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};
	const handleChange = (field: keyof FormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
	};
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate() || !user) return;
		setIsSubmitting(true);
		try {
			await createRide({
				source: formData.source.trim(),
				destination: formData.destination.trim(),
				date: formData.date,
				startTime: formData.startTime,
				endTime: formData.endTime,
				seatsAvailable: parseInt(formData.seatsAvailable),
				creatorId: user.id,
				creatorName: user.name,
				creatorEmail: user.email,
				creatorWhatsApp: user.whatsApp || "",
			});
			toast({
				title: "Ride created!",
				description: "Your ride has been posted successfully.",
			});
			navigate("/");
		} catch (error) {
			console.error("Error creating ride:", error);
			toast({
				title: "Error",
				description: "Failed to create ride. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};
	return (
		<AppLayout>
			<div className="max-w-lg mx-auto">
				<Card className="animate-fade-in">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Car className="h-5 w-5 text-primary" />
							Create a Ride
						</CardTitle>
						<CardDescription>
							Share your ride with other students
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<LocationSelect
								id="source"
								label="Source"
								value={formData.source}
								onChange={(value) => handleChange("source", value)}
								placeholder="Select pickup location"
								error={errors.source}
							/>
							<LocationSelect
								id="destination"
								label="Destination"
								value={formData.destination}
								onChange={(value) => handleChange("destination", value)}
								placeholder="Select drop location"
								error={errors.destination}
							/>
							<div className="space-y-2">
								<Label htmlFor="date">Date</Label>
								<Input
									id="date"
									type="date"
									value={formData.date}
									onChange={(e) => handleChange("date", e.target.value)}
									className={errors.date ? "border-destructive" : ""}
								/>
								{errors.date && (
									<p className="text-xs text-destructive">{errors.date}</p>
								)}
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-2">
									<Label htmlFor="startTime">Start Time</Label>
									<Input
										id="startTime"
										type="time"
										value={formData.startTime}
										onChange={(e) => handleChange("startTime", e.target.value)}
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
										value={formData.endTime}
										onChange={(e) => handleChange("endTime", e.target.value)}
										className={errors.endTime ? "border-destructive" : ""}
									/>
									{errors.endTime && (
										<p className="text-xs text-destructive">{errors.endTime}</p>
									)}
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="seatsAvailable">Seats Available</Label>
								<Input
									id="seatsAvailable"
									type="number"
									min={1}
									max={10}
									placeholder="1-10"
									value={formData.seatsAvailable}
									onChange={(e) =>
										handleChange("seatsAvailable", e.target.value)
									}
									className={errors.seatsAvailable ? "border-destructive" : ""}
								/>
								{errors.seatsAvailable && (
									<p className="text-xs text-destructive">
										{errors.seatsAvailable}
									</p>
								)}
							</div>
							<Button type="submit" className="w-full" disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Creating...
									</>
								) : (
									"Create Ride"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</AppLayout>
	);
}
