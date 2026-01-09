export interface Ride {
	id: string;
	source: string;
	destination: string;
	date: string;
	startTime: string;
	endTime: string;
	totalSeats: number;
	seatsAvailable: number;
	creatorId: string;
	creatorName: string;
	creatorEmail: string;
	creatorWhatsApp: string;
	createdAt: string;
}
export interface User {
	id: string;
	name: string;
	email: string;
	photoUrl?: string;
	whatsApp?: string;
}
