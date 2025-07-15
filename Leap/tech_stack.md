#  Project Tech Stack

This document lists the main packages and technologies used in this project.

---

## ✅ Frontend (React + Vite)

- **Frameworks & Libraries**
  - `react` (v18.2.0)
  - `react-dom`
  - `vite` (for development/build tooling)
  - `react-router-dom` (routing)
  - `clsx` (conditional class names)
  - `axios` (API requests)
  - `framer-motion` (animations)
  - `sweetalert2` (alerts & modals)
  - `lucide-react`, `@tabler/icons-react` (icons)
  - `react-icons`, `react-select`
  - `chart.js`, `react-chartjs-2`, `recharts` (charts & graphs)
  - `xlsx`, `file-saver` (Excel file handling)

- **UI & Styling**
  - `tailwindcss`, `tailwindcss-animate`, `tailwind-merge`
  - `@headlessui/react` (accessible UI components)
  - `aos` (scroll animations)
  - `keen-slider` (carousel/slider)
  - `@radix-ui/react-*` (modular UI components)

- **Visual Editors**
  - `grapesjs`, `grapesjs-preset-webpage`, `grapesjs-plugin-forms`, etc. (drag & drop page builder)

- **Particles & Effects**
  - `react-tsparticles`, `@tsparticles/react`, `@tsparticles/engine`

---

##  Backend (FastAPI)

- **Backend Language**: Python (inferred from `quiz_routes.py`)
- **Framework**: FastAPI
- **ORM**: SQLAlchemy (via `db.execute(...)`)
- **Database**: MySQL or PostgreSQL (based on usage of `text()`, `commit()`, `rollback()`)

---

## 🛠 Dev Tools & Linters

- `eslint`, `@typescript-eslint/*` (linting)
- `typescript` (type safety)
- `postcss`, `autoprefixer` (CSS tooling)
- `@vitejs/plugin-react`, `@vitejs/plugin-react-swc`

---
##  Dev Dependencies (Type & Tooling Support)

- `@types/*` for TypeScript support
- `@vitejs/plugin-react-swc` for faster builds

---

## Email / Auth (if applicable)
- `nodemailer` (for email sending)
- `jwt-decode` (for decoding JWT tokens)

---

>  This project uses **TypeScript**, **React**, and **FastAPI**, making it a full-stack application with strong typing, fast development, and modern architecture.
