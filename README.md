# 🏠 ViewTo - House Appointment Platform

A modern real estate platform for Toronto that simplifies property viewings. Book appointments directly with landlords, connect with verified realtors, and find your next home without the back-and-forth.

![Next.js](https://img.shields.io/badge/Next.js-14.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### For Renters & Buyers
- 🔍 **Browse Listings** - Filter by price, bedrooms, bathrooms, and listing type (rent/sale)
- 📅 **Direct Booking** - Schedule viewings directly with landlords
- 👥 **Find Realtors** - Connect with RECO-verified real estate professionals
- 🌙 **Dark/Light Mode** - Beautiful UI with theme support

### For Landlords
- 🏢 **Create Listings** - Post properties with images, descriptions, and pricing
- ⏰ **Set Availability** - Define viewing windows for each listing
- 📊 **Manage Appointments** - View and manage incoming booking requests

### For Realtors
- ✅ **RECO Verification** - Official license verification against Ontario's RECO database
- 💼 **Professional Profiles** - Showcase experience, languages, and hourly rates
- 🤝 **Client Connections** - Receive hire requests from potential clients

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/utkuemec/house-appointment.git
   cd house-appointment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # RECO Verification (optional - for realtor verification)
   BROWSERLESS_API_KEY=your-browserless-key
   # OR
   SCRAPINGBEE_API_KEY=your-scrapingbee-key
   ```

4. **Set up the database**
   
   Run the migrations in your Supabase SQL editor:
   - Execute `supabase/schema.sql`
   - Run migrations in `supabase/migrations/` in order

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/
│   ├── actions/          # Server actions
│   ├── admin/            # Admin verification panel
│   ├── api/              # API routes (cron jobs, verification)
│   ├── become-realtor/   # Realtor onboarding
│   ├── browse/           # Listing browser
│   ├── landlord/         # Landlord dashboard
│   ├── listing/          # Individual listing pages
│   ├── my-listings/      # User's listings
│   ├── profile/          # User profile management
│   └── realtors/         # Realtor directory
├── components/           # Reusable UI components
├── lib/                  # Utility functions & services
├── supabase/             # Database schema & migrations
├── types/                # TypeScript type definitions
└── utils/supabase/       # Supabase client utilities
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🔐 RECO Verification

The platform verifies realtor licenses against Ontario's [Real Estate Council of Ontario (RECO)](https://www.reco.on.ca/) database. To enable this feature:

1. Sign up at [Browserless.io](https://www.browserless.io) (free tier: 1,000 requests/month)
2. Add your API key to `.env.local`

Verification checks:
- License status (Active, Suspended, Terminated, Expired, Revoked)
- Brokerage registration
- License type (Broker, Salesperson, Broker of Record)

## 📜 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run seed     # Seed database with sample data
npm run ingest   # Ingest listing data
```

## 🌐 Deployment

The project is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and set the environment variables.

```bash
vercel --prod
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and not licensed for public use.

---

<p align="center">
  Made with ❤️ for Toronto's housing market
</p>

