# OpticSuitV3

OpticSuitV3 is a comprehensive, multi-tenant solution for managing optical businesses. Built with a modern technology stack, it ensures scalability, performance, and a premium user experience. This version introduces a robust architecture designed to support multiple branches or independent optics through schema-based multi-tenancy.

## 🚀 Technologies Used

### Backend
*   **.NET 9 (Web API):** High-performance, cross-platform server-side logic.
*   **Entity Framework Core:** ORM for database interactions.
*   **PostgreSQL 15:** Reliable, open-source relational database.
*   **ASP.NET Core Identity & JWT:** Secure authentication and role-based authorization.
*   **Multi-tenancy:** Schema-per-tenant architecture implemented via custom Middleware and Interceptors.

### Frontend
*   **React 18 (Vite):** Fast, component-based UI development.
*   **CSS Modules & Custom Design System:** Standardized styling without external framework dependencies (Vanilla CSS approach) for maximum flexibility and performance.
*   **Modern UI/UX:** Responsive layouts, glassmorphism effects, and dynamic interactions.

### Infrastructure
*   **Docker & Docker Compose:** Containerization for consistent development and deployment environments.

## 📦 Key Features (Current Status)

The project is currently in active development, with the following modules and features implemented:

### 1. **Authentication & Security**
*   **JWT Authentication:** Secure API access tokens.
*   **Role-Based Access Control (RBAC):** Distinct roles for `Root`, `Admin`, and `Vendedor`.
*   **Multi-tenancy:** Automatic schema switching based on the authenticated user.

### 2. **Patient Management**
*   **CRUD Operations:** Full management of patient records.
*   **Historical Data Capture:** A specialized wizard flow (`Step1` to `Step3`) for importing or capturing legacy patient data, consultations, and graduations efficiently.

### 3. **Medical Consultations**
*   Management of optometric exams and consultation details.
*   Integration with patient records.

### 4. **Sales (POS)**
*   Basic structure for managing sales (`SalesController`, `SalesService`).
*   Integration with inventory and medical consultations (in progress).

### 5. **System Configuration**
*   Tenant-specific settings and user management.

## 📂 Project Structure

*   `OpticBackend/`: .NET Web API source code.
    *   `Controllers/`: API Endpoints.
    *   `Models/`: Database Entities.
    *   `Services/`: Business logic (e.g., `SalesService`, `TenantService`).
    *   `Middleware/`: Custom pipeline components (e.g., `TenantMiddleware`).
*   `OpticFrontend/`: React application.
    *   `src/components/`: Reusable UI components organized by module (`patients`, `historical`, `auth`, etc.).
    *   `src/context/`: Global state management.
*   `data/`: Persisted PostgreSQL data.

## 🛠 Getting Started

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.

### Installation & Running
1.  **Clone the repository**.
2.  **Navigate to the project root**.
3.  **Start the application**:
    ```bash
    docker-compose up --build
    ```
    This command will:
    *   Start the PostgreSQL database.
    *   Build and launch the **Backend** (accessible at `http://localhost:8080`).
    *   Build and launch the **Frontend** (accessible at `http://localhost:5173`).

### Default Credentials (Seeding)
Upon first run, the system seeds the following users:

*   **Global Admin (Root):**
    *   Email: `admin@opticsuit.com`
    *   Password: `Password123!`
    *   *Schema: public*

*   **Optos (Tenant Admin):**
    *   Email: `test@opticsuit.com`
    *   Password: `Password123!`
    *   *Schema: public_test*
