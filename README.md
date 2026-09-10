<div align="center">

# ⚡ TaskFlow Pro

### Modern, Full-Stack Collaborative Task & Workflow Management System

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  A sleek, production-ready MERN stack task management application designed for agile teams. Featuring granular role-based access control (Admin & Team Member), interactive data visualization, real-time status workflows, and automated Excel reporting.
</p>

[Key Features](#-key-features) • [Tech Stack](#-tech-stack) • [Project Structure](#-project-structure) • [Getting Started](#-getting-started) • [Environment Variables](#-environment-variables) • [Deployment](#-deployment)

---

</div>

## 🌟 Key Features

### 🔐 Authentication & Role-Based Access (RBAC)
- **Multi-Role System**: Distinct permissions and tailored user experiences for **Admins** and **Team Members**.
- **Admin Invite System**: Secure, token-gated admin registration (`ADMIN_INVITE_TOKEN`).
- **JWT Authorization**: Stateless, secure user sessions with protected backend routes and HTTP interceptors.

### 📊 Dynamic Dashboards & Analytics
- **Admin Dashboard**: Real-time team overview, task distribution metrics, high-level priority analysis, and member workloads.
- **User Dashboard**: Personalized workload tracking, pending deadlines, and interactive completion charts powered by **Recharts**.
- **Visual Status Breakdown**: Color-coded distribution of tasks across *Pending*, *In Progress*, and *Completed*.

### 📋 Full Task Lifecycle Management
- **Task Creation & Assignment**: Set priority (Low, Medium, High), due dates, descriptions, checklists, and assignees.
- **Interactive Checklists**: Sub-tasks with real-time toggleable progress tracking.
- **Quick Status Updates**: Seamless in-place status switches between workflow stages.

### 📑 Automated Reporting & File Uploads
- **Excel Exports (.xlsx)**: One-click export of comprehensive task lists and team performance reports built with **ExcelJS**.
- **Media Attachments**: Avatar image upload pipeline using **Multer**.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router DOM v7, Recharts, Lucide React, Axios, React Hot Toast, Moment.js |
| **Backend** | Node.js, Express.js 5, Mongoose (ODM), JWT (jsonwebtoken), BcryptJS, Multer, ExcelJS, CORS, Dotenv |
| **Database** | MongoDB Atlas (Cloud NoSQL) |
| **Deployment** | Vercel (FrontEnd) + Render (BackEnd) |

---

## 📁 Project Structure

```text
TaskFlow-Pro/
├── BackEnd/
│   ├── config/              # MongoDB connection & DNS configs
│   ├── controllers/         # Request handling logic (Auth, Task, User, Report)
│   ├── Middlewares/         # JWT verification & Multer upload middlewares
│   ├── Models/              # Mongoose data schemas (User, Task)
│   ├── routes/              # API route definitions
│   ├── Uploads/             # Uploaded media & avatar assets
│   ├── .env.example         # Backend environment variable template
│   ├── package.json         # Backend dependencies & scripts
│   └── server.js            # Express application entry point
│
├── FrontEnd/
│   ├── public/              # Static assets & SPA redirect configs
│   ├── src/
│   │   ├── components/      # Reusable UI components & layouts
│   │   ├── context/         # React Context (UserContext, Auth)
│   │   ├── hooks/           # Custom React hooks (useUserAuth, etc.)
│   │   ├── pages/           # Admin, User, and Authentication views
│   │   ├── utils/           # Axios instance & dynamic API route map
│   │   ├── App.jsx          # Route hierarchy & page wiring
│   │   └── main.jsx         # React application root
│   ├── .env.example         # Frontend environment variable template
│   ├── vercel.json          # Vercel SPA routing rewrite configuration
│   └── vite.config.js       # Vite build configuration
│
├── .gitignore               # Comprehensive Git ignore rules
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

Follow these steps to run the application locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or a local MongoDB instance)

---

### 1. Clone the Repository

```bash
git clone https://github.com/ankita03847/TaskFlow-Pro.git
cd TaskFlow-Pro
```

---

### 2. BackEnd Setup

1. Navigate to the `BackEnd` directory:
   ```bash
   cd BackEnd
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from the template:
   ```bash
   cp .env.example .env
   ```

4. Open `.env` and fill in your values:
   ```env
   PORT=8080
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secret_jwt_key
   ADMIN_INVITE_TOKEN=4588944
   CLIENT_URL=http://localhost:5173
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```
   *The server should run on `http://localhost:8080` with a successful MongoDB connection.*

---

### 3. FrontEnd Setup

1. Open a new terminal and navigate to `FrontEnd`:
   ```bash
   cd FrontEnd
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   *By default, the frontend will automatically connect to `http://localhost:8080`.*

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```

5. Open your browser at **`http://localhost:5173`**.

---

## 🔑 Environment Variables Reference

### BackEnd (`BackEnd/.env`)
| Variable | Description |
|---|---|
| `PORT` | The port your backend server listens on (e.g. `8080`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens |
| `ADMIN_INVITE_TOKEN` | Passcode required when registering an Admin account |
| `CLIENT_URL` | Allowed origin for CORS (e.g. `http://localhost:5173`) |

### FrontEnd (`FrontEnd/.env`)
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of your deployed or local backend API (e.g. `https://your-backend.onrender.com`) |

---

## 🌐 Production Deployment

### BackEnd (Render)
1. Create a new **Web Service** on [Render](https://render.com) and link this repository.
2. Set **Root Directory** to `BackEnd`.
3. Set **Build Command** to `npm install` and **Start Command** to `node server.js`.
4. Add your Environment Variables (`PORT`, `MONGO_URI`, `JWT_SECRET`, `ADMIN_INVITE_TOKEN`, `CLIENT_URL`).
5. Ensure your MongoDB Atlas cluster has IP `0.0.0.0/0` whitelisted under **Network Access**.

### FrontEnd (Vercel)
1. Import this repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `FrontEnd`.
3. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://your-render-backend.onrender.com`
4. Click **Deploy**. The included `vercel.json` ensures smooth client-side routing.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/ankita03847/TaskFlow-Pro/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/ankita03847">ankita03847</a></sub>
</div>
