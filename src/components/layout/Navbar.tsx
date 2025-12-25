import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Car, Plus, LogOut, User, Phone, List, Users2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
	const { user, logout, setWhatsApp } = useAuth();
	const navigate = useNavigate();

	const [editWhatsAppOpen, setEditWhatsAppOpen] = useState(false);
	const [newWhatsApp, setNewWhatsApp] = useState(user?.whatsApp || "");
	const [error, setError] = useState("");

	useEffect(() => {
		setNewWhatsApp(user?.whatsApp || "");
	}, [user?.whatsApp]);

	const handleLogout = async () => {
		await logout();
		navigate("/");
	};

	const handleUpdateWhatsApp = async (e: React.FormEvent) => {
		e.preventDefault();

		const cleaned = newWhatsApp.replace(/\D/g, "");
		if (cleaned.length < 10 || cleaned.length > 15) {
			setError("Please enter a valid phone number (10-15 digits)");
			return;
		}

		try {
			await setWhatsApp(cleaned);
			setEditWhatsAppOpen(false);
			setError("");
		} catch (e) {
			console.error("Failed to update WhatsApp:", e);
			setError("Failed to update WhatsApp. Please try again.");
		}
	};

	return (
		<>
			<header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
				<div className="container flex h-14 items-center justify-between">
					<Link
						to="/"
						className="flex items-center gap-2 font-semibold text-foreground"
					>
						<Car className="h-5 w-5 text-primary" />
						<span className="hidden sm:inline">VIT Carpool</span>
					</Link>

					<div className="flex items-center gap-2">
						<Button asChild variant="default" size="sm" className="gap-1.5">
							<Link to="/create">
								<Plus className="h-4 w-4" />
								<span className="hidden sm:inline">Create Ride</span>
							</Link>
						</Button>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="gap-1.5">
									<User className="h-4 w-4" />
									<span className="hidden sm:inline">
										{user?.name?.split(" ")[0] ?? "Account"}
									</span>
								</Button>
							</DropdownMenuTrigger>

							<DropdownMenuContent
								align="end"
								className="bg-background border-border"
							>
								<DropdownMenuItem onClick={() => navigate("/manage")}>
									<List className="h-4 w-4 mr-2" />
									Manage rides
								</DropdownMenuItem>

								<DropdownMenuItem onClick={() => navigate("/joined")}>
									<Users2 className="h-4 w-4 mr-2" />
									Joined rides
								</DropdownMenuItem>

								<DropdownMenuItem
									onClick={() => {
										setNewWhatsApp(user?.whatsApp || "");
										setError("");
										setEditWhatsAppOpen(true);
									}}
								>
									<Phone className="h-4 w-4 mr-2" />
									Edit WhatsApp
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuItem
									onClick={handleLogout}
									className="text-destructive"
								>
									<LogOut className="h-4 w-4 mr-2" />
									Logout
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</header>

			<Dialog open={editWhatsAppOpen} onOpenChange={setEditWhatsAppOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit WhatsApp Number</DialogTitle>
						<DialogDescription>
							Update your WhatsApp number for ride coordination.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleUpdateWhatsApp} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="edit-whatsapp">WhatsApp Number</Label>
							<Input
								id="edit-whatsapp"
								type="tel"
								placeholder="e.g., 919876543210"
								value={newWhatsApp}
								onChange={(e) => {
									setNewWhatsApp(e.target.value);
									setError("");
								}}
								className={error ? "border-destructive" : ""}
							/>
							{error && <p className="text-xs text-destructive">{error}</p>}
						</div>

						<div className="flex gap-2 justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => setEditWhatsAppOpen(false)}
							>
								Cancel
							</Button>
							<Button type="submit">Save</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
