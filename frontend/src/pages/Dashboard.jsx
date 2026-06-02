import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProgressRing from '../components/ui/ProgressRing';
import ProgressBar from '../components/ui/ProgressBar';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import api from '../services/api';
import { Flame, Droplets, Trophy, Plus, Scale, Dumbbell, Calendar, ChevronRight, Activity } from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals / forms state
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [loggingWeight, setLoggingWeight] = useState(false);

  const fetchDashboard = async () => {
    try {
      try {
        await api.post('/streaks/check');
      } catch (streakErr) {
        console.error('Failed to auto-update streaks', streakErr);
      }
      const [dashRes, trendRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/trends/protein?days=7'),
      ]);
      if (dashRes.data.success) {
        setData(dashRes.data.data);
      }
      if (trendRes.data.success) {
        setTrendData(trendRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleQuickAddWater = async (amount) => {
    try {
      const { data: res } = await api.post('/water', { amount });
      if (res.success) {
        toast.success(`Logged +${amount}ml Water`);
        // update local state
        setData((prev) => {
          const newTotal = prev.water.totalMl + amount;
          return {
            ...prev,
            water: {
              totalMl: newTotal,
              totalLitres: Math.round(newTotal / 100) / 10,
            },
          };
        });
      }
    } catch (err) {
      toast.error('Failed to log water');
    }
  };

  const handleLogWeight = async (e) => {
    e.preventDefault();
    if (!newWeight || parseFloat(newWeight) <= 0) {
      return toast.warning('Please enter a valid weight');
    }

    setLoggingWeight(true);
    try {
      const { data: res } = await api.post('/weight', { weight: parseFloat(newWeight) });
      if (res.success) {
        toast.success(`Weight logged: ${newWeight} kg`);
        setNewWeight('');
        setWeightModalOpen(false);
        fetchDashboard(); // Refetch to recalculate everything
      }
    } catch (err) {
      toast.error('Failed to log weight');
    } finally {
      setLoggingWeight(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Calculate percentages
  const proteinPercent = Math.round((data.nutrition.protein / data.targets.protein) * 100) || 0;
  const caloriesPercent = Math.round((data.nutrition.calories / data.targets.calories) * 100) || 0;
  const waterPercent = Math.round((data.water.totalMl / data.targets.water) * 100) || 0;

  // Chart configuration
  const chartLabels = trendData.map((d) => d.label);
  const chartProteinValues = trendData.map((d) => d.protein);

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Protein (g)',
        data: chartProteinValues,
        backgroundColor: '#00d4aa',
        borderColor: '#00d4aa',
        borderWidth: 0,
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
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
        grid: {
          display: false,
        },
        ticks: {
          color: '#666666',
          font: {
            family: 'Inter',
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#666666',
          font: {
            family: 'Inter',
          },
        },
      },
    },
  };

  return (
    <div>
      {/* Welcome header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Welcome, {user?.name || 'Athlete'}</h1>
          <p>Here is your daily fitness scoreboard.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={() => setWeightModalOpen(true)} size="sm">
            <Scale size={16} /> Log Weight
          </Button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 'var(--space-4)',
      }}>
        
        {/* Card 1: Protein Ring Target (Large Bento block, grid span 4) */}
        <Card style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--space-6)' }}>
          <div className="card-title text-label" style={{ marginBottom: 'var(--space-4)' }}>Protein Intake</div>
          <ProgressRing
            value={data.nutrition.protein}
            target={data.targets.protein}
            size={160}
            strokeWidth={12}
            color="var(--accent-cool)"
            label="of target"
            unit="g"
            fontSizeValue="var(--text-3xl)"
          />
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)' }}>
            <div>
              <div className="text-label text-tertiary">Logged</div>
              <div className="text-mono" style={{ fontWeight: 'var(--weight-semibold)' }}>{data.nutrition.protein}g</div>
            </div>
            <div style={{ borderRight: '1px solid var(--border-primary)' }} />
            <div>
              <div className="text-label text-tertiary">Target</div>
              <div className="text-mono" style={{ fontWeight: 'var(--weight-semibold)' }}>{data.targets.protein}g</div>
            </div>
          </div>
        </Card>

        {/* Card 2: Calorie Target Progress (grid span 4) */}
        <Card style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <div>
                <div className="card-title text-label">Calories</div>
                <div className="text-stat text-warm" style={{ marginTop: 'var(--space-1)' }}>
                  {data.nutrition.calories} <span style={{ fontSize: 'var(--text-sm)' }}>kcal</span>
                </div>
              </div>
              <div style={{ color: 'var(--accent-warm)', background: 'var(--accent-warm-bg)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                <Activity size={20} />
              </div>
            </div>
            
            <div style={{ margin: 'var(--space-4) 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                <span>Budget: {data.targets.calories} kcal</span>
                <span>{caloriesPercent}%</span>
              </div>
              <ProgressBar value={data.nutrition.calories} target={data.targets.calories} variant="warm" />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-primary)', textAlign: 'center', fontSize: 'var(--text-xs)' }}>
            <div>
              <div className="text-tertiary">Carbs</div>
              <div className="text-mono" style={{ color: 'var(--text-secondary)' }}>{data.nutrition.carbs}g</div>
            </div>
            <div>
              <div className="text-tertiary">Fat</div>
              <div className="text-mono" style={{ color: 'var(--text-secondary)' }}>{data.nutrition.fat}g</div>
            </div>
            <div>
              <div className="text-tertiary">Fibers</div>
              <div className="text-mono" style={{ color: 'var(--text-secondary)' }}>{data.nutrition.fiber || 0}g</div>
            </div>
          </div>
        </Card>

        {/* Card 3: Water Tracker (grid span 4) */}
        <Card style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
              <div>
                <div className="card-title text-label">Hydration</div>
                <div className="text-stat text-blue" style={{ marginTop: 'var(--space-1)' }}>
                  {data.water.totalLitres} <span style={{ fontSize: 'var(--text-sm)' }}>Liters</span>
                </div>
              </div>
              <div style={{ color: 'var(--accent-blue)', background: 'var(--accent-blue-bg)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                <Droplets size={20} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: 'var(--space-3) 0' }}>
              {/* Bottle Fill Animation Graphic */}
              <div style={{
                position: 'relative',
                width: '36px',
                height: '70px',
                border: '2px solid var(--border-primary)',
                borderRadius: '8px 8px 12px 12px',
                overflow: 'hidden',
                background: 'var(--bg-surface)'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: `${waterPercent}%`,
                  background: 'linear-gradient(to top, #1a82e2, #4dabf7)',
                  transition: 'height 0.4s ease'
                }} />
                {/* Neck */}
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '14px',
                  height: '6px',
                  border: '2px solid var(--border-primary)',
                  borderRadius: '2px',
                  background: 'var(--bg-surface)'
                }} />
              </div>
              <div>
                <div className="text-small text-secondary">Logged {data.water.totalMl}ml</div>
                <div className="text-small text-tertiary">Goal: {data.targets.water}ml</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={() => handleQuickAddWater(250)} style={{ flex: 1, padding: '8px 0' }}>+250ml</Button>
            <Button variant="secondary" size="sm" onClick={() => handleQuickAddWater(500)} style={{ flex: 1, padding: '8px 0' }}>+500ml</Button>
          </div>
        </Card>

        {/* Card 4: Streaks (grid span 4) */}
        <Card style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ color: 'var(--accent-warm)', background: 'var(--accent-warm-bg)', padding: '14px', borderRadius: 'var(--radius-full)', display: 'inline-flex' }}>
            <Flame size={32} />
          </div>
          <div>
            <div className="card-title text-label">Protein Streak</div>
            <div className="text-stat" style={{ margin: '2px 0' }}>
              {data.streaks.protein?.count || 0} <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>Days</span>
            </div>
            <div className="text-small text-secondary">
              Personal Best: {data.streaks.protein?.best || 0} days
            </div>
          </div>
        </Card>

        {/* Card 5: Weight Log Card (grid span 4) */}
        <Card style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ color: 'var(--accent-blue)', background: 'var(--accent-blue-bg)', padding: '14px', borderRadius: 'var(--radius-full)', display: 'inline-flex' }}>
            <Scale size={32} />
          </div>
          <div>
            <div className="card-title text-label">Latest Weight</div>
            <div className="text-stat" style={{ margin: '2px 0' }}>
              {data.weight ? `${data.weight.weight} kg` : '-- kg'}
            </div>
            <div className="text-small text-secondary">
              {data.weight ? `Logged on ${new Date(data.weight.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No weight logged yet'}
            </div>
          </div>
        </Card>

        {/* Card 6: Workouts (grid span 4) */}
        <Card style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ color: 'var(--accent-purple)', background: 'var(--accent-purple-bg)', padding: '14px', borderRadius: 'var(--radius-full)', display: 'inline-flex' }}>
            <Dumbbell size={32} />
          </div>
          <div>
            <div className="card-title text-label">Workouts Today</div>
            <div className="text-stat" style={{ margin: '2px 0' }}>
              {data.workouts.count} <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>logged</span>
            </div>
            <div className="text-small text-secondary">
              Volume: {data.workouts.totalVolume.toLocaleString()} kg
            </div>
          </div>
        </Card>

        {/* Card 7: Protein Trend Chart (grid span 8) */}
        <Card style={{ gridColumn: 'span 8', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div className="card-title text-label">Protein Trend (Last 7 Days)</div>
            <div className="text-small text-secondary">Aim to exceed the {data.targets.protein}g bar</div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </Card>

        {/* Card 8: Recent Food Log (grid span 4) */}
        <Card style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title text-label" style={{ marginBottom: 'var(--space-4)' }}>Recent Logs</div>
            
            {data.recentLogs.length === 0 ? (
              <div style={{ padding: 'var(--space-6) 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                No food logged today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {data.recentLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.food_name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{log.meal_type} • {log.quantity}x serving</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-cool)', fontWeight: 'var(--weight-semibold)' }}>+{log.protein}g</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{log.calories} cal</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button variant="ghost" className="w-full" size="sm" onClick={() => window.location.pathname = '/tracker'} style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
            Full Food Tracker <ChevronRight size={16} />
          </Button>
        </Card>

      </div>

      {/* Log Weight Modal */}
      <Modal
        isOpen={weightModalOpen}
        onClose={() => setWeightModalOpen(false)}
        title="Log Today's Weight"
      >
        <form onSubmit={handleLogWeight}>
          <Input
            label="Weight (kg)"
            type="number"
            step="0.1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="e.g. 72.5"
            required
            autoFocus
          />
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <Button variant="secondary" onClick={() => setWeightModalOpen(false)} disabled={loggingWeight}>Cancel</Button>
            <Button variant="accent" type="submit" loading={loggingWeight}>Log Weight</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
