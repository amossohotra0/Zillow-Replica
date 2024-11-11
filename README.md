# Zillow Clone

A modern real estate search application built with Next.js, React, and Google Maps API. This application allows users to search for properties by location, view property details, and filter search results.

## Tech Stack

- **Frontend**: Next.js 15.3.3, React 19.0.0
- **Styling**: TailwindCSS 4.x
- **State Management**: Zustand 5.0.5
- **API Integration**: Axios, TanStack React Query
- **Maps**: Google Maps API (@react-google-maps/api)
- **Form Handling**: React Hook Form, Zod validation
- **Authentication**: NextAuth.js

## Prerequisites

- Node.js 22.x or later
- npm 10.x or later

## Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd zillow
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Variables**

Create a `.env` file in the root directory based on the `.env.example` file:

```bash
cp .env.example .env
```

Fill in the required environment variables:

- `ZILLOW_API_KEY`: Your Zillow API key
- `ZILLOW_URL`: Zillow API URL
- `ZILLOW_USERS`: Authorized users for the API
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your Google Maps API key
- Other configuration variables as needed

4. **Run the development server**

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

- `/app`: Next.js app router pages and API routes
- `/components`: Reusable React components
- `/context`: React context providers
- `/lib`: Utility functions and shared code
- `/public`: Static assets
- `/store`: Zustand state stores
- `/utils`: Helper functions

## Features

- Property search by location
- Interactive map with property markers
- Property filtering (price, bedrooms, bathrooms, etc.)
- Detailed property information
- Responsive design for mobile and desktop

## Development

This project uses Next.js with Turbopack for faster development experience. The development server can be started with:

```bash
npm run dev
```

## Building for Production

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.