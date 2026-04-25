# Quicksand

Quicksand is a robust, full-stack web application built with modern technologies focusing on performance, type safety, and scalability.

## Tech Stack

- Framework: Next.js 15
- Language: TypeScript
- Database: SurrealDB
- API: tRPC
- Styling: Tailwind CSS & Radix UI primitives
- Authentication: NextAuth.js
- Testing: Vitest & Playwright

## Prerequisites

- Node.js (>= 18.17.0)
- SurrealDB (v1)

## Getting Started

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure your environment variables:
Copy `.env.example` to `.env` and fill in the required values.

3. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check code quality.
- `npm run format`: Formats code using Prettier.
- `npm run test`: Runs unit and integration tests using Vitest.
- `npm run test:e2e`: Runs end-to-end tests using Playwright.
- `npm run db:setup`: Initializes the SurrealDB schema.

## Project Structure

- `/src/app`: Next.js App Router pages and layouts.
- `/src/components`: Reusable React components.
- `/src/server`: tRPC routers and backend logic.
- `/scripts`: Utility scripts for database management and setup.
- `/e2e`: Playwright end-to-end tests.
- `/docs`: Additional project documentation.

## License

This project is licensed under the MIT License.
