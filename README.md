# OpticSuitV3

OpticSuitV3 is a comprehensive solution for managing optics operations, built with modern technologies to ensure scalability, performance, and ease of use.

## Technologies Used

*   **Backend:** .NET 9 (C#)
*   **Frontend:** React (Vite)
*   **Database:** PostgreSQL 15
*   **Containerization:** Docker & Docker Compose

## Prerequisites

*   Docker Desktop installed and running.

## Getting Started

To get the application running locally, follow these steps:

1.  Clone the repository (if applicable).
2.  Navigate to the project root directory.
3.  Run the application using Docker Compose:

    ```bash
    docker-compose up --build
    ```

    This command will:
    *   Start the PostgreSQL database container.
    *   Build and start the Backend API container (accessible at `http://localhost:8080` / `127.0.0.2:80`).
    *   Build and start the Frontend container (accessible at `http://localhost:5173` / `127.0.0.3:80`).

## Project Structure

*   `OpticBackend/`: Contains the .NET Web API source code.
*   `OpticFrontend/`: Contains the React application source code.
*   `data/`: Persistent storage for the database (configured in docker-compose).
