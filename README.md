# Kvitto AB - Receipt Management System

A modern web application for managing business receipts with OCR capabilities, built with React, TypeScript, and Supabase.

## Features

<<<<<<< HEAD
- 🔐 Secure authentication system
- 📸 Receipt scanning with OCR
- ✍️ Manual receipt entry
- 📊 Dashboard with expense tracking
- 📱 Responsive design
- 🏷️ Category management
- 📄 Report generation
=======
- Secure authentication system
- Receipt scanning with OCR
- Manual receipt entry
- Dashboard with expense tracking
- Category management
- Report generation
>>>>>>> 8207d8d55045cdcbab17e5c21a6fc5637c1bd001

## Tech Stack

- **Frontend:** React with TypeScript
- **Styling:** TailwindCSS
- **Backend/Auth:** Supabase
- **OCR:** Google Cloud Vision API
- **Routing:** React Router
- **Icons:** Lucide React
- **Build Tool:** Vite

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Google Cloud Vision API key (for OCR features)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kvittoab
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/       # React context providers
├── pages/          # Page components
├── services/       # API and external service integrations
├── types/          # TypeScript type definitions
├── App.tsx         # Main application component
└── main.tsx        # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features in Detail

### Authentication
- User registration and login
- Password reset functionality
- Protected routes

### Receipt Management
- Scan receipts using device camera
- Manual receipt entry
- OCR text extraction
- Categorization
- Amount and date detection

### Dashboard
- Total expenses overview
- Recent receipts list
- Receipt count
- Latest transaction display

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

<<<<<<< HEAD
This project is licensed under the MIT License - see the LICENSE file for details.
=======
This project is licensed under the MIT License - see the LICENSE file for details.
>>>>>>> 8207d8d55045cdcbab17e5c21a6fc5637c1bd001
