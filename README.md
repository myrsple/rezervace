# Rezervační systém rybářství

Moderní, full-stack rezervační systém pro lovná místa postavený na Next.js, TypeScript, Prisma a Tailwind CSS.

## Funkce

### Funkce pro zákazníky
- **15 lovných míst**: Vyberte si z 15 prémiových lovných lokalit
- **Flexibilní možnosti rezervace**:
  - Jeden den (6:00 - 22:00) - 1250 Kč
  - 24 hodin (začátek ráno nebo večer) - 2000 Kč
  - 48 hodin (začátek ráno nebo večer) - 3750 Kč
- **Chytrý kalendář**: Vizuální dostupnost s podporou částečných rezervací
- **Jednoduché rezervování**: Vyžaduje pouze jméno, e-mail a telefon
- **Dostupnost v reálném čase**: Zabraňuje dvojitým rezervacím s detekcí konfliktů

### Funkce pro administrátory
- **Dashboard**: Kompletní přehled všech rezervací a míst
- **Správa rezervací**: Aktualizace stavu (Čekající, Potvrzeno, Zrušeno, Dokončeno)
- **Správa míst**: Zobrazení všech lovných míst a jejich stavu
- **Informace o zákaznících**: Přístup k údajům zákazníků pro každou rezervaci

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production ready)
- **Deployment**: Vercel-ready configuration

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rezervace-ryby
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```bash
   # Database
   DATABASE_URL="file:./dev.db"
   
   # Admin Authentication
   ADMIN_SECRET="your-admin-secret-key-change-this"
   
   # Email Configuration (optional)
   SMTP_HOST=""
   SMTP_PORT=""
   SMTP_USER=""
   SMTP_PASS=""
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   - Customer interface: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin

## Database Schema

The system uses three main models:

- **FishingSpot**: Manages the 15 fishing locations
- **Reservation**: Handles all booking information
- **Admin**: Admin user management

## API Endpoints

- `GET /api/fishing-spots` - Get all active fishing spots
- `GET /api/reservations` - Get all reservations
- `POST /api/reservations` - Create new reservation
- `PATCH /api/reservations/[id]` - Update reservation status

## Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard

3. **Production Database**
   For production, update `DATABASE_URL` to use PostgreSQL:
   ```bash
   DATABASE_URL="postgresql://username:password@host:port/database"
   ```

## Booking Logic

### Availability System
- **Available** (green): Spot is completely free
- **Occupied** (red): Spot is fully booked or unavailable
- **Partial** (yellow/red gradient): Single day booking exists, but 24h/48h booking is possible

### Conflict Prevention
- Day bookings (6AM-10PM) can coexist with evening 24h/48h bookings
- 24h and 48h bookings prevent any other bookings on those dates
- Past dates are automatically marked as occupied

### Cenová struktura
- **Jeden den**: 1250 Kč (6:00 - 22:00)
- **24 hodin**: 2000 Kč (Ráno: začátek v 6:00, Večer: začátek v 18:00)
- **48 hodin**: 3750 Kč (Ráno: začátek v 6:00, Večer: začátek v 18:00)

## Přístup pro administrátory

Výchozí přihlašovací údaje (změňte v produkci):
- E-mail: admin@rybarstvo.cz  
- Heslo: admin123

## Future Enhancements

Potential features for future development:
- Email confirmation system
- Payment integration
- Weather integration
- Customer reviews and ratings
- Mobile app
- Multi-language support

## Support

For support or questions, please contact the development team.

---

Built with ❤️ for fishing enthusiasts 