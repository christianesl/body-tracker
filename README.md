# body-tracker

Web app to keep track of body metrics. It logs weight over time, parses InBody body-composition scans pasted as text, and shows the weight trend on a line chart.

## What it does

- **Log weight:** enter a weight (and optional notes) and save it with the current date.
- **Parse InBody scans:** paste the text of an InBody scan and the app extracts weight, skeletal muscle mass (SMM), body fat mass (BFM), percent body fat (PBF), and visceral fat level. It recognises both English and Spanish labels (for example `Weight` / `Peso`, `Skeletal Muscle Mass` / `Músculo Esquelético`).
- **Track progress:** shows the latest and starting weight, the latest scan, and a weight-over-time line chart.
- **Stores data in the cloud:** entries are saved in Firestore, in the `weight_logs` and `inbody_scans` collections, ordered by date.

## Stack

- React 18 with Vite 5
- Firebase Firestore (`firebase` ^10.8.0) — see `firebase.js` for the project configuration
- Chart.js 4 with `react-chartjs-2` for the weight chart
- Tailwind CSS (loaded from CDN in `index.html`)

## Project structure

```
.
├── App.jsx            # Main app: weight form, InBody parser, chart, Firestore reads/writes
├── main.jsx           # React entry point
├── firebase.js        # Firebase initialisation and Firestore export
├── index.html         # Page shell ("Body & Biometric Metrics Tracker")
├── vite.config.js     # Vite config (base is /body-tracker/ for production builds)
├── package.json       # Scripts and dependencies
└── dist/              # Built output
```

## Setup

Prerequisites: Node.js and npm, and a Firebase project with Firestore enabled.

```bash
npm install
```

If you want to point the app at your own Firebase project, update the configuration in `firebase.js`.

## Running it

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
```

## Notes

- The app reads and writes the `weight_logs` and `inbody_scans` Firestore collections, so the Firebase project needs Firestore enabled and rules that allow the app to read/write those collections.
- Dates are stored as `YYYY-MM-DD`.
