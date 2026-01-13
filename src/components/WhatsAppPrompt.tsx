import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Phone, Loader2 } from "lucide-react";

interface WhatsAppPromptProps {
	open: boolean;
	onSubmit: (whatsApp: string) => void;
}

export function WhatsAppPrompt({ open, onSubmit }: WhatsAppPromptProps) {
	const [phone, setPhone] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const validatePhone = (value: string) => {
		const cleaned = value.replace(/\D/g, "");
		return cleaned.length >= 10 && cleaned.length <= 15;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validatePhone(phone)) {
			setError("Please enter a valid WhatsApp number (10-15 digits)");
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			const cleanedPhone = phone.replace(/\D/g, "");
			await new Promise((resolve) => setTimeout(resolve, 500));
			onSubmit(cleanedPhone);
		} catch (err) {
			setError("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	useEffect(() => {
		if (!open) {
			setPhone("");
			setError("");
			setIsSubmitting(false);
		}
	}, [open]);

	return (
		<Dialog open={open}>
			<DialogContent
				className="sm:max-w-md"
				onPointerDownOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Phone className="h-5 w-5 text-primary" />
						WhatsApp Number
					</DialogTitle>
					<DialogDescription>
						Enter your WhatsApp number to coordinate rides. This will only be
						shared with riders who join your rides.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="whatsapp">WhatsApp Number</Label>
						<Input
							id="whatsapp"
							type="tel"
							placeholder="e.g., 919876543210"
							value={phone}
							onChange={(e) => {
								setPhone(e.target.value);
								if (error) setError("");
							}}
							className={error ? "border-destructive" : ""}
							disabled={isSubmitting}
						/>
						{error && <p className="text-xs text-destructive">{error}</p>}
					</div>

					<Button
						type="submit"
						className="w-full"
						disabled={isSubmitting || !phone}
					>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							"Confirm Number"
						)}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
