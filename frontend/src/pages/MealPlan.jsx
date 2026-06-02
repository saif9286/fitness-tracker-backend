import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../services/api';
import { CalendarDays, Sparkles, Plus, Check, RefreshCw, ListPlus } from 'lucide-react';

export default function MealPlan() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [grandTotal, setGrandTotal] = useState(null);
  const [targets, setTargets] = useState(null);

  // Tracks which meals have been successfully logged to food logs
  const [loggedMeals, setLoggedMeals] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
    snack: false,
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.post('/meal-plan/generate');
      if (res.success) {
        setMealPlan(res.data.mealPlan);
        setGrandTotal(res.data.grandTotal);
        setTargets(res.data.targets);
        setLoggedMeals({
          breakfast: false,
          lunch: false,
          dinner: false,
          snack: false,
        });
        toast.success('Generated balanced daily meal plan!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = async (mealType, foods) => {
    setLoading(true);
    try {
      // Send individual items sequentially
      for (const item of foods) {
        await api.post('/food-logs', {
          food_id: item.food.id,
          quantity: item.quantity,
          meal_type: mealType,
        });
      }
      setLoggedMeals((prev) => ({ ...prev, [mealType]: true }));
      toast.success(`Logged ${mealType} to today's food log`);
    } catch (err) {
      toast.error(`Failed to log ${mealType}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogAllMeals = async () => {
    setLoading(true);
    try {
      const mealsToLog = Object.keys(mealPlan).filter((type) => !loggedMeals[type]);
      
      for (const type of mealsToLog) {
        const foods = mealPlan[type].foods;
        for (const item of foods) {
          await api.post('/food-logs', {
            food_id: item.food.id,
            quantity: item.quantity,
            meal_type: type,
          });
        }
      }

      setLoggedMeals({
        breakfast: true,
        lunch: true,
        dinner: true,
        snack: true,
      });
      toast.success("Successfully logged all meal plan items to today's tracker!");
    } catch (err) {
      toast.error('Failed to log all meals');
    } finally {
      setLoading(false);
    }
  };

  const mealTimes = {
    breakfast: { time: '08:00 AM', label: 'Breakfast' },
    lunch: { time: '01:00 PM', label: 'Lunch' },
    snack: { time: '04:30 PM', label: 'Snack / Post-Workout' },
    dinner: { time: '08:00 PM', label: 'Dinner' },
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Daily Meal Plan</h1>
          <p>Generate optimized high-protein schedules to hit your fitness goals.</p>
        </div>
        {mealPlan && (
          <Button variant="secondary" onClick={handleGenerate} disabled={loading} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Regenerate Plan
          </Button>
        )}
      </div>

      {!mealPlan ? (
        <Card style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)', borderStyle: 'dashed' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--accent-primary-bg)', borderRadius: 'var(--radius-full)', color: 'var(--accent-primary)', marginBottom: 'var(--space-4)' }}>
            <CalendarDays size={48} />
          </div>
          <h2 className="text-h2" style={{ marginBottom: 'var(--space-2)' }}>No meal plan generated for today</h2>
          <p className="text-secondary" style={{ maxWidth: '480px', margin: '0 auto var(--space-6) auto' }}>
            Let our smart algorithms build a fully balanced, target-hitting daily menu tailored to your preferences, diet constraints, and macro goals.
          </p>
          <Button variant="accent" size="lg" onClick={handleGenerate} loading={loading} style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
            <Sparkles size={18} /> Build Today's Menu Plan
          </Button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '12fr 4fr', gap: 'var(--space-6)', alignItems: 'start' }}>
          {/* Timeline side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', position: 'relative' }}>
            {/* Timeline vertical bar */}
            <div style={{
              position: 'absolute',
              left: '32px',
              top: '20px',
              bottom: '20px',
              width: '2px',
              background: 'var(--border-primary)',
              zIndex: 0
            }} />

            {Object.entries(mealPlan).map(([mealType, mealData]) => {
              const timeInfo = mealTimes[mealType];
              const isLogged = loggedMeals[mealType];

              return (
                <div key={mealType} style={{ display: 'flex', gap: 'var(--space-6)', position: 'relative', zIndex: 1 }}>
                  {/* Timeline dot & time */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px', flexShrink: 0 }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isLogged ? 'var(--accent-cool)' : 'var(--bg-elevated)',
                      border: `4px solid ${isLogged ? 'var(--accent-cool-bg)' : 'var(--border-primary)'}`,
                      marginBottom: '8px',
                      boxShadow: 'var(--shadow-xs)'
                    }} />
                    <span className="text-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{timeInfo.time}</span>
                  </div>

                  {/* Meal details card */}
                  <Card style={{ flex: 1, padding: 'var(--space-5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h3 className="text-h3" style={{ fontWeight: 'var(--weight-semibold)' }}>{timeInfo.label}</h3>
                        <div style={{ display: 'flex', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          <span>Target Protein: {mealData.totals.protein}g</span>
                          <span>Target Calories: {mealData.totals.calories} kcal</span>
                        </div>
                      </div>
                      
                      {isLogged ? (
                        <div className="badge badge-cool" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <Check size={12} /> Logged
                        </div>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => handleLogMeal(mealType, mealData.foods)} disabled={loading}>
                          <Plus size={14} /> Log Meal
                        </Button>
                      )}
                    </div>

                    {/* Foods List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {mealData.foods.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                          <div>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{item.food.food_name}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                              Quantity: {item.quantity}x ({item.food.serving})
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="text-mono text-accent" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>+{Math.round(item.food.protein * item.quantity)}g</div>
                            <div className="text-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{Math.round(item.food.calories * item.quantity)} kcal</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Grand totals card */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', position: 'sticky', top: '100px' }}>
            <div>
              <h3 className="text-h3" style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Plan Summary</h3>
              
              {/* Protein target */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Protein: {grandTotal.protein}g / {targets.protein}g</span>
                  <span className="text-mono">{Math.round((grandTotal.protein / targets.protein) * 100)}%</span>
                </div>
                <ProgressBar value={grandTotal.protein} target={targets.protein} variant="cool" />
              </div>

              {/* Calorie target */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Calories: {grandTotal.calories} / {targets.calories} kcal</span>
                  <span className="text-mono">{Math.round((grandTotal.calories / targets.calories) * 100)}%</span>
                </div>
                <ProgressBar value={grandTotal.calories} target={targets.calories} variant="warm" />
              </div>
            </div>

            <Button variant="accent" className="w-full" onClick={handleLogAllMeals} disabled={loading || Object.values(loggedMeals).every(Boolean)} style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
              <ListPlus size={18} /> Log All Remaining Meals
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
