import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function App() {
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [inBodyText, setInBodyText] = useState('');
  const [weightLogs, setWeightLogs] = useState([]);
  const [inBodyScans, setInBodyScans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const weightQuery = query(collection(db, "weight_logs"), orderBy("date", "asc"));
      const weightSnapshot = await getDocs(weightQuery);
      setWeightLogs(weightSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const scanQuery = query(collection(db, "inbody_scans"), orderBy("date", "asc"));
      const scanSnapshot = await getDocs(scanQuery);
      setInBodyScans(scanSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching data: ", err);
    }
  };

  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    if (!weight) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "weight_logs"), {
        weight: parseFloat(weight),
        notes,
        date: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp()
      });
      setWeight('');
      setNotes('');
      fetchData();
    } catch (err) {
      console.error("Error logging weight:", err);
    }
    setLoading(false);
  };

  const handleInBodyParse = async (e) => {
    e.preventDefault();
    if (!inBodyText) return;

    const extractVal = (regex) => {
      const match = inBodyText.match(regex);
      return match ? parseFloat(match[1]) : null;
    };

    const parsedScan = {
      date: new Date().toISOString().split('T')[0],
      weight: extractVal(/(?:Weight|Peso)[:\s]+([\d.]+)/i) || parseFloat(weight) || 0,
      smm: extractVal(/(?:Skeletal Muscle Mass|Músculo Esquelético|SMM)[:\s]+([\d.]+)/i),
      bfm: extractVal(/(?:Body Fat Mass|Masa Grasa Corporal|BFM)[:\s]+([\d.]+)/i),
      pbf: extractVal(/(?:Percent Body Fat|Porcentaje de Grasa|PBF)[:\s]+([\d.]+)/i),
      visceralFat: extractVal(/(?:Visceral Fat Level|Grasa Visceral)[:\s]+([\d.]+)/i),
      timestamp: serverTimestamp()
    };

    setLoading(true);
    try {
      await addDoc(collection(db, "inbody_scans"), parsedScan);
      setInBodyText('');
      alert("InBody Scan parsed and saved successfully!");
      fetchData();
    } catch (err) {
      console.error("Error saving scan:", err);
    }
    setLoading(false);
  };

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : '--';
  const startingWeight = weightLogs.length > 0 ? weightLogs[0].weight : '--';
  const latestScan = inBodyScans.length > 0 ? inBodyScans[inBodyScans.length - 1] : null;

  const chartData = {
    labels: weightLogs.map(log => log.date),
    datasets: [
      {
        label: 'Weight (kg)',
        data: weightLogs.map(log => log.weight),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        fill: true,
        tension: 0.3,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8' } },
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-6 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-sky-400">Body & Biometrics Tracker</h1>
        <p className="text-slate-400 text-sm mt-1">Daily weight monitoring & InBody scan analytics</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase font-semibold">Current Weight</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{latestWeight} <span className="text-sm font-normal text-slate-400">kg</span></p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase font-semibold">Starting Weight</p>
          <p className="text-2xl font-bold text-slate-200 mt-1">{startingWeight} <span className="text-sm font-normal text-slate-400">kg</span></p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase font-semibold">Latest Muscle (SMM)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{latestScan?.smm ? `${latestScan.smm} kg` : 'N/A'}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase font-semibold">Latest Body Fat (PBF)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{latestScan?.pbf ? `${latestScan.pbf}%` : 'N/A'}</p>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Weight Trend Over Time</h2>
        {weightLogs.length > 0 ? (
          <div className="h-72">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <p className="text-slate-500 text-center py-12">No weight logs recorded yet. Add your first weight below!</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Log Daily Weight</h2>
          <form onSubmit={handleWeightSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Weight (kg / lbs)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 89.5"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Morning, post-workout"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded transition"
            >
              {loading ? "Saving..." : "Save Weight Log"}
            </button>
          </form>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-sky-400">Import InBody Scan Data</h2>
          <form onSubmit={handleInBodyParse} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Paste Scan Text / Summary</label>
              <textarea
                rows="3"
                value={inBodyText}
                onChange={(e) => setInBodyText(e.target.value)}
                placeholder="Paste text containing SMM, BFM, PBF metrics..."
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 rounded transition"
            >
              {loading ? "Parsing..." : "Parse & Save InBody Scan"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
