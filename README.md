# VGrade

> **Calculate smarter. Plan better. Achieve higher.**

VGrade is a smart GPA & CGPA calculator built specifically for **VIT (Vellore Institute of Technology)** students. It follows the VIT grading system (S–F on a 10-point scale) and provides four powerful tools to help students track, analyse, and plan their academic performance — all in one clean, mobile-friendly app.

---

## Features

### 1. GPA Calculator
Calculate your semester GPA instantly using the VIT grading scale.

- Enter the number of courses — type any number, no limit
- Enter credits and grade (S / A / B / C / D / E / F) for each course
- Add or remove courses on the fly
- View your semester GPA with a visual progress bar
- Download your result as a `.txt` file
- Leads directly into **Grade Impact Analysis** via the "Try What If?" button

### 2. CGPA Calculator
Update your cumulative GPA after a new semester.

- Input your previous CGPA and total credits completed
- Input your current semester GPA and credits
- Instantly calculates your updated CGPA
- Displays total credits and a visual progress bar

### 3. Grade Impact Analysis
Explore how changing a grade affects your semester GPA — without touching your saved result.

- Automatically populated from your GPA Calculator result (click "Try What If?")
- Table view of all courses with current grade and an editable new grade dropdown
- GPA recalculates **instantly** on every change
- Shows **Current GPA**, **Updated GPA**, and the change with / Decrease indicators
- Changed rows are highlighted in violet
- **Reset Changes** button restores all grades to original values
- If no GPA data is available, prompts you to calculate GPA first

### 4. Target CGPA Planner
Find out exactly what GPA you need this semester to hit your target CGPA.

- Enter your current CGPA, credits completed, credits registered, and target CGPA
- Result updates **instantly as you type** — no button needed
- Displays a full plan summary card with all four inputs and the required GPA
- Smart status messages:
  - **Well within reach** — target is easily achievable
  - **Excellent semester needed** — required GPA ≥ 9
  - **Not achievable** — required GPA exceeds 10
  - **Already exceeded** — current CGPA is already above target
- **Clear All** button resets all fields

---

## Home Screen

The home screen gives quick one-tap access to all four tools with a short description of each. The Target CGPA Planner card also shows the prompt *"Will I get 9 CGPA this semester?"* as an example use case.

---

## Navigation

All sections are accessible via a **hamburger menu (three-line menu icon)** in the top-right corner of the header. The active section is highlighted in the menu. Tapping outside the menu closes it.

| Section | Description |
|---|---|
| Home | Landing screen with quick access to all tools |
| GPA Calculator | Semester GPA calculation |
| CGPA Calculator | Cumulative GPA update |
| Grade Impact Analysis | What-if grade scenario explorer |
| Target CGPA Planner | Required GPA planner |

---

## VIT Grading Scale

| Grade | Grade Points |
|---|---|
| S | 10 |
| A | 9 |
| B | 8 |
| C | 7 |
| D | 6 |
| E | 5 |
| F | 0 |

**GPA Formula:**

```
GPA = Σ (Credits × Grade Points) / Σ Credits
```

**CGPA Formula:**

```
CGPA = (Previous CGPA × Credits Completed + Current GPA × Current Credits)
       / (Credits Completed + Current Credits)
```

**Required GPA Formula (Target Planner):**

```
Required GPA = (Target CGPA × Total Credits After − Current CGPA × Credits Completed)
               / Credits Registered This Semester
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 with TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Build | Vite (recommended) |

---

## Project Structure

```
vgrade/
├── src/
│   ├── App.tsx          # Main application — all components live here
│   └── main.tsx         # React entry point
├── public/
│   └── favicon.ico
├── index.html
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Responsive Design

VGrade is fully responsive and works on all screen sizes — mobile, tablet, and desktop. The card layout adapts automatically and all inputs are touch-friendly.

---

## Developer

**Nithesh Kumar T**
[LinkedIn](https://www.linkedin.com/in/nithesh-kumar-t-b4028130a/)

---

*Made for VITians by a VITian*
