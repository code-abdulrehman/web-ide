# Web-IDE Project

A full-stack application with a React frontend and Express backend.

## Features

- **React** frontend with modern UI
- **Tailwind CSS** for styling
- **React Icons** for beautiful icons
- **Express** backend running on port 4000
- **CORS** enabled for cross-origin requests

## Project Structure

```
Web-IDE/
├── client/            # React frontend
│   ├── public/        # Static files
│   ├── src/           # React source code
│   └── ...
├── server/            # Express backend
│   ├── index.js       # Express server
│   └── ...
└── package.json       # Root package.json for running both client and server
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- pnpm package manager

### Installation

1. Install dependencies for both client and server:

```bash
pnpm run install:all
```

### Running the Application

#### Development Mode

To run both the client and server in development mode:

```bash
pnpm run dev
```

To run only the client:

```bash
pnpm run client
```

To run only the server:

```bash
pnpm run server
```

## API Endpoints

### Base URL

```
http://localhost:4000
```

### Available Endpoints

- `GET /` - Returns a simple message to verify the server is running.

## Client

The React client is running on:

```
http://localhost:3000
``` 