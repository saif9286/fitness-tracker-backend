import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import api from '../services/api';
import { Scale, TrendingDown, Calendar, Plus, History, ArrowDownRight, ArrowUpRight } from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function WeightTracker() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  
  // Form states
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [logging, setLogging] = useState(false);
  const [filterDays, setFilterDays] = useState(30);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [histRes, profileRes] = await Promise.all([
        api.get(`/weight?days=${filterDays}`),
        api.get('/profile'),
      ]);

      if (histRes.data.success) {
        setHistory(histRes.data.data);
      }
      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
        setWeight(profileRes.data.data.weight.toString());
      }
    } catch (err) {
      toast.error('Failed to load weight metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDays]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weight || parseFloat(weight) <= 0) {
      return toast.warning('Please enter a valid weight');
    }

    setLogging(true);
    try {
      const { data: res } = await api.post('/weight', {
        weight: parseFloat(weight),
        date: date,
      });

      if (res.success) {
        toast.success(`Logged weight of ${weight} kg`);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to log weight');
    } finally {
      setLogging(false);
    }
  };

  // Helper calculations
  const calculateDelta = () => {
    if (history.length < 2) return { value: 0, type: 'stable' };
    const first = history[0].weight;
    const last = history[history.length - 1].weight;
    const diff = Math.round((last - first) * 10) / 10;
    
    return {
      value: diff,
      type: diff < 0 ? 'loss' : diff > 0 ? 'gain' : 'stable'
    };
  };

  const delta = calculateDelta();

  // Chart configs
  const chartLabels = history.map((h) => new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const chartValues = history.map((h) => h.weight);

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        fill: true,
        label: 'Weight (kg)',
        data: chartValues,
        borderColor: '#4dabf7',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(77, 171, 247, 0.25)');
          gradient.addColorStop(1, 'rgba(77, 171, 247, 0)');
          return gradient;
        },
        borderWidth: 2.5,
        pointBackgroundColor: '#4dabf7',
        pointBorderColor: 'var(--bg-elevated)',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'var(--bg-surface)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-primary)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#666666', font: { family: 'Inter' } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#666666', font: { family: 'Inter' } },
      },
    },
  };

  if (loading && history.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1>Weight Tracker & Trends</h1>
          <p>Monitor your weight log over time, analyze trends and track goals.</p>
        </div>

        {/* Date filter tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '4px', border: '1px solid var(--border-primary)' }}>
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setFilterDays(days)}
              className={`btn btn-sm ${filterDays === days ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', minWidth: '50px' }}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <Card style={{ borderLeft: '4px solid var(--accent-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-label text-tertiary">Current Weight</div>
            <div className="text-stat" style={{ marginTop: '4px' }}>
              {profile ? `${profile.weight} kg` : '-- kg'}
            </div>
            <div className="text-small text-secondary">Last recorded</div>
          </div>
          <div style={{ color: 'var(--accent-blue)', background: 'var(--accent-blue-bg)', padding: '10px', borderRadius: 'var(--radius-full)' }}>
            <Scale size={24} />
          </div>
        </Card>

        <Card style={{ borderLeft: `4px solid ${delta.value < 0 ? 'var(--accent-cool)' : delta.value > 0 ? 'var(--accent-warm)' : 'var(--border-primary)'}` }}>
          <div className="text-label text-tertiary">Period Change ({filterDays}D)</div>
          <div className="text-stat" style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {delta.value > 0 ? '+' : ''}{delta.value} kg
            {delta.value !== 0 && (
              <span style={{ color: delta.value < 0 ? 'var(--accent-cool)' : 'var(--accent-warm)' }}>
                {delta.value < 0 ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
              </span>
            )}
          </div>
          <div className="text-small text-secondary">
            {delta.type === 'loss' ? 'Down' : delta.type === 'gain' ? 'Up' : 'Maintained'} from start
          </div>
        </Card>

        {profile && (
          <>
            <Card style={{ borderLeft: '4px solid var(--accent-purple)' }}>
              <div className="text-label text-tertiary">BMI Score</div>
              <div className="text-stat" style={{ marginTop: '4px' }}>
                {profile.bmi}
              </div>
              <div className="text-small text-secondary" style={{ textTransform: 'capitalize' }}>
                {profile.bmi < 18.5 ? 'Underweight' : profile.bmi < 25 ? 'Normal' : profile.bmi < 30 ? 'Overweight' : 'Obese'}
              </div>
            </Card>

            <Card style={{ borderLeft: '4px solid var(--accent-primary)' }}>
              <div className="text-label text-tertiary">Body Targets</div>
              <div className="text-small text-secondary" style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>TDEE Cal:</span>
                  <span className="text-mono" style={{ color: 'var(--text-primary)' }}>{profile.tdee} kcal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Protein Target:</span>
                  <span className="text-mono" style={{ color: 'var(--text-primary)' }}>{profile.protein_goal}g</span>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Main split */}
      <div className="split-grid-12-5">
        
        {/* Weight history Chart */}
        <Card style={{ minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="card-title text-label" style={{ marginBottom: 'var(--space-4)' }}>Weight Graph ({filterDays} Days)</div>
          {history.length < 2 ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-tertiary)' }}>
              Log at least 2 weights to display a trend line.
            </div>
          ) : (
            <div style={{ flex: 1, position: 'relative' }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          )}
        </Card>

        {/* Log weight card & list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Form */}
          <Card>
            <h3 className="text-h3" style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Record Weight
            </h3>
            
            <form onSubmit={handleSubmit}>
              <Input
                label="Weight (kg)"
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75.0"
                required
              />

              <div className="form-group">
                <label className="form-label">Date</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full" loading={logging} style={{ marginTop: 'var(--space-2)' }}>
                Log Weight Entry
              </Button>
            </form>
          </Card>

          {/* List History */}
          <Card style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} className="text-secondary" />
              <h3 className="text-h3" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Recent Logs</h3>
            </div>
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {history.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                  No weights logged in this period.
                </div>
              ) : (
                history.slice().reverse().map((h) => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border-light)', fontSize: 'var(--text-sm)' }}>
                    <span className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} style={{ opacity: 0.6 }} />
                      {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-mono" style={{ fontWeight: 'var(--weight-semibold)' }}>{h.weight} kg</span>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
}
