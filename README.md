# HelpDesk Mini - Frontend

A modern React-based frontend application for the HelpDesk Mini ticket management system.

## Features

- **Authentication**: JWT-based login with automatic token refresh
- **Password Reset**: Complete password reset flow with email confirmation
- **Ticket Management**: Create, view, and manage support tickets
- **Advanced Filtering**: Filter tickets by status, priority, and SLA breach status
- **Search**: Real-time search across ticket titles
- **Pagination**: Navigate through large ticket lists
- **Comments**: Add and view comments on tickets
- **Ticket History**: View complete audit trail of ticket changes
- **Role-Based Access**: Different UI and permissions for users vs agents/admins
- **Optimistic Locking**: Prevents conflicts when multiple users edit the same ticket
- **Responsive Design**: Clean, professional UI that works on all devices

## Tech Stack

- React 18 with TypeScript
- React Router for navigation
- Axios for API communication
- Tailwind CSS for styling
- React Toastify for notifications
- Lucide React for icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Django REST API backend running (default: http://localhost:8000)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure the backend API URL in `.env`:
```
VITE_API_BASE_URL=http://localhost:8000
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Application Structure

```
src/
├── api/
│   └── client.ts           # Axios instance with auth interceptors
├── components/
│   ├── Layout.tsx          # Main layout with navigation
│   └── ProtectedRoute.tsx  # Route guard for authenticated users
├── context/
│   └── AuthContext.tsx     # Authentication state management
├── pages/
│   ├── Login.tsx           # Login page
│   ├── PasswordReset.tsx   # Password reset request
│   ├── PasswordResetConfirm.tsx # Password reset confirmation
│   ├── TicketsDashboard.tsx     # Main tickets list
│   ├── NewTicket.tsx       # Create new ticket
│   └── TicketDetail.tsx    # View and manage ticket
└── App.tsx                 # Main app component with routes
```

## Key Features

### Automatic Token Refresh
The application automatically refreshes expired access tokens using the refresh token, ensuring uninterrupted user experience.

### Role-Based UI
- **Users**: Can view their tickets and add comments
- **Agents/Admins**: Can view all tickets, change status, assign agents, and perform all user actions

### SLA Management
Tickets with breached SLA deadlines are clearly marked with warning indicators throughout the application.

### Optimistic Locking
When updating tickets, the application includes version numbers to prevent conflicts. If another user has modified the ticket, a friendly notification prompts you to refresh.

## Environment Variables

- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:8000)

## API Integration

The application expects the following Django REST API endpoints:

- `POST /api/auth/jwt/create/` - Login
- `POST /api/auth/jwt/refresh/` - Refresh token
- `GET /api/auth/users/me/` - Get current user
- `POST /api/auth/users/reset_password/` - Request password reset
- `POST /api/auth/users/reset_password_confirm/` - Confirm password reset
- `GET /api/tickets/` - List tickets
- `POST /api/tickets/` - Create ticket
- `GET /api/tickets/:id/` - Get ticket details
- `PATCH /api/tickets/:id/` - Update ticket
- `GET /api/tickets/:id/comments/` - List comments
- `POST /api/tickets/:id/comments/` - Add comment
- `GET /api/tickets/:id/history/` - Get ticket history
- `GET /api/users/agents/` - List agents

## License

MIT
