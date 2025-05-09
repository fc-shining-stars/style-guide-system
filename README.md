# Style Guide System

A comprehensive style guide system with responsive design, versioning, real-time updates, image management, and an intuitive admin panel.

[![Automated Tests](https://github.com/fc-shining-stars/style-guide-system/actions/workflows/automated-tests.yml/badge.svg)](https://github.com/fc-shining-stars/style-guide-system/actions/workflows/automated-tests.yml)

## Features

- **Responsive Design**: Adapts to different screen sizes and devices
- **Versioning**: Track changes to your style guide over time
- **Real-time Updates**: See changes as they happen
- **Image Management**: Upload and manage images for your style guide
- **Admin Panel**: Intuitive interface for managing your style guide
- **Natural Language Processing**: Process natural language requests
- **Comprehensive Testing**: Automated testing for UI and database

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/fc-shining-stars/style-guide-system.git
cd style-guide-system
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:

```bash
npm run db:setup
# or
yarn db:setup
```

5. Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

The Style Guide System includes a comprehensive testing framework. For detailed information, see [TESTING.md](TESTING.md).

### Running Tests

To run all tests:

```bash
npm run test:all
# or
yarn test:all
```

To use the interactive testing CLI:

```bash
npm run test:cli
# or
yarn test:cli
```

### Automated Testing

This repository is set up with GitHub Actions to automatically run tests on:
- Every push to main/master
- Every pull request to main/master
- Daily at midnight
- Manual triggering

Test reports are published to GitHub Pages and can be viewed at:
```
https://fc-shining-stars.github.io/style-guide-system/
```

## Project Structure

```
style-guide-system/
├── public/              # Static files
├── scripts/             # Testing and utility scripts
├── src/                 # Source code
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   ├── lib/             # Utility functions
│   ├── styles/          # CSS styles
│   └── db/              # Database related code
├── test-results/        # Test results and reports
├── .env.local           # Environment variables
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Socket.IO](https://socket.io/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Headless UI](https://headlessui.dev/)
- [Heroicons](https://heroicons.com/)
- [Playwright](https://playwright.dev/) - Used for comprehensive testing
