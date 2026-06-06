import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../services/api';
import {
  User, Activity, Target, Utensils, Award, Info,
  Scale, Dumbbell, ShieldCheck, Heart, Sparkles
} from 'lucide-react';

export default function Onboarding() {
  const { user, refreshUser, setHasProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Form states
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('maintenance');
  const [dietType, setDietType] = useState('vegetarian');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [loading, setLoading] = useState(false);

  // Calculated summary (calculated when we reach step 7)
  const [summary, setSummary] = useState(null);

  const handleNext = async () => {
    if (step === 1 && !age) {
      return toast.warning('Please enter your age');
    }
    if (step === 2 && (!height || !weight)) {
      return toast.warning('Please enter both height and weight');
    }

    if (step === 6) {
      // Calculate summary preview before saving
      setLoading(true);
      try {
        // Send a temp calculation check or calculate on frontend
        // For simplicity and accuracy, let's do a preview calculation on the client or call a mock calculation route.
        // Actually, Mifflin-St Jeor formula:
        const weightKg = parseFloat(weight);
        const heightCm = parseFloat(height);
        const ageNum = parseInt(age);

        let bmr = 0;
        if (gender === 'male') {
          bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5;
        } else {
          bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum - 161;
        }

        const multipliers = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
          very_active: 1.9,
        };
        const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.2));

        const proteinGoal = Math.round(weightKg * (goal === 'muscle_gain' ? 2.0 : goal === 'weight_loss' ? 1.6 : 1.2));

        let calorieGoal = tdee;
        if (goal === 'muscle_gain') calorieGoal += 300;
        else if (goal === 'weight_loss') calorieGoal -= 400;

        const heightM = heightCm / 100;
        const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

        setSummary({ bmi, bmr, tdee, proteinGoal, calorieGoal });
        setStep(7);
      } catch (err) {
        toast.error('Error calculating targets');
      } finally {
        setLoading(false);
      }
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/profile', {
        age: parseInt(age),
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        goal,
        diet_type: dietType,
        activity_level: activityLevel
      });

      toast.success('Fitness Profile Created!');
      setHasProfile(true);
      await refreshUser();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (step / totalSteps) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'var(--space-8) var(--space-4)',
    }}>
      {/* Upper header */}
      <div style={{ width: '100%', maxWidth: '600px', marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)' }}>
          Fuel<span style={{ color: 'var(--accent-cool)' }}>Track</span>
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', justifyContent: 'center' }}>
          <div style={{ flex: 1, height: '4px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercentage}%`, height: '100%', background: 'var(--accent-cool)', transition: 'width 0.3s ease' }} />
          </div>
          <span className="text-mono text-small text-secondary">Step {step} of {totalSteps}</span>
        </div>
      </div>

      {/* Main wizard step content */}
      <div style={{
        width: '100%',
        maxWidth: '540px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative'
      }}>
        
        {step === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--accent-cool-bg)', borderRadius: 'var(--radius-full)', color: 'var(--accent-cool)', marginBottom: 'var(--space-4)' }}>
                <User size={36} />
              </div>
              <h1 className="text-h1" style={{ marginBottom: 'var(--space-2)' }}>Tell us about yourself</h1>
              <p className="text-secondary">We use your age and gender to estimate metabolism and baseline caloric needs.</p>
            </div>

            <Input
              label="Age (Years)"
              type="number"
              min="10"
              max="100"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 26"
            />

            <div className="form-group">
              <label className="form-label">Gender</label>
              <div className="form-grid-two-columns">
                <Card
                  interactive
                  onClick={() => setGender('male')}
                  style={{
                    borderColor: gender === 'male' ? 'var(--accent-cool)' : undefined,
                    background: gender === 'male' ? 'var(--accent-cool-bg)' : undefined,
                    padding: 'var(--space-4)',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Male</span>
                </Card>
                <Card
                  interactive
                  onClick={() => setGender('female')}
                  style={{
                    borderColor: gender === 'female' ? 'var(--accent-cool)' : undefined,
                    background: gender === 'female' ? 'var(--accent-cool-bg)' : undefined,
                    padding: 'var(--space-4)',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Female</span>
                </Card>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--accent-blue-bg)', borderRadius: 'var(--radius-full)', color: 'var(--accent-blue)', marginBottom: 'var(--space-4)' }}>
                <Scale size={36} />
              </div>
              <h1 className="text-h1" style={{ marginBottom: 'var(--space-2)' }}>Body Metrics</h1>
              <p className="text-secondary">Enter your current height and weight to calculate BMI and set precise macro budgets.</p>
            </div>

            <Input
              label="Height (cm)"
              type="number"
              min="100"
              max="250"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 175"
            />

            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 72.5"
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--accent-warm-bg)', borderRadius: 'var(--radius-full)', color: 'var(--accent-warm)', marginBottom: 'var(--space-4)' }}>
                <Target size={36} />
              </div>
              <h1 className="text-h1" style={{ marginBottom: 'var(--space-2)' }}>What is your primary goal?</h1>
              <p className="text-secondary">We will customize your daily target calorie and protein intakes accordingly.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {[
                { id: 'weight_loss', title: 'Weight Loss', desc: 'Maintain muscle mass while dropping body fat (Caloric deficit)', icon: Heart, color: 'var(--accent-warm)' },
                { id: 'maintenance', title: 'Maintenance', desc: 'Optimize body composition, health, and energy levels (Iso-caloric)', icon: Scale, color: 'var(--accent-blue)' },
                { id: 'muscle_gain', title: 'Muscle Gain', desc: 'Gain power, size, and strength with target protein (Caloric surplus)', icon: Dumbbell, color: 'var(--accent-cool)' },
              ].map((g) => (
                <Card
                  key={g.id}
                  interactive
                  onClick={() => setGoal(g.id)}
                  style={{
                    borderColor: goal === g.id ? 'var(--accent-cool)' : undefined,
                    background: goal === g.id ? 'var(--accent-cool-bg)' : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4)'
                  }}
                >
                  <div style={{ color: g.color }}><g.icon size={24} /></div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>{g.title}</div>
                    <div className="text-small text-secondary" style={{ marginTop: '2px' }}>{g.desc}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--accent-cool-bg)', borderRadius: 'var(--radius-full)', color: 'var(--accent-cool)', marginBottom: 'var(--space-4)' }}>
                <Utensils size={36} />
              </div>
              <h1 className="text-h1" style={{ marginBottom: 'var(--space-2)' }}>Dietary Preference</h1>
              <p className="text-secondary">This helps us curate custom high-protein meal recommendations for you.</p>
            </div>

            <div className="form-grid-two-columns">
              {[
                { id: 'vegetarian', label: 'Vegetarian', desc: 'No meat, includes dairy' },
                { id: 'non-vegetarian', label: 'Non-Vegetarian', desc: 'Chicken, fish, meat, eggs' },
                { id: 'vegan', label: 'Vegan', desc: 'Strictly plant-based' },
                { id: 'eggetarian', label: 'Eggetarian', desc: 'Vegetarian + Eggs' },
              ].map((d) => (
                <Card
                  key={d.id}
                  interactive
                  onClick={() => setDietType(d.id)}
                  style={{
                    borderColor: dietType === d.id ? 'var(--accent-cool)' : undefined,
                    background: dietType === d.id ? 'var(--accent-cool-bg)' : undefined,
                    padding: 'var(--space-4)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minHeight: '100px'
                  }}
                >
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>{d.label}</div>
                  <div className="text-small text-secondary" style={{ marginTop: '4px', fontSize: '11px' }}>{d.desc}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--accent-purple-bg)', borderRadius: 'var(--radius-full)', color: 'var(--accent-purple)', marginBottom: 'var(--space-4)' }}>
                <Activity size={36} />
              </div>
              <h1 className="text-h1" style={{ marginBottom: 'var(--space-2)' }}>Activity Level</h1>
              <p className="text-secondary">How active is your daily lifestyle? This influences your metabolic multiplier.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                { id: 'sedentary', title: 'Sedentary', desc: 'Desk job, minimal exercise/walking' },
                { id: 'light', title: 'Lightly Active', desc: 'Light exercise or active hobbies 1-3 days/week' },
                { id: 'moderate', title: 'Moderately Active', desc: 'Moderate workouts or running 3-5 days/week' },
                { id: 'active', title: 'Active', desc: 'Heavy sports or daily athletic training' },
                { id: 'very_active', title: 'Very Active', desc: 'Physical labor or double workout days' },
              ].map((a) => (
                <Card
                  key={a.id}
                  interactive
                  onClick={() => setActivityLevel(a.id)}
                  style={{
                    borderColor: activityLevel === a.id ? 'var(--accent-cool)' : undefined,
                    background: activityLevel === a.id ? 'var(--accent-cool-bg)' : undefined,
                    padding: 'var(--space-3)',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>{a.title}</div>
                  <div className="text-small text-secondary" style={{ marginTop: '2px', fontSize: '12px' }}>{a.desc}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--accent-primary-bg)', borderRadius: 'var(--radius-full)', color: 'var(--accent-primary)', marginBottom: 'var(--space-4)' }}>
              <Sparkles size={36} />
            </div>
            <h1 className="text-h1" style={{ marginBottom: 'var(--space-3)' }}>Ready to calculate?</h1>
            <p className="text-secondary" style={{ marginBottom: 'var(--space-6)' }}>
              We have all the details we need! Let's calculate your personalized macro quotas and setup your dashboard.
            </p>
            <Card style={{ padding: 'var(--space-4)', background: 'var(--bg-surface)', textAlign: 'left', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <ShieldCheck size={20} style={{ color: 'var(--accent-cool)' }} />
                <span className="text-small text-secondary">FuelTrack secure calculations</span>
              </div>
            </Card>
          </div>
        )}

        {step === 7 && summary && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--accent-cool-bg)', borderRadius: 'var(--radius-full)', color: 'var(--accent-cool)', marginBottom: 'var(--space-4)' }}>
                <Award size={36} />
              </div>
              <h1 className="text-h1" style={{ marginBottom: 'var(--space-2)' }}>Your Target Plan</h1>
              <p className="text-secondary">Here are the calculated nutrition guidelines optimized for your goal.</p>
            </div>

            <div className="form-grid-two-columns" style={{ marginBottom: 'var(--space-6)' }}>
              <Card style={{ textAlign: 'center', background: 'var(--bg-surface)' }}>
                <div className="text-label text-tertiary">Daily Protein</div>
                <div className="text-stat-lg text-accent" style={{ margin: 'var(--space-2) 0' }}>
                  {summary.proteinGoal}<span style={{ fontSize: 'var(--text-sm)' }}>g</span>
                </div>
                <div className="text-small text-secondary">High protein to support muscles</div>
              </Card>

              <Card style={{ textAlign: 'center', background: 'var(--bg-surface)' }}>
                <div className="text-label text-tertiary">Daily Calories</div>
                <div className="text-stat-lg text-warm" style={{ margin: 'var(--space-2) 0' }}>
                  {summary.calorieGoal}<span style={{ fontSize: 'var(--text-sm)' }}>kcal</span>
                </div>
                <div className="text-small text-secondary">Estimated energy budget</div>
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-light)' }}>
                <span className="text-secondary">Body Mass Index (BMI)</span>
                <span className="text-mono">{summary.bmi} ({summary.bmi < 18.5 ? 'Underweight' : summary.bmi < 25 ? 'Normal' : summary.bmi < 30 ? 'Overweight' : 'Obese'})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-light)' }}>
                <span className="text-secondary">Basal Metabolic Rate (BMR)</span>
                <span className="text-mono">{summary.bmr} kcal</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0' }}>
                <span className="text-secondary">Daily Energy (TDEE)</span>
                <span className="text-mono">{summary.tdee} kcal</span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 'var(--space-6)',
          gap: 'var(--space-4)'
        }}>
          {step > 1 && step < 7 && (
            <Button variant="secondary" onClick={handleBack} disabled={loading} style={{ flex: 1 }}>
              Back
            </Button>
          )}

          {step < 6 ? (
            <Button variant="primary" onClick={handleNext} disabled={loading} style={{ flex: step === 1 ? 2 : 1 }}>
              Continue
            </Button>
          ) : step === 6 ? (
            <Button variant="accent" onClick={handleNext} loading={loading} style={{ flex: 2 }}>
              Calculate My Targets
            </Button>
          ) : (
            <Button variant="accent" onClick={handleSubmit} loading={loading} style={{ flex: 1 }}>
              Go to Dashboard
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
