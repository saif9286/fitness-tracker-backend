import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import api from '../services/api';
import { Dumbbell, Plus, Trash2, Calendar, Award, Clock } from 'lucide-react';

const commonExercises = [
  'Bench Press (Barbell)',
  'Squat (Barbell)',
  'Deadlift (Barbell)',
  'Overhead Press (Barbell)',
  'Incline Dumbbell Press',
  'Lat Pulldown',
  'Barbell Row',
  'Bicep Curl (Dumbbell)',
  'Tricep Pushdown (Cable)',
  'Lateral Raise (Dumbbell)',
  'Leg Press',
  'Leg Curl (Seated)',
  'Plank',
  'Pull-ups',
  'Push-ups',
];

export default function WorkoutTracker() {
  const toast = useToast();
  
  // Date and Data states
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [workouts, setWorkouts] = useState([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form states
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [logging, setLogging] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get(`/workouts?date=${date}`);
      if (res.success) {
        setWorkouts(res.data.workouts);
        setTotalVolume(res.data.totalVolume);
      }
    } catch (err) {
      toast.error('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!exerciseName.trim() || !sets || !reps) {
      return toast.warning('Please enter exercise name, sets, and reps');
    }

    setLogging(true);
    try {
      const { data: res } = await api.post('/workouts', {
        exercise: exerciseName,
        sets: parseInt(sets),
        reps: parseInt(reps),
        weight: weight ? parseFloat(weight) : null,
        duration: duration ? parseInt(duration) : null,
        date: date,
      });

      if (res.success) {
        toast.success(`Logged ${exerciseName}`);
        setExerciseName('');
        setSets('3');
        setReps('10');
        setWeight('');
        setDuration('');
        setShowAutocomplete(false);
        fetchWorkouts();
      }
    } catch (err) {
      toast.error('Failed to log exercise');
    } finally {
      setLogging(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { data: res } = await api.delete(`/workouts/${id}`);
      if (res.success) {
        toast.success('Workout entry deleted');
        fetchWorkouts();
      }
    } catch (err) {
      toast.error('Failed to delete workout entry');
    }
  };

  const filteredExercises = commonExercises.filter((ex) =>
    ex.toLowerCase().includes(exerciseName.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1>Workout Logger</h1>
          <p>Record your strength and conditioning exercises.</p>
        </div>

        {/* Date picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
          <Calendar size={16} className="text-secondary" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ border: 'none', background: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <Card style={{ borderLeft: '4px solid var(--accent-purple)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-label text-tertiary">Exercises Logged</div>
            <div className="text-stat" style={{ marginTop: '4px' }}>
              {workouts.length}
            </div>
            <div className="text-small text-secondary">Today's exercises</div>
          </div>
          <div style={{ color: 'var(--accent-purple)', background: 'var(--accent-purple-bg)', padding: '10px', borderRadius: 'var(--radius-full)' }}>
            <Dumbbell size={24} />
          </div>
        </Card>

        <Card style={{ borderLeft: '4px solid var(--accent-cool)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-label text-tertiary">Lifting Volume</div>
            <div className="text-stat" style={{ marginTop: '4px' }}>
              {totalVolume.toLocaleString()} <span style={{ fontSize: 'var(--text-sm)' }}>kg</span>
            </div>
            <div className="text-small text-secondary">sets * reps * weight</div>
          </div>
          <div style={{ color: 'var(--accent-cool)', background: 'var(--accent-cool-bg)', padding: '10px', borderRadius: 'var(--radius-full)' }}>
            <Award size={24} />
          </div>
        </Card>

        <Card style={{ borderLeft: '4px solid var(--accent-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-label text-tertiary">Duration</div>
            <div className="text-stat" style={{ marginTop: '4px' }}>
              {workouts.reduce((sum, w) => sum + (w.duration || 0), 0)} <span style={{ fontSize: 'var(--text-sm)' }}>mins</span>
            </div>
            <div className="text-small text-secondary">Estimated active time</div>
          </div>
          <div style={{ color: 'var(--accent-blue)', background: 'var(--accent-blue-bg)', padding: '10px', borderRadius: 'var(--radius-full)' }}>
            <Clock size={24} />
          </div>
        </Card>
      </div>

      {/* Main split */}
      <div className="workout-split-grid">
        
        {/* Form Card */}
        <Card style={{ position: 'relative' }}>
          <h3 className="text-h3" style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Exercise
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Exercise Name</label>
              <input
                type="text"
                className="form-input"
                value={exerciseName}
                onChange={(e) => { setExerciseName(e.target.value); setShowAutocomplete(true); }}
                onFocus={() => setShowAutocomplete(true)}
                placeholder="e.g. Bench Press"
                required
              />
              
              {/* Autocomplete dropdown */}
              {showAutocomplete && exerciseName && filteredExercises.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '74px',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 20,
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  {filteredExercises.map((ex) => (
                    <div
                      key={ex}
                      onClick={() => { setExerciseName(ex); setShowAutocomplete(false); }}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = ''}
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-grid-two-columns">
              <Input
                label="Sets"
                type="number"
                min="1"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                required
              />
              <Input
                label="Reps"
                type="number"
                min="1"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                required
              />
            </div>

            <div className="form-grid-two-columns">
              <Input
                label="Weight (kg - optional)"
                type="number"
                step="0.5"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 60"
              />
              <Input
                label="Duration (mins - optional)"
                type="number"
                min="0"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" loading={logging} style={{ marginTop: 'var(--space-2)' }}>
              Log Exercise
            </Button>
          </form>
        </Card>

        {/* Exercises list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {loading && workouts.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
              <Spinner />
            </div>
          ) : workouts.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 'var(--space-10) var(--space-4)', borderStyle: 'dashed' }}>
              <Dumbbell size={36} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }} />
              <h4 style={{ fontWeight: 'var(--weight-semibold)', marginBottom: '4px' }}>No workouts recorded today</h4>
              <p className="text-secondary text-small">Use the form on the left to start tracking your strength reps.</p>
            </Card>
          ) : (
            workouts.map((w) => (
              <Card key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                <div>
                  <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{w.exercise}</h4>
                  <div style={{ display: 'flex', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <span className="text-mono" style={{ fontWeight: 'var(--weight-medium)', color: 'var(--accent-purple)' }}>
                      {w.sets} Sets × {w.reps} Reps
                    </span>
                    {w.weight !== null && (
                      <>
                        <span>•</span>
                        <span className="text-mono">@{w.weight} kg</span>
                      </>
                    )}
                    {w.duration !== null && (
                      <>
                        <span>•</span>
                        <span>{w.duration} mins duration</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  {w.weight !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <span className="text-label text-tertiary" style={{ fontSize: '10px' }}>Est. Volume</span>
                      <div className="text-mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                        {w.sets * w.reps * w.weight} kg
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{ color: 'var(--accent-red)', width: '32px', height: '32px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
