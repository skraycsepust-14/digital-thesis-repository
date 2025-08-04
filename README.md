📘 Digital Thesis Repository
A full-stack web application for managing, uploading, and exploring academic theses with powerful search, user roles, and AI-driven writing tools.
________________________________________
🚀 Features
🎓 User Roles
•	Student: Upload and manage their theses
•	Supervisor: Review theses, manage students
•	Admin: Manage users, dashboards, analytics
🔐 Authentication
•	JWT-based login/logout
•	Secure role-based route protection
📚 Thesis Management
•	Upload metadata + file
•	View and approve/reject submissions
•	Analytics dashboard for thesis stats
🔍 Search + Filters
•	Department, year, supervisor
•	Sort: Newest/Oldest
•	Results in detailed list format with metadata
•	Pagination included
🛠️ Admin Tools
•	View and modify user roles
•	Delete users
•	Filter/sort by roles
•	Track role changes (log optional)
🤖 AI-Powered Thesis Tools
Accessible from Thesis Tools page for all roles:
•	Grammar & spelling checker
•	Abstract generator
•	Title generator
•	Keyword extractor
•	Plagiarism check (simulated)
•	Reference formatter
•	Text simplifier
Each tool includes its own input/output section, animated tabs, and copy functionality.
________________________________________
🧱 Tech Stack
Frontend
•	React (Hooks + Context)
•	React Router
•	Axios
•	Bootstrap 5 + FontAwesome
•	Framer Motion (tab animations)
Backend (assumed)
•	Node.js + Express
•	MongoDB (users & theses)
•	JWT authentication
•	AI tools route: /api/ai/{tool}
________________________________________
🗂️ Folder Structure (Frontend)
/src
  /components
  /pages
  /context
  /styles
  App.jsx
  main.jsx
________________________________________
🧪 Running the Project
Frontend
cd frontend
npm install
npm start
Backend (assumed)
cd backend
npm install
npm run dev
________________________________________
🔧 To Do / Improvements
•	Dark mode toggle
•	Audit logs
•	PDF preview
•	Email confirmations
•	Admin notifications
________________________________________
📄 License
MIT License — Open-source for educational use.
