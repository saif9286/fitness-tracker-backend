import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import ProgressRing from '../components/ui/ProgressRing';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../services/api';
import { Search, Plus, Trash2, Calendar, Edit2, ChevronDown, ChevronUp, AlertCircle, Apple } from 'lucide-react';

export default function FoodTracker() {
  const toast = useToast();
  
  // States
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({ protein: 0, calories: 0, carbs: 0, fat: 0, fiber: 0 });
  const [targets, setTargets] = useState({ protein: 150, calories: 2200 });
  const [groupedLogs, setGroupedLogs] = useState({ breakfast: [], lunch: [], dinner: [], snack: [] });
  const [loading, setLoading] = useState(true);

  // Search & Log states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef(null);

  // Log Modal
  const [selectedFood, setSelectedFood] = useState(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState('breakfast');
  const [logging, setLogging] = useState(false);

  // Custom Food Modal
  const [customFoodModalOpen, setCustomFoodModalOpen] = useState(false);
  const [cfName, setCfName] = useState('');
  const [cfProtein, setCfProtein] = useState('');
  const [cfCalories, setCfCalories] = useState('');
  const [cfCarbs, setCfCarbs] = useState('');
  const [cfFat, setCfFat] = useState('');
  const [cfFiber, setCfFiber] = useState('');
  const [cfServing, setCfServing] = useState('100g');
  const [cfDiet, setCfDiet] = useState('vegetarian');
  const [cfMeal, setCfMeal] = useState('any');
  const [creatingCustom, setCreatingCustom] = useState(false);

  // Edit Log Modal
  const [editLogItem, setEditLogItem] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editQuantity, setEditQuantity] = useState('1');
  const [editMealType, setEditMealType] = useState('breakfast');
  const [updating, setUpdating] = useState(false);

  // Collapsible sections
  const [collapsed, setCollapsed] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
    snack: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logRes, profileRes] = await Promise.all([
        api.get(`/food-logs?date=${date}`),
        api.get('/profile')
      ]);

      if (logRes.data.success) {
        setGroupedLogs(logRes.data.data.grouped);
      }
      
      if (profileRes.data.success) {
        setTargets({
          protein: profileRes.data.data.protein_goal || 150,
          calories: profileRes.data.data.calorie_goal || 2200
        });
      }

      // Fetch summary calculations
      const sumRes = await api.get(`/food-logs/summary?date=${date}`);
      if (sumRes.data.success) {
        setSummary(sumRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  // Click outside listener for search results dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const { data: res } = await api.get(`/foods/search?q=${searchQuery}`);
        if (res.success) {
          setSearchResults(res.data);
          setShowResults(true);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setQuantity('1');
    setMealType(food.meal_type === 'any' ? 'breakfast' : food.meal_type);
    setShowResults(false);
    setSearchQuery('');
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
        date: date,
      });

      if (res.success) {
        toast.success(`Logged ${selectedFood.food_name}`);
        setLogModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to log food item');
    } finally {
      setLogging(false);
    }
  };

  const handleCreateCustomFood = async (e) => {
    e.preventDefault();
    if (!cfName || !cfProtein || !cfCalories || !cfCarbs || !cfFat) {
      return toast.warning('Please fill in all core fields');
    }

    setCreatingCustom(true);
    try {
      const { data: foodRes } = await api.post('/foods', {
        food_name: cfName,
        protein: parseFloat(cfProtein),
        calories: parseFloat(cfCalories),
        carbs: parseFloat(cfCarbs),
        fat: parseFloat(cfFat),
        fiber: cfFiber ? parseFloat(cfFiber) : 0,
        diet_type: cfDiet,
        meal_type: cfMeal,
        serving: cfServing,
      });

      if (foodRes.success) {
        toast.success(`Created food: ${cfName}`);
        setCustomFoodModalOpen(false);
        // Clear custom fields
        setCfName('');
        setCfProtein('');
        setCfCalories('');
        setCfCarbs('');
        setCfFat('');
        setCfFiber('');
        // Open the logging dialog automatically for the newly created item!
        handleSelectFood(foodRes.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create food');
    } finally {
      setCreatingCustom(false);
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      const { data: res } = await api.delete(`/food-logs/${id}`);
      if (res.success) {
        toast.success('Food entry deleted');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delete food entry');
    }
  };

  const handleOpenEdit = (item) => {
    setEditLogItem(item);
    setEditQuantity(item.quantity.toString());
    setEditMealType(item.meal_type);
    setEditModalOpen(true);
  };

  const handleUpdateLog = async (e) => {
    e.preventDefault();
    if (!editQuantity || parseFloat(editQuantity) <= 0) {
      return toast.warning('Please enter a valid quantity');
    }

    setUpdating(true);
    try {
      const { data: res } = await api.put(`/food-logs/${editLogItem.id}`, {
        quantity: parseFloat(editQuantity),
        meal_type: editMealType,
      });

      if (res.success) {
        toast.success('Log entry updated');
        setEditModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update entry');
    } finally {
      setUpdating(false);
    }
  };

  const toggleCollapse = (section) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getMealTotal = (logs) => {
    return logs.reduce(
      (acc, l) => {
        acc.protein += l.food.protein * l.quantity;
        acc.calories += l.food.calories * l.quantity;
        return acc;
      },
      { protein: 0, calories: 0 }
    );
  };

  if (loading && !summary.protein) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Percentage calculations
  const proteinPercent = Math.round((summary.protein / targets.protein) * 100) || 0;
  const caloriePercent = Math.round((summary.calories / targets.calories) * 100) || 0;

  return (
    <div>
      {/* Upper header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1>Food Log & Nutrition</h1>
          <p>Track your daily protein intake and manage calories.</p>
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

      {/* Top Summary Widget Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {/* Protein Target */}
        <Card style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
          <ProgressRing
            value={summary.protein}
            target={targets.protein}
            size={100}
            strokeWidth={8}
            color="var(--accent-cool)"
            label=""
            unit="g"
            fontSizeValue="var(--text-xl)"
          />
          <div>
            <div className="text-label text-tertiary">Protein Target</div>
            <div className="text-stat" style={{ margin: '4px 0' }}>{Math.round(summary.protein)} / {targets.protein}g</div>
            <div className="text-small text-secondary">{proteinPercent}% complete</div>
          </div>
        </Card>

        {/* Calorie Target */}
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <div>
              <div className="text-label text-tertiary">Calories Budget</div>
              <div className="text-stat" style={{ marginTop: '2px' }}>{Math.round(summary.calories)} / {targets.calories} kcal</div>
            </div>
            <span className="text-mono text-small text-secondary">{caloriePercent}%</span>
          </div>
          <ProgressBar value={summary.calories} target={targets.calories} variant="warm" />
        </Card>

        {/* Macro splits */}
        <Card style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', textAlign: 'center', padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="text-tertiary text-label" style={{ fontSize: '10px' }}>Carbs</span>
            <span className="text-mono" style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>{Math.round(summary.carbs)}g</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--border-primary)', borderRight: '1px solid var(--border-primary)' }}>
            <span className="text-tertiary text-label" style={{ fontSize: '10px' }}>Fat</span>
            <span className="text-mono" style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>{Math.round(summary.fat)}g</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="text-tertiary text-label" style={{ fontSize: '10px' }}>Fiber</span>
            <span className="text-mono" style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>{Math.round(summary.fiber)}g</span>
          </div>
        </Card>
      </div>

      {/* Global Food Search Container */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-6)' }} ref={searchContainerRef}>
        <div className="search-btn-container" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '48px', height: '48px' }}
              placeholder="Search food database (e.g. eggs, chicken breast, paneer, oats...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
            />
          </div>
          <Button variant="secondary" onClick={() => setCustomFoodModalOpen(true)} style={{ height: '48px' }}>
            <Plus size={16} /> Create Custom
          </Button>
        </div>

        {/* Search Results Dropdown */}
        {showResults && (searchResults.length > 0 || searching) && (
          <div style={{
            position: 'absolute',
            top: '54px',
            left: 0,
            right: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            maxHeight: '300px',
            overflowY: 'auto',
            padding: 'var(--space-2) 0'
          }}>
            {searching ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4)' }}><Spinner size="sm" /></div>
            ) : (
              searchResults.map((food) => (
                <div
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                    borderBottom: '1px solid var(--border-light)'
                  }}
                  className="search-item-hover"
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}
                >
                  <div>
                    <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>{food.food_name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                      {food.serving} • {food.diet_type}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-mono text-accent" style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>+{food.protein}g protein</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{food.calories} cal</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Meal Sections (Breakfast, Lunch, Dinner, Snack) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {['breakfast', 'lunch', 'dinner', 'snack'].map((meal) => {
          const logs = groupedLogs[meal] || [];
          const totals = getMealTotal(logs);
          const isCollapsed = collapsed[meal];

          return (
            <Card key={meal} style={{ padding: '0', overflow: 'hidden' }}>
              {/* Section Header */}
              <div
                onClick={() => toggleCollapse(meal)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px',
                  background: 'var(--bg-surface)',
                  cursor: 'pointer',
                  borderBottom: isCollapsed ? 'none' : '1px solid var(--border-primary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isCollapsed ? <ChevronDown size={18} className="text-secondary" /> : <ChevronUp size={18} className="text-secondary" />}
                  <h3 className="text-h3" style={{ textTransform: 'capitalize', fontWeight: 'var(--weight-semibold)' }}>{meal}</h3>
                  <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                    {logs.length} items
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span className="text-mono" style={{ color: 'var(--accent-cool)', fontWeight: 'var(--weight-semibold)' }}>{Math.round(totals.protein)}g Protein</span>
                    <span style={{ margin: '0 8px', color: 'var(--text-tertiary)' }}>|</span>
                    <span className="text-mono" style={{ color: 'var(--text-secondary)' }}>{Math.round(totals.calories)} kcal</span>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              {!isCollapsed && (
                <div style={{ padding: '8px 24px 24px' }}>
                  {logs.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Apple size={24} style={{ opacity: 0.4 }} />
                      No items logged in this meal category.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 'var(--space-3)',
                            padding: '12px 0',
                            borderBottom: '1px solid var(--border-light)'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '160px' }}>
                            <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>{log.food.food_name}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                              Quantity: {log.quantity}x ({log.food.serving})
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexShrink: 0 }}>
                            <div style={{ textAlign: 'right' }}>
                              <div className="text-mono text-accent" style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>+{Math.round(log.food.protein * log.quantity)}g</div>
                              <div className="text-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{Math.round(log.food.calories * log.quantity)} kcal</div>
                            </div>
                            
                            {/* Action buttons (Edit & Delete) */}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => handleOpenEdit(log)}
                                className="btn btn-ghost btn-icon btn-sm"
                                style={{ width: '28px', height: '28px', color: 'var(--text-tertiary)' }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                className="btn btn-ghost btn-icon btn-sm"
                                style={{ width: '28px', height: '28px', color: 'var(--accent-red)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Log Food Modal */}
      <Modal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title={selectedFood ? `Log ${selectedFood.food_name}` : 'Log Food'}
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

      {/* Edit Log Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={editLogItem ? `Edit ${editLogItem.food.food_name}` : 'Edit Entry'}
      >
        {editLogItem && (
          <form onSubmit={handleUpdateLog}>
            <Input
              label="Quantity (Multiplier)"
              type="number"
              step="0.05"
              min="0.05"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              required
            />

            <div className="form-group">
              <label className="form-label">Meal Category</label>
              <select
                className="form-input"
                value={editMealType}
                onChange={(e) => setEditMealType(e.target.value)}
                style={{ appearance: 'none', background: 'var(--bg-surface) url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a0a0a0\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 16px center', backgroundSize: '16px' }}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snacks / Shakes</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
              <Button variant="secondary" onClick={() => setEditModalOpen(false)} disabled={updating}>Cancel</Button>
              <Button variant="accent" type="submit" loading={updating}>Update Entry</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Custom Food Modal */}
      <Modal
        isOpen={customFoodModalOpen}
        onClose={() => setCustomFoodModalOpen(false)}
        title="Create Custom Food Item"
      >
        <form onSubmit={handleCreateCustomFood} className="form-grid-two-columns" style={{ gap: 'var(--space-4)' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <Input
              label="Food Name"
              type="text"
              value={cfName}
              onChange={(e) => setCfName(e.target.value)}
              placeholder="e.g. My Vegan Protein Mix"
              required
            />
          </div>

          <Input
            label="Protein (g)"
            type="number"
            step="0.1"
            value={cfProtein}
            onChange={(e) => setCfProtein(e.target.value)}
            placeholder="e.g. 24"
            required
          />

          <Input
            label="Calories (kcal)"
            type="number"
            value={cfCalories}
            onChange={(e) => setCfCalories(e.target.value)}
            placeholder="e.g. 120"
            required
          />

          <Input
            label="Carbs (g)"
            type="number"
            step="0.1"
            value={cfCarbs}
            onChange={(e) => setCfCarbs(e.target.value)}
            placeholder="e.g. 3"
            required
          />

          <Input
            label="Fat (g)"
            type="number"
            step="0.1"
            value={cfFat}
            onChange={(e) => setCfFat(e.target.value)}
            placeholder="e.g. 1.5"
            required
          />

          <Input
            label="Fiber (g)"
            type="number"
            step="0.1"
            value={cfFiber}
            onChange={(e) => setCfFiber(e.target.value)}
            placeholder="e.g. 0"
          />

          <Input
            label="Serving Size (Text)"
            type="text"
            value={cfServing}
            onChange={(e) => setCfServing(e.target.value)}
            placeholder="e.g. 1 scoop (30g) or 100g"
            required
          />

          <div className="form-group">
            <label className="form-label">Diet Category</label>
            <select
              className="form-input"
              value={cfDiet}
              onChange={(e) => setCfDiet(e.target.value)}
              style={{ appearance: 'none', background: 'var(--bg-surface) url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a0a0a0\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 16px center', backgroundSize: '16px' }}
            >
              <option value="vegetarian">Vegetarian</option>
              <option value="non-vegetarian">Non-Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="eggetarian">Eggetarian</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Typical Meal</label>
            <select
              className="form-input"
              value={cfMeal}
              onChange={(e) => setCfMeal(e.target.value)}
              style={{ appearance: 'none', background: 'var(--bg-surface) url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a0a0a0\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 16px center', backgroundSize: '16px' }}
            >
              <option value="any">Anytime / Any Meal</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" onClick={() => setCustomFoodModalOpen(false)} disabled={creatingCustom}>Cancel</Button>
            <Button variant="primary" type="submit" loading={creatingCustom}>Create & Close</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
