import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Navbar } from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { WhatsAppPrompt } from "@/components/WhatsAppPrompt";

interface AppLayoutProps {
	children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
	const { isAuthenticated, isLoading, needsWhatsApp, setWhatsApp } = useAuth();

	// Wait for auth to finish loading before checking authentication
	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);
	}


	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="container py-4 sm:py-6">{children}</main>
			<WhatsAppPrompt open={needsWhatsApp} onSubmit={setWhatsApp} />
		</div>
	);
}
