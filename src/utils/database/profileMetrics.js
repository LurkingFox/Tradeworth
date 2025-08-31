import { supabase } from '../../supabase';

// Fetch user profile metrics from database (single source of truth)
export const fetchProfileMetrics = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        worth_score,
        win_rate_score,
        timing_score,
        discipline_score,
        risk_management_score,
        consistency_score,
        total_trades,
        winning_trades,
        losing_trades,
        breakeven_trades,
        win_rate,
        total_pnl,
        avg_win,
        avg_loss,
        profit_factor,
        expectancy,
        kelly_criterion,
        avg_hold_time_hours,
        avg_rr,
        sharpe_ratio,
        max_drawdown,
        risk_score,
        discipline_score_behavioral,
        timing_score_behavioral,
        trend_following_score,
        counter_trend_score,
        last_metrics_update
      `)
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching profile metrics:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, metrics: data };
    
  } catch (error) {
    console.error('Failed to fetch profile metrics:', error);
    return { success: false, error: error.message };
  }
};

// Calculate enhanced worth score (worth_score * behavioral_factor)
export const calculateEnhancedWorthScore = (metrics) => {
  if (!metrics || metrics.worth_score === null || metrics.worth_score === undefined) {
    return 0;
  }
  
  // Calculate behavioral analysis average (0-100 scale)
  const behavioralScores = [
    metrics.risk_score || 0,
    metrics.discipline_score_behavioral || 0,
    metrics.timing_score_behavioral || 0,
    metrics.trend_following_score || 0,
    metrics.counter_trend_score || 0
  ];
  
  const behavioralAverage = behavioralScores.reduce((sum, score) => sum + score, 0) / behavioralScores.length;
  
  // Enhanced behavioral factor calculation (more sophisticated)
  // Base factor starts at 0.6 for safety, can go up to 1.3 for excellent behavior
  const baseFactor = 0.6;
  
  // Behavioral factor formula:
  // - Below 40: Penalty (0.6 - 0.3 = 0.3 minimum)
  // - 40-60: Neutral to slight bonus (0.6 - 0.9)
  // - 60-80: Good bonus (0.9 - 1.1)
  // - 80-100: Excellent bonus (1.1 - 1.3)
  let behavioralFactor;
  if (behavioralAverage < 40) {
    // Penalty for poor behavioral scores
    behavioralFactor = baseFactor - (40 - behavioralAverage) / 40 * 0.3;
  } else if (behavioralAverage < 60) {
    // Gradual improvement from neutral
    behavioralFactor = baseFactor + (behavioralAverage - 40) / 20 * 0.3;
  } else {
    // Strong bonus for good behavioral scores
    behavioralFactor = 0.9 + (behavioralAverage - 60) / 40 * 0.4;
  }
  
  // Additional worth score component bonus
  // Give extra weight to the worth score itself in the enhanced calculation
  const worthScoreBonus = metrics.worth_score > 70 ? 0.1 : 0;
  
  // Final enhanced score calculation
  const enhancedScore = (metrics.worth_score * behavioralFactor) + worthScoreBonus;
  
  // Cap at 100 to maintain 0-100 scale
  return Math.min(100, Math.max(0, Math.round(enhancedScore * 100) / 100));
};

// Manually trigger metrics refresh (useful after importing trades or bulk operations)
export const refreshUserMetrics = async (userId) => {
  try {
    const { data, error } = await supabase
      .rpc('refresh_user_metrics', { user_uuid: userId });
      
    if (error) {
      console.error('Error refreshing metrics:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
    
  } catch (error) {
    console.error('Failed to refresh metrics:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to format numbers for display
export const formatMetricValue = (value, type = 'number', decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  switch (type) {
    case 'percentage':
      return `${Number(value).toFixed(decimals)}%`;
    case 'currency':
      return `$${Number(value).toFixed(decimals)}`;
    case 'ratio':
      return `${Number(value).toFixed(decimals)}:1`;
    case 'factor':
      return Number(value).toFixed(decimals);
    default:
      return Number(value).toFixed(decimals);
  }
};

// Get trading performance grade based on worth score
export const getPerformanceGrade = (worthScore) => {
  if (worthScore >= 90) return { grade: 'A+', color: '#10B981', description: 'Elite Trader' };
  if (worthScore >= 80) return { grade: 'A', color: '#059669', description: 'Professional' };
  if (worthScore >= 70) return { grade: 'B+', color: '#0891B2', description: 'Advanced' };
  if (worthScore >= 60) return { grade: 'B', color: '#0284C7', description: 'Competent' };
  if (worthScore >= 50) return { grade: 'C+', color: '#EA580C', description: 'Developing' };
  if (worthScore >= 40) return { grade: 'C', color: '#DC2626', description: 'Needs Work' };
  return { grade: 'D', color: '#991B1B', description: 'Beginner' };
};

// Get enhanced performance grade (for enhanced worth score)
export const getEnhancedPerformanceGrade = (enhancedWorthScore, regularWorthScore) => {
  const grade = getPerformanceGrade(enhancedWorthScore);
  const improvement = enhancedWorthScore - regularWorthScore;
  
  return {
    ...grade,
    improvement: improvement,
    improvementText: improvement > 0 ? `+${improvement.toFixed(1)}` : `${improvement.toFixed(1)}`,
    isImprovement: improvement > 0,
    isPenalty: improvement < 0
  };
};