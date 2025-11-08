# Installation Instructions

## Prerequisites

1. Node.js (version 16 or higher)
2. npm or yarn package manager

## Installation Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install TypeScript types (if you encounter type errors):
   ```bash
   npm install --save-dev @types/react @types/node
   ```

3. Install Tailwind CSS dependencies:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to http://localhost:3000

## Troubleshooting

If you encounter module not found errors:

1. Make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. If TypeScript errors persist, install the missing types:
   ```bash
   npm install --save-dev @types/react @types/node @types/react-dom
   ```

3. For Tailwind CSS issues:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

## Project Structure

```
fx_alert_next/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── components/   # React components
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── services/         # Business logic services
│   └── types/            # TypeScript types
├── public/               # Static assets
├── package.json          # Dependencies and scripts
├── tailwind.config.ts    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── tsconfig.json         # TypeScript configuration
```