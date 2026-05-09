# RidePlatform Mobile App

React Native + Expo. Shares the same API Gateway as the web dashboard.

## Setup

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** app on your phone.

## Architecture

```
mobile/
├── app/
│   ├── login.tsx              # Shared login screen
│   ├── (rider)/               # Rider tab group
│   │   ├── _layout.tsx        # Bottom tab bar (indigo theme)
│   │   ├── home.tsx           # Full-screen map + slide-up booking sheet
│   │   ├── trips.tsx          # Trip history cards
│   │   ├── payments.tsx       # Receipts
│   │   └── profile.tsx        # Profile + settings
│   └── (driver)/              # Driver tab group
│       ├── _layout.tsx        # Bottom tab bar (green theme)
│       ├── home.tsx           # Map + online toggle + trip request sheet
│       ├── trips.tsx          # Trip history
│       ├── earnings.tsx       # Earnings + bar chart
│       └── profile.tsx        # Profile
└── src/
    ├── api.ts                 # Same endpoints as web — JWT via SecureStore
    └── store.ts               # Zustand state (user, activeTrip)
```

## Key differences from web dashboard

| Web (Admin)          | Mobile                          |
|----------------------|---------------------------------|
| Fixed sidebar        | Bottom tab bar                  |
| Dense data tables    | Swipeable cards                 |
| Hover states         | Press + haptic feedback         |
| Multi-column grid    | Single column scroll            |
| Modals               | Slide-up bottom sheets          |
| Mouse interactions   | Touch gestures                  |

## Environment

Create `.env` in `mobile/`:
```
EXPO_PUBLIC_API_URL=http://<your-api-gateway-ip>:8080
```

For production, use your EKS LoadBalancer DNS.

## Demo credentials

| Role   | Email              | Password   |
|--------|--------------------|------------|
| Driver | driver@ride.com    | driver123  |
| Rider  | rider@ride.com     | rider123   |
