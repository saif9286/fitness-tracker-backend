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
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [topPicks, setTopPicks] = useState([]);
  const [breakfastPicks, setBreakfastPicks] = useState([]);
  const [lunchPicks, setLunchPicks] = useState([]);
  const [snackPicks, setSnackPicks] = useState([]);
  const [remaining, setRemaining] = useState({ protein: 150, calories: 2200 });
  const [userProfile, setUserProfile] = useState({ goal: '', diet_type: '' });

  // Log Modal States
  const [selectedFood, setSelectedFood] = useState(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState('breakfast');
  const [logging, setLogging] = useState(false);

  const fetchAllRecommendations = async () => {
    try {
      setLoading(true);
      const [topRes, breakfastRes, lunchRes, snackRes] = await Promise.all([
        api.get('/recommendations'),
        api.get('/recommendations?meal_type=breakfast'),
        api.get('/recommendations?meal_type=lunch'),
        api.get('/recommendations?meal_type=snack'),
      ]);

      if (topRes.data.success) {
        setTopPicks(topRes.data.data.recommendations);
        setRemaining(topRes.data.data.remaining);
        setUserProfile(topRes.data.data.profile);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const renderRow = (title, subtitle, foods) => {
    if (!foods || foods.length === 0) return null;

    return (
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-4)' }}>
          <div>
            <h2 className="text-h2" style={{ fontWeight: 'var(--weight-semibold)' }}>{title}</h2>
            <p className="text-small text-secondary" style={{ marginTop: '2px' }}>{subtitle}</p>
          </div>
        </div>

        {/* Scrollable horizontal container */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-4)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-2)',
          scrollbarWidth: 'thin',
          msOverflowStyle: 'none'
        }} className="recommendation-row">
          {foods.map((food) => (
            <Card
              key={food.id}
              style={{
                width: '260px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'var(--space-5)',
                background: 'var(--bg-elevated)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <span className="text-label text-tertiary" style={{ fontSize: '10px' }}>{food.diet_type}</span>
                  <span className="text-label text-tertiary" style={{ fontSize: '10px', color: 'var(--accent-cool)' }}>
                    P: {Math.round((food.protein / food.calories) * 100)}% cal
                  </span>
                </div>
                
                <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px', lineHeight: '20px' }}>
                  {food.food_name}
                </h4>
                
                <div className="text-mono" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--accent-cool)', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  {food.protein} <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>g protein / {food.serving}</span>
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                  <span>Calories: {food.calories} kcal</span>
                  <span>Carbs: {food.carbs}g</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => handleOpenLogModal(food)} style={{ width: '100%', display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={14} /> Add to Log
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1>Smart Recommendations</h1>
        <p>Intelligent protein recommendations based on your current metrics and goals.</p>
      </div>

      {/* Target Budgets Bar */}
      <Card style={{ display: 'flex', gap: 'var(--space-8)', padding: 'var(--space-5)', background: 'var(--bg-elevated)', marginBottom: 'var(--space-8)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ color: 'var(--accent-cool)', background: 'var(--accent-cool-bg)', padding: '10px', borderRadius: 'var(--radius-full)' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div className="text-label text-tertiary">Goal Mode</div>
            <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', textTransform: 'capitalize' }}>
              {userProfile.goal ? userProfile.goal.replace('_', ' ') : 'athlete'} • {userProfile.diet_type}
            </div>
          </div>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-primary)', display: 'block' }} />

        <div>
          <div className="text-label text-tertiary">Remaining Protein Target</div>
          <div className="text-mono" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--accent-cool)' }}>
            {remaining.protein}g <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 'normal' }}>needed today</span>
          </div>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-primary)', display: 'block' }} />

        <div>
          <div className="text-label text-tertiary">Remaining Calorie Budget</div>
          <div className="text-mono" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--accent-warm)' }}>
            {remaining.calories} kcal <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 'normal' }}>remaining</span>
          </div>
        </div>
      </Card>

      {/* Categories */}
      {renderRow("Smart Protein Picks", "Handpicked high-protein choices matching your remaining macro targets and dietary preferences.", topPicks)}
      {renderRow("Breakfast Suggestions", "Morning options packed with clean protein to boost your daily stats early.", breakfastPicks)}
      {renderRow("Lunch & Dinner Fuels", "Complete meal selections rich in protein to form the core of your nutrition plan.", lunchPicks)}
      {renderRow("Smart Snacks & Shakes", "Quick protein boosters and snacks to help you meet targets between main meals.", snackPicks)}

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
