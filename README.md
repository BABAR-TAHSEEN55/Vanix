# Vanix

**Silence is Currency** — End-to-end encrypted ephemeral messaging platform

[![Next.js](https://img.shields.io/badge/Next.js-16.0.5-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green?logo=postgresql)](https://neon.tech/)

## Overview

Vanix is a cyberpunk-themed, end-to-end encrypted messaging platform that prioritizes privacy and security. Messages are encrypted client-side before transmission and can be configured to self-destruct after reading, ensuring absolute deniability and zero-knowledge architecture.

### Key Features

- **Vanish Mode** - Self-destructing notes that are cryptographically burned after reading
- **Client-Side Encryption** - AES-256-CBC encryption happens in your browser
- **Ephemeral Links** - One-time access URLs with embedded decryption keys
- **Zero Knowledge** - Server never sees your unencrypted data
- **Cyberpunk UI** - Terminal-inspired interface with neon aesthetics
- **Responsive Design** - Works seamlessly across all devices

## Quick Start

### Prerequisites

- **Node.js** 18+ (recommended: use with `bun` for better performance)
- **PostgreSQL** database (Neon recommended)
- **Git**

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/your-username/vanix.git
    cd vanix
    ```

2. **Install dependencies**

    ```bash
    bun install
    # or
    npm install
    ```

3. **Environment Setup**

    ```bash
    cp .env.example .env.local
    ```

    Configure your environment variables:

    ```env
    # Database
    DATABASE_URL="your_neon_database_url"

    # Encryption (Generate a secure 32-byte base64 key)
    CRYPTO_KEY="your_base64_encoded_32_byte_key"
    ```

4. **Database Setup**

    ```bash
    # Run migrations
    bun drizzle-kit generate
    bun drizzle-kit migrate
    ```

5. **Start Development Server**

    ```bash
    bun dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to see the application.

## Architecture

### Tech Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + Custom Neon Theme
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Encryption**: Node.js Crypto (AES-256-CBC)
- **Icons**: Lucide React
- **ID Generation**: Nanoid

### Project Structure

```
vanix/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (encrypted-Messages)/
│   │   │   └── composer/       # Message encryption interface
│   │   ├── api/                # API routes
│   │   ├── common/             # Shared components
│   │   └── landing/            # Landing page components
│   ├── components/             # Reusable UI components
│   ├── db/                     # Database schema & config
│   └── lib/                    # Utilities & encryption logic
├── drizzle/                    # Database migrations
├── public/                     # Static assets
└── ...config files
```

## Security Architecture

### Encryption Flow

1. **Client-Side Encryption**: Messages are encrypted in the browser using AES-256-CBC
2. **Secure Key Generation**: 256-bit encryption keys with random IV for each message
3. **Database Storage**: Only encrypted ciphertext is stored on the server
4. **Ephemeral Links**: Decryption happens client-side via URL fragment (#)
5. **Self-Destruction**: Messages can be configured to delete after first read

### Security Features

- **Zero-Knowledge Architecture**: Server never sees plaintext
- **Forward Secrecy**: Each message uses a unique IV
- **Secure Random Generation**: Cryptographically secure randomness
- **Memory Safe**: No plaintext persistence in server memory
- **Transport Security**: HTTPS enforced for all communications

## Development

### Available Scripts

```bash
# Development
bun dev          # Start development server
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint

# Database
bunx drizzle-kit generate    # Generate migrations
bunx drizzle-kit migrate     # Run migrations
bunx drizzle-kit studio     # Open database studio
```

### Environment Variables

| Variable              | Description                           | Required |
| --------------------- | ------------------------------------- | -------- |
| `DATABASE_URL`        | PostgreSQL connection string          | Yes      |
| `CRYPTO_KEY`          | Base64-encoded 32-byte encryption key | Yes      |
| `NEXT_PUBLIC_APP_URL` | Public app URL for link generation    | Optional |

### Generating Encryption Key

```bash
# Generate a secure encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## UI/UX Features

- **Terminal Aesthetics**: Cyberpunk-inspired design with neon green/purple accents
- **Real-time Encryption Animation**: Visual feedback during encryption process
- **Responsive Grid Layout**: Optimized for mobile and desktop
- **Dark Theme**: Eye-friendly dark interface
- **Accessibility**: WCAG compliant color contrasts and keyboard navigation

## Configuration

### Encryption Settings

Configure encryption parameters in `src/lib/encryption.ts`:

- **Algorithm**: AES-256-CBC (configurable)
- **Key Size**: 256 bits
- **IV Size**: 128 bits (16 bytes)
- **Encoding**: Hexadecimal

---

**Remember**: In the digital age, silence truly is currency.

_"Zero logs. Zero knowledge. Absolute deniability."_
