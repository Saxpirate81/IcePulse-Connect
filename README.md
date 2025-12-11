# IcePulse Connect

A modern, mobile-friendly web application for sports management built with Next.js and React.

## Features

- **Role-Based Access**: Admin, Coach, Parent, and Player views
- **Mobile-First Design**: 100% mobile-friendly, responsive web app
- **Contemporary UI**: Designed for ages 14-45 with modern gradients and animations
- **Bottom Navigation (Mobile)**: Easy access to Data, Video, Stats, Chat, and Profile
- **Side Navigation (Desktop)**: Clean sidebar navigation for larger screens

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin routes
│   │   ├── page.tsx      # Data screen
│   │   ├── video/        # Video screen
│   │   ├── stats/        # Stats screen
│   │   ├── chat/         # Chat screen
│   │   └── profile/      # Profile screen
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Login/home page
│   └── globals.css       # Global styles
├── components/            # Reusable components
│   └── Logo.tsx
├── screens/              # Screen components
│   ├── LoginScreen.tsx
│   └── admin/            # Admin-specific screens
├── navigation/           # Navigation components
├── constants/            # App constants
└── types/               # TypeScript type definitions
```

## Design Features

- **Responsive Design**: Mobile-first approach with breakpoints for tablet and desktop
- **Dark Theme**: Modern dark UI with blue/cyan gradients
- **Smooth Animations**: Framer Motion for smooth transitions
- **Tailwind CSS**: Utility-first CSS for rapid development

## Current Status

- ✅ Admin view with navigation (mobile bottom nav, desktop sidebar)
- ✅ Login screen
- ✅ All 5 admin screens (Data, Video, Stats, Chat, Profile)
- ✅ Mobile-responsive layout
- ⏳ Data integration (to be connected to existing database)
- ⏳ Other role views (Coach, Parent, Player)

## Adding Your Logo

Place your logo image at `public/logo.png`. Update the `hasLogo` flag in `components/Logo.tsx` to `true`.

## Next Steps

1. Connect to existing IcePulse database
2. Implement authentication
3. Add Coach, Parent, and Player views
4. Wire up real data to all screens
