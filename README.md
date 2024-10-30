# Prime Number Pooling Application

## Objective

Create a system where multiple clients generate unique prime numbers and add them to a shared pool managed by a server. The communication between clients and server happens via TCP, and each client signs the prime numbers to ensure they come from a trusted source.

## Features

- **Server:**

  - Maintains a shared pool of prime numbers.
  - Verifies the uniqueness of received prime numbers.
  - Keeps track of which client sent which prime number.
  - Implements a signature verification mechanism.
  - Supports multiple clients concurrently.
  - Implements Round Robin mechanism (optional).

- **Clients:**
  - Generate unique prime numbers continuously.
  - Generate a private/public key pair for signing messages.
  - Send public key to the server upon connection.
  - Sign each prime number before sending to the server.
  - Supports optional Round Robin communication.

## Project Structure

- **src/**
  - **main.ts**: Entry point of the application.
  - **app.module.ts**: Root module.
  - **client/**: Client module and service.
  - **server/**: Server service.
  - **util/**: Helper functions and configuration.
- **test/**: Contains unit and E2E tests.

## Installation

### Prerequisites

- **Node.js** (version 14 or higher)
- **npm** package manager
- **Docker** (optional, for containerization)

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/prime-number-pooling.git
   ```

2. Navigate to the project directory:

   ```bash
   cd prime-number-pooling
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

## Running the Application

### Using Node.js

1. Build the application:

   ```bash
   npm run build
   ```

2. Start the application:

   ```bash
   npm run start:prod
   ```

   Or, for development with watch mode:

   ```bash
   npm run start:dev
   ```

### Using Docker

1. Build the Docker image:

   ```bash
   docker build -t prime_app .
   ```

2. Run the Docker container:

   ```bash
   docker run -p 3000:3000 prime_app
   ```

   Or, using Docker Compose:

   ```bash
   docker-compose up --build
   ```

## Testing

### Unit Tests

Run unit tests using Jest:
-> npm run test

### E2E Tests

Run E2E tests:
-> npm run test:e2e

## Configuration

Application configurations can be adjusted in the `AppConfig` class located at `src/util/config/appConfig.ts`.

- **host**: Server host (default: '127.0.0.1')
- **port**: Server port (default: 3000)
- **clientCount**: Number of clients to spawn.
- **primeLimit**: Total number of prime numbers to collect before stopping.
- **useRoundRobin**: Enable or disable Round Robin mechanism.
- **clientPingInterval**: Interval for client ping messages.
- **primeGenerationInterval**: Interval between prime number generations.

## Logging

The application uses NestJS's built-in logging mechanism. Logs for client and server activities are output to the console.

## Project Details

### Technologies Used

- **Node.js**
- **NestJS**
- **TypeScript**
- **Crypto module** for key generation and signing
- **Jest** for testing
- **Docker** for containerization

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
