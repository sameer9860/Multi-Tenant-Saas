# Multi-Tenant SaaS CRM

A professional, robust Multi-Tenant SaaS CRM system built to help businesses manage their internal operations, lead generation, and customer relationships with ease. This project features a unified backend serving multiple organizations, each with its own isolated data and subscription-based feature sets.

## 🚀 About the Project

This CRM is designed as a scalable SaaS application. It allows different organizations (tenants) to register and manage their own set of leads, clients, and team members.

**Key Features:**

- **Multi-Tenancy**: Complete data isolation between different organizations.
- **Subscription Management**: Integrated billing system with tiered plans (Free, Basic, Pro).
- **Lead & Client Tracking**: Streamlined CRM workflows to manage potential and existing customers.
- **Activity Logs**: Audit trails for sensitive operations.
- **Modern Dashboard**: Real-time analytics and usage statistics.

## 🛠 Tech Stack

### Backend

- **Framework**: Django & Django REST Framework (DRF)
- **Database**: SQLite (Development) / Compatible with PostgreSQL/MySQL
- **Authentication**: JWT / Token-based
- **Language**: Python 3.x

### Frontend

- **Framework**: React.js
- **Styling**: TailwindCSS
- **State Management**: React Hooks / Context API
- **Charts**: Chart.js

## ⚙️ How to Run

### Backend Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/sameer9860/Multi-Tenant-Saas.git
   cd Multi-Tenant-SaaS
   ```

2. **Create and activate a virtual environment:**

   ```bash
   python -m venv venv
   source venv/bin/activate(Linux/Mac)  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**

   ```bash
   python manage.py migrate
   ```

5. **Start the development server:**
   ```bash
   python manage.py runserver
   ```
   The backend will be available at `http://localhost:8000`.

### Frontend Setup

1. **Navigate to the frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   The frontend will be available at `http://localhost:3000`.

---

## 💎 Features: Subscription & Upgrade

The **Upgrade** feature allows your organization to expand its capabilities by switching to a plan that better suits your needs.

### Available Plans & Pricing

| Feature          | Free | Basic         | Pro           |
| :--------------- | :--- | :------------ | :------------ |
| **Price**        | Free | NPR 2500 / mo | NPR 3900 / mo |
| **Invoices**     | 10   | 1000          | Unlimited     |
| **Customers**    | 5    | 50            | Unlimited     |
| **Team Members** | 1    | 3             | Unlimited     |
| **API Calls**    | 100  | 10,000        | Unlimited     |

### How to Upgrade

1. **Navigate to Subscription**: Go to the **Settings** or **Billing** section in your dashboard.
2. **Select a Plan**: Choose between **Basic** and **Pro**.
3. **Payment**: Proceed to payment securely via **eSewa** or **Khalti**.
4. **Instant Activation**: Your plan limits are updated immediately upon successful payment.

---

## 📸 Screenshots

_(Photos will be added here to demonstrate the project interface and upgrade process)_
