## VIT Carpool

This is a web application designed for carpooling, specifically for the students of Vellore Institute of Technology, Vellore. It allows users to create, join, and manage rides.

## Tech Stack

**Frontend:**

- **React:** A JavaScript library for building user interfaces.
- **Vite:** A fast build tool for modern web projects.
- **TypeScript:** A superset of JavaScript that adds static typing.
- **Shadcn UI:** A collection of reusable components for building beautiful user interfaces.
- **Tailwind CSS:** A utility-first CSS framework for rapidly styling applications.
- **React Router DOM:** For declarative routing in React applications.
- **@tanstack/react-query:** For data fetching, caching, and state management.
- **Zod, React Hook Form, @hookform/resolvers:** For form validation.
- **Date-fns, React Day Picker:** For date and time manipulation and selection.
- **Lucide React:** For icons.
- **Sonner:** For toasts/notifications.
- **Embla Carousel React:** For carousels.
- **Recharts:** For charts.
- **Class Variance Authority (cva), clsx, tailwind-merge:** For managing CSS classes and variants.

**Backend:**

- **Supabase:** A "Firebase alternative" providing:
  - **PostgreSQL Database:** For data storage (indicated by `supabase-schema.sql`).
  - **Authentication:** For user management (`@supabase/supabase-js`, `src/contexts/AuthContext.tsx`).
  - **Realtime Database:** Potentially used for real-time updates on ride availability or chat.

**Development Tools:**

- **ESLint, Prettier:** For code linting and formatting.
- **TypeScript:** For type checking.

## Features

**User Management & Authentication:**

- User login and registration (`src/pages/Login.tsx`, `src/contexts/AuthContext.tsx`).
- Session management.

**Ride Management:**

- **Create Ride:** Users can create new ride offerings (`src/pages/CreateRide.tsx`).
  - Includes selecting origin, destination, date, time, and available seats.
- **Search for Rides:** Users can search for available rides (`src/components/rides/SearchForm.tsx`).
  - Location selection (`src/components/rides/LocationSelect.tsx`).
- **View Ride Details:** Detailed view of a specific ride (`src/pages/RideDetail.tsx`).
- **Join/Book Rides:** Users can join existing rides.
- **Manage Own Rides:** Users can view and manage the rides they have created (`src/pages/ManageRides.tsx`).
  - Edit ride details (`src/pages/EditRide.tsx`).
- **View Joined Rides:** Users can see a list of rides they have joined (`src/pages/JoinedRides.tsx`).
- **Ride Card Component:** A reusable component to display ride information (`src/components/rides/RideCard.tsx`).

**User Interface & Experience:**

- Responsive design (indicated by Shadcn UI and Tailwind CSS).
- Navigation bar (`src/components/layout/Navbar.tsx`).
- Layout components (`src/components/layout/AppLayout.tsx`).
- Toast notifications for user feedback (`src/components/ui/toast.tsx`, `src/hooks/use-toast.ts`).
- Various UI components from Shadcn UI (buttons, forms, dialogs, etc.).
- WhatsApp integration: `src/components/WhatsAppPrompt.tsx` suggests a feature for contacting ride participants or organizers via WhatsApp.

**Data & State Management:**

- Global state management for authentication (`src/contexts/AuthContext.tsx`).
- Global state management for rides data (`src/contexts/RidesContext.tsx`).
- Data fetching and caching with React Query.

## Project Structure

- `public/`: Static assets (favicon, images, sitemap, robots.txt).
- `src/`: Main application source code.
  - `src/App.tsx`: Main application component.
  - `src/main.tsx`: Entry point of the React application.
  - `src/components/`: Reusable React components.
    - `src/components/layout/`: Layout-specific components.
    - `src/components/rides/`: Components related to ride functionality.
    - `src/components/ui/`: Shadcn UI components.
  - `src/contexts/`: React Context API for global state management.
  - `src/hooks/`: Custom React hooks.
  - `src/lib/`: Utility functions and Supabase client initialization (`src/lib/supabase.ts`, `src/lib/utils.ts`).
  - `src/pages/`: Page-level components (routes).
  - `src/types/`: TypeScript type definitions (`src/types/ride.ts`).
  - `src/App.css`, `src/index.css`: Styling files.
- `supabase-schema.sql`: Database schema for Supabase.
- `tailwind.config.ts`, `postcss.config.js`: Tailwind CSS configuration.
- `vite.config.ts`: Vite build configuration.
- `tsconfig.json`: TypeScript configuration.
- `package.json`: Project dependencies and scripts.
- `vercel.json`: Vercel deployment configuration.
