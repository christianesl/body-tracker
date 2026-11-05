import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [inBodyText, setInBodyText] = useState('');
  const [weightLogs, setWeightLogs] = useState([]);
  const [inBodyScans, setInBodyScans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data on load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const weightQuery = query(collection(db, "weight_logs"), orderBy("date", "desc"));
      const weightSnapshot = await getDocs(weightQuery);
      setWeightLogs(weightSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const scanQuery = query(collection(db, "inbody_scans"), orderBy("date", "desc"));
      const scanSnapshot = await getDocs(scanQuery);
      setInBodyScans(scanSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching data: ", err);
    }
  };

  // Handle Daily Weight Submission
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

  // Simple Regex Parser for InBody text exports
  const handleInBodyParse = async (e) => {
    e.preventDefault();
    if (!inBodyText) return;

    // Helper regex scanner for typical InBody printout values
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-sky-400">Body & Biometrics Tracker</h1>
        <p className="text-slate-400 text-sm mt-1">Daily weight monitoring & InBody scan analytics</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Quick Weight Form */}
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
                placeholder="e.g. 81.5"
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

        {/* InBody Import Form */}
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

      {/* Data Logs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-3 text-slate-200">Recent Weight Logs</h3>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {weightLogs.map(log => (
              <li key={log.id} className="flex justify-between bg-slate-900 p-3 rounded border border-slate-700/50">
                <span className="text-emerald-400 font-bold">{log.weight} kg</span>
                <span className="text-slate-400 text-sm">{log.date}</span>
                <span className="text-slate-500 text-xs italic">{log.notes}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-3 text-slate-200">Recent InBody Scans</h3>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {inBodyScans.map(scan => (
              <li key={scan.id} className="bg-slate-900 p-3 rounded border border-slate-700/50 text-xs space-y-1">
                <div className="flex justify-between font-bold text-sky-400">
                  <span>Weight: {scan.weight} kg</span>
                  <span>{scan.date}</span>
                </div>
                <div className="text-slate-300 flex justify-between">
                  <span>SMM: {scan.smm || 'N/A'} kg</span>
                  <span>BFM: {scan.bfm || 'N/A'} kg</span>
                  <span>PBF: {scan.pbf || 'N/A'}%</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}