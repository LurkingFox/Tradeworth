import React, { useState } from 'react';
import { 
  CheckCircle, ChevronRight, ChevronLeft, User, Target, 
  DollarSign, TrendingUp, Shield, Clock, Award, Zap
} from 'lucide-react';

const ONBOARDING_STEPS = {
  WELCOME: 'welcome',
  PROFILE_SETUP: 'profile_setup',
  TRADING_GOALS: 'trading_goals',
  COMPLETE: 'complete'
};

export default function Onboarding({ session, supabase, onComplete }) {
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.WELCOME);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    full_name: session?.user?.user_metadata?.full_name || '',
    account_balance: '',
    trading_experience: 'beginner',
    risk_tolerance: '2.0',
    currency: 'USD'
  });
  const [tradingGoal, setTradingGoal] = useState({
    title: '',
    description: '',
    target_pnl: '',
    target_win_rate: '',
    target_date: '',
    priority: 'medium'
  });

  const stepProgress = {
    [ONBOARDING_STEPS.WELCOME]: 25,
    [ONBOARDING_STEPS.PROFILE_SETUP]: 50,
    [ONBOARDING_STEPS.TRADING_GOALS]: 75,
    [ONBOARDING_STEPS.COMPLETE]: 100
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          username: profile.username,
          full_name: profile.full_name,
          account_balance: parseFloat(profile.account_balance) || 0,
          trading_experience: profile.trading_experience,
          risk_tolerance: parseFloat(profile.risk_tolerance),
          currency: profile.currency
        });

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveTradingGoal = async () => {
    if (!tradingGoal.title.trim()) return true; // Skip if no goal set

    try {
      setLoading(true);
      
      const targetDate = tradingGoal.target_date || 
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default 90 days

      const { error } = await supabase
        .from('trading_goals')
        .insert({
          user_id: session.user.id,
          title: tradingGoal.title,
          description: tradingGoal.description,
          target_pnl: parseFloat(tradingGoal.target_pnl) || null,
          target_win_rate: parseFloat(tradingGoal.target_win_rate) || null,
          target_date: targetDate,
          priority: tradingGoal.priority,
          status: 'in-progress'
        });

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error saving trading goal:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.WELCOME:
        setCurrentStep(ONBOARDING_STEPS.PROFILE_SETUP);
        break;
      
      case ONBOARDING_STEPS.PROFILE_SETUP:
        if (profile.username.trim() && profile.full_name.trim()) {
          const success = await saveProfile();
          if (success) {
            setCurrentStep(ONBOARDING_STEPS.TRADING_GOALS);
          }
        }
        break;
      
      case ONBOARDING_STEPS.TRADING_GOALS:
        await saveTradingGoal();
        setCurrentStep(ONBOARDING_STEPS.COMPLETE);
        break;
      
      case ONBOARDING_STEPS.COMPLETE:
        onComplete();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.PROFILE_SETUP:
        setCurrentStep(ONBOARDING_STEPS.WELCOME);
        break;
      case ONBOARDING_STEPS.TRADING_GOALS:
        setCurrentStep(ONBOARDING_STEPS.PROFILE_SETUP);
        break;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.WELCOME:
        return true;
      case ONBOARDING_STEPS.PROFILE_SETUP:
        return profile.username.trim() && profile.full_name.trim();
      case ONBOARDING_STEPS.TRADING_GOALS:
        return true; // Goals are optional
      case ONBOARDING_STEPS.COMPLETE:
        return true;
      default:
        return false;
    }
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
        <TrendingUp className="h-10 w-10 text-white" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Welcome to Trading Journal Pro
        </h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Your complete trading management platform. Let's set up your account to get you started on your trading journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
          <Shield className="h-8 w-8 text-blue-600 mb-2" />
          <h3 className="font-semibold text-gray-800">Secure</h3>
          <p className="text-sm text-gray-600 text-center">Your data is protected with enterprise-grade security</p>
        </div>
        
        <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
          <Target className="h-8 w-8 text-green-600 mb-2" />
          <h3 className="font-semibold text-gray-800">Goal Tracking</h3>
          <p className="text-sm text-gray-600 text-center">Set and monitor your trading objectives</p>
        </div>
        
        <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
          <Award className="h-8 w-8 text-purple-600 mb-2" />
          <h3 className="font-semibold text-gray-800">Analytics</h3>
          <p className="text-sm text-gray-600 text-center">Advanced analytics to improve your trading</p>
        </div>
      </div>
    </div>
  );

  const renderProfileSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full p-4 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Set Up Your Profile</h2>
        <p className="text-gray-600">Tell us a bit about yourself to personalize your experience</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              value={profile.username}
              onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Choose a username"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starting Account Balance
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                value={profile.account_balance}
                onChange={(e) => setProfile(prev => ({ ...prev, account_balance: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10000.00"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={profile.currency}
              onChange={(e) => setProfile(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="CAD">CAD - Canadian Dollar</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trading Experience
            </label>
            <select
              value={profile.trading_experience}
              onChange={(e) => setProfile(prev => ({ ...prev, trading_experience: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="beginner">Beginner (0-1 years)</option>
              <option value="intermediate">Intermediate (1-3 years)</option>
              <option value="advanced">Advanced (3-5 years)</option>
              <option value="expert">Expert (5+ years)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Tolerance (% per trade)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={profile.risk_tolerance}
              onChange={(e) => setProfile(prev => ({ ...prev, risk_tolerance: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="2.0"
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 1-2% for beginners, 2-5% for experienced traders</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTradingGoalsStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Target className="w-16 h-16 bg-green-100 text-green-600 rounded-full p-4 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Set Your First Trading Goal</h2>
        <p className="text-gray-600">Define your objectives to stay focused and motivated (optional)</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Goal Title
          </label>
          <input
            type="text"
            value={tradingGoal.title}
            onChange={(e) => setTradingGoal(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Achieve consistent profitability"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={tradingGoal.description}
            onChange={(e) => setTradingGoal(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe what you want to achieve and how..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Profit
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                value={tradingGoal.target_pnl}
                onChange={(e) => setTradingGoal(prev => ({ ...prev, target_pnl: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1000"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Win Rate (%)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={tradingGoal.target_win_rate}
              onChange={(e) => setTradingGoal(prev => ({ ...prev, target_win_rate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="65"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Date
            </label>
            <input
              type="date"
              value={tradingGoal.target_date}
              onChange={(e) => setTradingGoal(prev => ({ ...prev, target_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={tradingGoal.priority}
            onChange={(e) => setTradingGoal(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-10 w-10 text-white" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Welcome to Your Trading Journey!
        </h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Your account is all set up. You're ready to start tracking your trades and achieving your goals.
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4">What you can do now:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="flex items-start space-x-3">
            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-800">Start Trading</h4>
              <p className="text-sm text-gray-600">Use the risk calculator and add your first trade</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Target className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-800">Track Goals</h4>
              <p className="text-sm text-gray-600">Monitor your progress and set new objectives</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-800">View Analytics</h4>
              <p className="text-sm text-gray-600">Analyze your performance with detailed reports</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-800">Market News</h4>
              <p className="text-sm text-gray-600">Stay updated with market events and news</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.WELCOME:
        return renderWelcomeStep();
      case ONBOARDING_STEPS.PROFILE_SETUP:
        return renderProfileSetupStep();
      case ONBOARDING_STEPS.TRADING_GOALS:
        return renderTradingGoalsStep();
      case ONBOARDING_STEPS.COMPLETE:
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  const getButtonText = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.WELCOME:
        return 'Get Started';
      case ONBOARDING_STEPS.PROFILE_SETUP:
        return 'Continue';
      case ONBOARDING_STEPS.TRADING_GOALS:
        return 'Finish Setup';
      case ONBOARDING_STEPS.COMPLETE:
        return 'Enter Trading Journal';
      default:
        return 'Next';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${stepProgress[currentStep]}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Account Setup</h1>
              <p className="text-sm text-gray-600">Step {Object.keys(ONBOARDING_STEPS).indexOf(currentStep.toUpperCase()) + 1} of {Object.keys(ONBOARDING_STEPS).length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome, {session?.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {renderCurrentStep()}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            {currentStep !== ONBOARDING_STEPS.WELCOME && currentStep !== ONBOARDING_STEPS.COMPLETE ? (
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              <span>{loading ? 'Processing...' : getButtonText()}</span>
              {!loading && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}