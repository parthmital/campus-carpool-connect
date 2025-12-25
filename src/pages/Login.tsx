import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Car, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
	const { login, isLoading, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	// Wait for auth to finish loading before checking authentication
	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-sm">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center justify-center py-8">
							<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
							<p className="text-sm text-muted-foreground">Loading...</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	const handleLogin = async () => {
		await login();
		// Note: Supabase OAuth will redirect automatically
		// The navigate will only happen if OAuth is not configured
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-sm animate-fade-in">
				<CardHeader className="text-center space-y-3">
					<div className="flex justify-center">
						<div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
							<Car className="h-6 w-6 text-primary" />
						</div>
					</div>
					<CardTitle className="text-xl">VIT Carpool</CardTitle>
					<CardDescription>
						Sign in with your college email to find or offer rides
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={handleLogin}
						disabled={isLoading}
						className="w-full gap-2"
						size="lg"
					>
						{isLoading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Signing in...
							</>
						) : (
							<>
								<GoogleIcon />
								Continue with Google
							</>
						)}
					</Button>
					<p className="text-xs text-center text-muted-foreground mt-4">
						Only @college.edu emails are allowed
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

function GoogleIcon() {
	return (
		<svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
			<path
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				fill="#4285F4"
			/>
			<path
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				fill="#34A853"
			/>
			<path
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
				fill="#FBBC05"
			/>
			<path
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				fill="#EA4335"
			/>
		</svg>
	);
}
