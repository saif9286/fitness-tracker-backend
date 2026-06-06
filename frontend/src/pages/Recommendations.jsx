import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import api from '../services/api';
import { Flame, Lightbulb, Plus, Sparkles, ChevronRight, Apple, Heart } from 'lucide-react';

export default function Recommendations() {
  const toast = useToast();
  const [dietFilter, setDietFilter] = useState('all');
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [topPicks, setTopPicks] = useState([]);
  const [breakfastPicks, setBreakfastPicks] = useState([]);
  const [lunchPicks, setLunchPicks] = useState([]);
  const [snackPicks, setSnackPicks] = useState([]);
  const [remaining, setRemaining] = useState({ protein: 150, calories: 2200 });
  const [userProfile, setUserProfile] = useState({ goal: '', diet_type: '', protein_goal: 150, calorie_goal: 2200 });

  // Log Modal States
  const [selectedFood, setSelectedFood] = useState(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState('breakfast');
  const [logging, setLogging] = useState(false);
  const [quickLoggingId, setQuickLoggingId] = useState(null);

  const fetchAllRecommendations = async () => {
    try {
      setLoading(true);
      const [topRes, breakfastRes, lunchRes, snackRes, profileRes] = await Promise.all([
        api.get('/recommendations'),
        api.get('/recommendations?meal_type=breakfast'),
        api.get('/recommendations?meal_type=lunch'),
        api.get('/recommendations?meal_type=snack'),
        api.get('/profile'),
      ]);

      let profileData = {};
      if (profileRes.data.success && profileRes.data.data) {
        profileData = profileRes.data.data;
      }

      if (topRes.data.success) {
        setTopPicks(topRes.data.data.recommendations);
        setRemaining(topRes.data.data.remaining);
        setUserProfile({
          ...topRes.data.data.profile,
          protein_goal: profileData.protein_goal || 150,
          calorie_goal: profileData.calorie_goal || 2200,
        });
      }
      if (breakfastRes.data.success) {
        setBreakfastPicks(breakfastRes.data.data.recommendations);
      }
      if (lunchRes.data.success) {
        setLunchPicks(lunchRes.data.data.recommendations);
      }
      if (snackRes.data.success) {
        setSnackPicks(snackRes.data.data.recommendations);
      }
    } catch (err) {
      toast.error('Failed to load recommendation plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRecommendations();
  }, []);

  const handleOpenLogModal = (food) => {
    setSelectedFood(food);
    setQuantity('1');
    setMealType(food.meal_type === 'any' ? 'breakfast' : food.meal_type);
    setLogModalOpen(true);
  };

  const handleLogFood = async (e) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) {
      return toast.warning('Please enter a valid quantity');
    }

    setLogging(true);
    try {
      const { data: res } = await api.post('/food-logs', {
        food_id: selectedFood.id,
        quantity: parseFloat(quantity),
        meal_type: mealType,
      });

      if (res.success) {
        toast.success(`Logged ${selectedFood.food_name}`);
        setLogModalOpen(false);
        // Refresh remaining values
        fetchAllRecommendations();
      }
    } catch (err) {
      toast.error('Failed to log food');
    } finally {
      setLogging(false);
    }
  };

  const handleQuickLog = async (food, defaultMealType) => {
    setQuickLoggingId(food.id);
    try {
      const { data: res } = await api.post('/food-logs', {
        food_id: food.id,
        quantity: 1,
        meal_type: defaultMealType,
      });

      if (res.success) {
        toast.success(`Logged 1 serving of ${food.food_name}!`);
        // Refresh remaining values
        await fetchAllRecommendations();
      }
    } catch (err) {
      toast.error('Failed to log food');
    } finally {
      setQuickLoggingId(null);
    }
  };

  const getMealTypeByTime = () => {
    const hr = new Date().getHours();
    if (hr < 11) return 'breakfast';
    if (hr < 16) return 'lunch';
    if (hr < 20) return 'dinner';
    return 'snack';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const renderRow = (title, subtitle, foods, defaultMealType) => {
    const filteredFoods = foods ? foods.filter((f) => dietFilter === 'all' || f.diet_type === dietFilter) : [];
    if (filteredFoods.length === 0) return null;

    return (
      <div className="recommendation-section" style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-4)' }}>
          <div>
            <h2 className="text-h2" style={{ fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={20} style={{ color: 'var(--accent-primary)' }} />
              {title}
            </h2>
            <p className="text-small text-secondary" style={{ marginTop: '2px' }}>{subtitle}</p>
          </div>
        </div>

        {/* Scrollable horizontal container wrapper */}
        <div className="recommendation-row-wrapper" style={{ position: 'relative' }}>
          <div className="recommendation-row">
            {filteredFoods.map((food) => {
              const isLoggingThis = quickLoggingId === food.id;
              
              return (
                <Card
                  key={food.id}
                  onClick={() => handleOpenLogModal(food)}
                  className="recommendation-card card-interactive"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                        <span className="diet-badge" data-diet={food.diet_type}>{food.diet_type}</span>
                        <span style={{ fontSize: '11px', color: 'var(--accent-cool)', fontWeight: 'var(--weight-medium)', background: 'var(--accent-cool-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                          P: {Math.round((food.protein / food.calories) * 100)}% cal
                        </span>
                      </div>
                      
                      <h4 className="recommendation-food-name">
                        {food.food_name}
                      </h4>
                      
                      <div className="text-mono protein-value">
                        {food.protein} <span className="protein-unit">g protein / {food.serving}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                        <span>Calories: {food.calories} kcal</span>
                        <span>Carbs: {food.carbs}g</span>
                      </div>
                      
                      <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); handleOpenLogModal(food); }} 
                          style={{ flex: 1, padding: '8px' }}
                          title="Customize and log"
                        >
                          Customize
                        </Button>
                        <Button 
                          variant="accent" 
                          size="sm" 
                          disabled={isLoggingThis || quickLoggingId !== null}
                          onClick={(e) => { e.stopPropagation(); handleQuickLog(food, defaultMealType); }} 
                          style={{ flex: 1, padding: '8px', display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {isLoggingThis ? (
                            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                          ) : (
                            <>Quick Log</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          {/* Scroll fade overlay cue */}
          <div className="scroll-fade-cue" />
        </div>
      </div>
    );
  };

  return (
    <div className="page-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1>Smart Recommendations</h1>
        <p>Intelligent protein recommendations based on your current metrics and goals.</p>
      </div>

      {/* Target Budgets Bar */}
      <div className="recommendations-bento-grid" style={{ marginBottom: 'var(--space-8)' }}>
        {/* Goal Mode Card */}
        <Card className="bento-card" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ color: 'var(--accent-primary)', background: 'var(--accent-primary-bg)', padding: '12px', borderRadius: 'var(--radius-xl)' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div className="text-label text-tertiary">Goal Mode</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', textTransform: 'capitalize' }}>
              {userProfile.goal ? userProfile.goal.replace('_', ' ') : 'athlete'}
            </div>
            <div className="text-small text-secondary">{userProfile.diet_type} Preference</div>
          </div>
        </Card>

        {/* Protein Budget Card */}
        <Card className="bento-card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
            <div>
              <div className="text-label text-tertiary">Protein Target</div>
              <div className="text-mono" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--accent-cool)' }}>
                {remaining.protein}g <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 'normal' }}>remaining</span>
              </div>
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Goal: {userProfile.protein_goal}g
            </div>
          </div>
          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: 'var(--border-primary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: '12px' }}>
            <div
              style={{
                width: `${Math.max(0, Math.min(100, ((userProfile.protein_goal - remaining.protein) / userProfile.protein_goal) * 100))}%`,
                height: '100%',
                background: 'var(--accent-cool)',
                boxShadow: '0 0 10px rgba(0, 212, 170, 0.4)',
                transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
            <span>Logged: {Math.max(0, userProfile.protein_goal - remaining.protein)}g</span>
            <span>{Math.round(Math.max(0, Math.min(100, ((userProfile.protein_goal - remaining.protein) / userProfile.protein_goal) * 100)))}%</span>
          </div>
        </Card>

        {/* Calories Budget Card */}
        <Card className="bento-card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
            <div>
              <div className="text-label text-tertiary">Calorie Budget</div>
              <div className="text-mono" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--accent-warm)' }}>
                {remaining.calories} kcal <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 'normal' }}>left</span>
              </div>
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Goal: {userProfile.calorie_goal} kcal
            </div>
          </div>
          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: 'var(--border-primary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: '12px' }}>
            <div
              style={{
                width: `${Math.max(0, Math.min(100, ((userProfile.calorie_goal - remaining.calories) / userProfile.calorie_goal) * 100))}%`,
                height: '100%',
                background: 'var(--accent-warm)',
                boxShadow: '0 0 10px rgba(255, 107, 53, 0.4)',
                transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
            <span>Logged: {Math.max(0, userProfile.calorie_goal - remaining.calories)} kcal</span>
            <span>{Math.round(Math.max(0, Math.min(100, ((userProfile.calorie_goal - remaining.calories) / userProfile.calorie_goal) * 100)))}%</span>
          </div>
        </Card>
      </div>

      {/* Diet Category Filter Chips */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'all', label: 'All Diets' },
          { id: 'vegetarian', label: 'Vegetarian Only' },
          { id: 'vegan', label: 'Vegan Only' },
          { id: 'non-vegetarian', label: 'Non-Vegetarian Only' },
          { id: 'eggetarian', label: 'Eggetarian Only' },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setDietFilter(chip.id)}
            className={`btn btn-sm ${dietFilter === chip.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', transition: 'all 0.2s' }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      {renderRow("Smart Protein Picks", "Handpicked high-protein choices matching your remaining macro targets and dietary preferences.", topPicks, getMealTypeByTime())}
      {renderRow("Breakfast Suggestions", "Morning options packed with clean protein to boost your daily stats early.", breakfastPicks, "breakfast")}
      {renderRow("Lunch & Dinner Fuels", "Complete meal selections rich in protein to form the core of your nutrition plan.", lunchPicks, getMealTypeByTime() === 'breakfast' || getMealTypeByTime() === 'snack' ? 'lunch' : getMealTypeByTime())}
      {renderRow("Smart Snacks & Shakes", "Quick protein boosters and snacks to help you meet targets between main meals.", snackPicks, "snack")}

      {/* Log Food Modal */}
      <Modal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title={selectedFood ? `Log Recommendation: ${selectedFood.food_name}` : 'Log Food'}
      >
        {selectedFood && (
          <form onSubmit={handleLogFood}>
            <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="text-secondary">Base Serving:</span>
                <span className="text-mono">{selectedFood.serving}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="text-secondary">Protein:</span>
                <span className="text-mono text-accent">{selectedFood.protein}g</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Calories:</span>
                <span className="text-mono text-warm">{selectedFood.calories} kcal</span>
              </div>
            </div>

            <Input
              label="Quantity (Multiplier)"
              type="number"
              step="0.05"
              min="0.05"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 1 or 1.5"
              required
              autoFocus
            />

            <div className="form-group">
              <label className="form-label">Meal Category</label>
              <select
                className="form-input"
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                style={{ appearance: 'none', background: 'var(--bg-surface) url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a0a0a0\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 16px center', backgroundSize: '16px' }}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snacks / Shakes</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
              <Button variant="secondary" onClick={() => setLogModalOpen(false)} disabled={logging}>Cancel</Button>
              <Button variant="accent" type="submit" loading={logging}>Log Food</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

