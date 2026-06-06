import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import api from '../services/api';
import { User, Activity, Target, Utensils, Award, Scale, HelpCircle, Download } from 'lucide-react';

export default function Profile() {
  const { refreshUser } = useAuth();
  const toast = useToast();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit states
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('maintenance');
  const [dietType, setDietType] = useState('vegetarian');
  const [activityLevel, setActivityLevel] = useState('moderate');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/profile');
      if (data.success && data.data) {
        const p = data.data;
        setProfile(p);
        setAge(p.age);
        setGender(p.gender);
        setHeight(p.height);
        setWeight(p.weight);
        setGoal(p.goal);
        setDietType(p.diet_type);
        setActivityLevel(p.activity_level);
      }
    } catch (err) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!age || !height || !weight) {
      return toast.warning('Please fill in age, height, and weight');
    }

    setSaving(true);
    try {
      const { data } = await api.put('/profile', {
        age: parseInt(age),
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        goal,
        diet_type: dietType,
        activity_level: activityLevel
      });

      toast.success('Profile updated successfully!');
      setProfile(data.data);
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (endpoint, filename) => {
    try {
      const response = await api.get(`/export/${endpoint}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${filename.split('-')[1]} logs exported successfully!`);
    } catch (err) {
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const goalLabels = {
    weight_loss: 'Weight Loss (Deficit)',
    maintenance: 'Maintenance (TDEE)',
    muscle_gain: 'Muscle Gain (Surplus)',
  };

  const dietLabels = {
    vegetarian: 'Vegetarian',
    'non-vegetarian': 'Non-Vegetarian',
    vegan: 'Vegan',
    eggetarian: 'Eggetarian',
  };

  const activityLabels = {
    sedentary: 'Sedentary',
    light: 'Lightly Active',
    moderate: 'Moderately Active',
    active: 'Highly Active',
    very_active: 'Extremely Active',
  };

  return (
    <div>
      <div className="page-header">
        <h1>Profile & Goals</h1>
        <p>Manage your physiological metrics and nutritional requirements.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Row 1: Target Stats Card */}
        {profile && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            <Card style={{ background: 'var(--bg-elevated)', borderLeft: '4px solid var(--accent-cool)' }}>
              <div className="card-title text-label">Protein Goal</div>
              <div className="text-stat-lg text-accent" style={{ margin: '8px 0' }}>
                {profile.protein_goal}<span style={{ fontSize: 'var(--text-sm)' }}>g</span>
              </div>
              <div className="text-small text-secondary">Recommended daily budget</div>
            </Card>

            <Card style={{ background: 'var(--bg-elevated)', borderLeft: '4px solid var(--accent-warm)' }}>
              <div className="card-title text-label">Calorie Goal</div>
              <div className="text-stat-lg text-warm" style={{ margin: '8px 0' }}>
                {profile.calorie_goal}<span style={{ fontSize: 'var(--text-sm)' }}>kcal</span>
              </div>
              <div className="text-small text-secondary">Estimated energy expenditure</div>
            </Card>

            <Card style={{ background: 'var(--bg-elevated)', borderLeft: '4px solid var(--accent-blue)' }}>
              <div className="card-title text-label">Calculated BMI</div>
              <div className="text-stat-lg text-blue" style={{ margin: '8px 0' }}>
                {profile.bmi}
              </div>
              <div className="text-small text-secondary">
                {profile.bmi < 18.5 ? 'Underweight' : profile.bmi < 25 ? 'Normal weight' : profile.bmi < 30 ? 'Overweight' : 'Obese'}
              </div>
            </Card>

            <Card style={{ background: 'var(--bg-elevated)', borderLeft: '4px solid var(--accent-purple)' }}>
              <div className="card-title text-label">Metabolism Stats</div>
              <div className="text-small text-secondary" style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>BMR:</span>
                  <span className="text-mono" style={{ color: 'var(--text-primary)' }}>{profile.bmr} kcal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>TDEE:</span>
                  <span className="text-mono" style={{ color: 'var(--text-primary)' }}>{profile.tdee} kcal</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Row 2: Profile Settings Form */}
        <Card style={{ padding: 'var(--space-6)' }}>
          <h2 className="text-h2" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <User size={20} /> Personal Parameters
          </h2>
          
          <form onSubmit={handleSave} className="form-grid-two-columns" style={{ gap: 'var(--space-6)' }}>
            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
              <Input
                label="Age (years)"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
              />
              <Input
                label="Height (cm)"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
              />
              <Input
                label="Weight (kg)"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-input"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{ appearance: 'none', background: 'var(--bg-surface) url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a0a0a0\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 16px center', backgroundSize: '16px' }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fitness Goal</label>
              <select
                className="form-input"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                style={{ appearance: 'none', background: 'var(--bg-surface) url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a0a0a0\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 16px center', backgroundSize: '16px' }}
              >
                <option value="weight_loss">Weight Loss</option>
                <option value="maintenance">Maintenance</option>
                <option value="muscle_gain">Muscle Gain</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Diet Preference</label>
              <select
                className="form-input"
                value={dietType}
                onChange={(e) => setDietType(e.target.value)}
                style={{ appearance: 'none', background: 'var(--bg-surface) url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a0a0a0\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 16px center', backgroundSize: '16px' }}
              >
                <option value="vegetarian">Vegetarian</option>
                <option value="non-vegetarian">Non-Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="eggetarian">Eggetarian</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Activity Level</label>
              <select
                className="form-input"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                style={{ appearance: 'none', background: 'var(--bg-surface) url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a0a0a0\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 16px center', backgroundSize: '16px' }}
              >
                <option value="sedentary">Sedentary (No workouts)</option>
                <option value="light">Lightly Active (Workouts 1-3d/wk)</option>
                <option value="moderate">Moderately Active (Workouts 3-5d/wk)</option>
                <option value="active">Active (Workouts 6-7d/wk)</option>
                <option value="very_active">Extremely Active (Athletic/Labor)</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <Button type="submit" variant="primary" loading={saving}>
                Save Profile Parameters
              </Button>
            </div>
          </form>
        </Card>

        {/* Row 3: Export Historical Data */}
        <Card style={{ padding: 'var(--space-6)' }}>
          <h2 className="text-h2" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Download size={20} /> Export Historical Data
          </h2>
          <p className="text-secondary text-small" style={{ marginBottom: 'var(--space-4)' }}>
            Download complete records of your logs in structured CSV spreadsheet formats for external analysis.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
            <Button variant="secondary" onClick={() => handleExport('food-logs', `fueltrack-food-logs-${new Date().toISOString().split('T')[0]}.csv`)}>
              Download Food Logs
            </Button>
            <Button variant="secondary" onClick={() => handleExport('weight', `fueltrack-weight-logs-${new Date().toISOString().split('T')[0]}.csv`)}>
              Download Weight Logs
            </Button>
            <Button variant="secondary" onClick={() => handleExport('workouts', `fueltrack-workouts-${new Date().toISOString().split('T')[0]}.csv`)}>
              Download Workouts
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
