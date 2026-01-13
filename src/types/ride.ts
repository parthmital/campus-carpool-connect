export interface User {
	id: string;
	name: string;
	email: string;
	whatsApp?: string;
	createdAt: string;
}

export interface Ride {
	id: string;
	source: string;
	destination: string;
	date: string;
	startTime: string;
	endTime: string;
	totalSeats: number;
	availableSeats: number;
	creatorId: string;
	creatorName: string;
	creatorEmail: string;
	creatorWhatsApp: string;
	createdAt: string;
}
