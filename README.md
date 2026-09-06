# 🎓 Adaptive Learning Platform

An intelligent, multi-role adaptive learning platform featuring:
- **Multi-Role Authentication**: Dedicated portals for **Students**, **Mentors**, and **Faculty**.
- **MAPS Diagnostic Entrance Engine**: Dynamic 15-question sampling (5 Beginner, 5 Intermediate, 5 Advanced) with weighted scoring ($1.0, 2.0, 3.0$) and automated placement into `beginner`, `intermediate`, or `advanced` tiers.
- **In-Platform Module Learning**: Interactive curriculum reader with code blocks, live study timer, and content progress logging.
- **Mentor / Faculty Approval Workflow**: Periodic (weekly/3-day) test access requests with study metrics tracking (`Threshold Met` vs `Below recommended`) and mentor approval/rejection pipeline.
- **Mastery Verification**: Module-specific periodic tests unlocking upon mentor approval.
- **Zero External Dependencies**: Built with built-in SQLite matching PostgreSQL DDL, running out-of-the-box on Windows without requiring a database server setup.

---

## ⚡ Quick Start

### 1. Start Backend API Server
In one terminal:
```bash
cd server
npm start
```
*Runs on `http://localhost:5000` (auto-seeds database with courses, modules, 30+ categorized questions, and demo accounts).*

### 2. Start Frontend UI
In a second terminal:
```bash
cd client
npm run dev
```
*Runs on `http://localhost:3000` with automatic API proxying.*

---

## 👥 Demo Accounts (Pre-configured)

| Role | Name | Email | Password | Initial State |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Alex Rivera | `alex@student.com` | `password123` | Fresh student ready to take the MAPS Entrance Exam |
| **Student** | Maria Chen | `maria@student.com` | `password123` | Intermediate level; has a pending periodic test request |
| **Mentor** | Prof. Sarah Jenkins | `prof.sarah@mentor.com` | `password123` | Approves / rejects periodic test requests |
| **Faculty** | Dr. Robert Vance | `dr.jenkins@faculty.com` | `password123` | Monitors student rosters and question bank |

> **Note:** The top navbar includes a **Quick Switcher** so you can effortlessly switch between Student, Mentor, and Faculty roles with a single click.

---

## 🧠 MAPS Diagnostic Exam Algorithm

1. **Question Selection**: Pulls 15 questions distributed equally across difficulty tiers:
   - 5 Beginner questions ($W_B = 1.0$)
   - 5 Intermediate questions ($W_I = 2.0$)
   - 5 Advanced questions ($W_A = 3.0$)
2. **Weighted Scoring**:
   $$\text{Total Points} = (C_B \times 1.0) + (C_I \times 2.0) + (C_A \times 3.0)$$
   $$\text{Maximum Possible Points} = 30.0$$
   $$\text{Percentage } (P) = \left(\frac{\text{Total Earned Points}}{30.0}\right) \times 100$$
3. **Curriculum Placement**:
   - $P < 45\% \implies$ **Beginner** (Unlocks Level 1 modules).
   - $45\% \le P < 75\% \implies$ **Intermediate** (Bypasses Level 1; unlocks Level 2 modules directly).
   - $P \ge 75\% \implies$ **Advanced** (Bypasses Levels 1 & 2; unlocks Level 3 modules directly).

---

## 🧪 Testing

Run the automated end-to-end integration test suite:
```bash
cd server
node test-e2e.js
```
Runs 10 verification steps spanning registration, entrance diagnostic generation, weighted scoring, curriculum unlocking, study tracking, periodic test requests, mentor approvals, and periodic evaluation scoring.
