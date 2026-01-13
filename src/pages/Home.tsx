import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchForm } from "@/components/rides/SearchForm";
import { RideCard } from "@/components/rides/RideCard";
import { useRides } from "@/contexts/RidesContext";
import { Car } from "lucide-react";

interface SearchFilters {
	source: string;
	destination: string;
	date: string;
	startTime: string;
	endTime: string;
}

export default function Home() {
	const { isLoading, searchRides } = useRides();

	const [filters, setFilters] = useState<SearchFilters>({
		source: "",
		destination: "",
		date: "",
		startTime: "",
		endTime: "",
	});

	const filteredRides = searchRides(filters);

	return (
		<AppLayout>
			<div className="space-y-6">
				<SearchForm onSearch={setFilters} />

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h2 className="text-sm font-medium text-muted-foreground">
							{isLoading ? (
								"Loading rides..."
							) : (
								<>
									{filteredRides.length}{" "}
									{filteredRides.length === 1 ? "ride" : "rides"} available
								</>
							)}
						</h2>
					</div>

					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
								<Car className="h-6 w-6 animate-pulse text-muted-foreground" />
							</div>
							<p className="text-muted-foreground">Loading rides...</p>
						</div>
					) : filteredRides.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
								<Car className="h-6 w-6 text-muted-foreground" />
							</div>
							<p className="text-muted-foreground">No rides found</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Try adjusting your search filters
							</p>
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
							{filteredRides.map((ride) => (
								<RideCard key={ride.id} ride={ride} />
							))}
						</div>
					)}
				</div>
			</div>
		</AppLayout>
	);
}
