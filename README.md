# OpticSuitV3

OpticSuitV3 is a comprehensive, multi-tenant solution for managing optical businesses. Designed as a **High-Efficiency Clinical Ledger**, it focuses on precise data registration and management after patient consultations.

The application is structured around a **Modular CRUD Architecture**, allowing total control over each stage of the patient journey—from clinical records to financial tracking—ensuring that physical notes are digitized without errors and with full auditability.

## 🚀 Technologies Used

### Backend
*   **.NET 9 (Web API):** High-performance server-side logic.
*   **PostgreSQL 15:** Reliable relational database with schema-based multi-tenancy.
*   **Entity Framework Core:** ORM for robust data transactions.

### Frontend
*   **React 18 (Vite):** Fast, component-based UI.
*   **Vanilla CSS:** Custom design system optimized for clarity and reduced distraction.

## 📦 Key Pillars (Modular Design)

### 1. **Patient Management (CRUD)**
*   Full control over patient records.
*   Advanced search and deduplication to ensure data integrity when capturing from physical notes.

### 2. **Clinical Consultations**
*   Independent management of medical and refraction exams.
*   Flexible workflows that support both quick medical fees and detailed lens prescriptions.

### 3. **Financial Control (Sales & Payments)**
*   **Sales Module:** Registration of sales notes with manual folio support and automatic duplicate handling (Suffix logic).
*   **Commission Tracking:** Automatic 50/50 split for multi-vendor sales, incentivizing branded frames.
*   **Payment CRUD:** Independent management of income (Abonos), which serves as the primary source for financial reporting.

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
    *   *Schema: sandbox*
