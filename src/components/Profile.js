import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Camera, Save, Edit, X,
  DollarSign, Target, TrendingUp, Settings, Lock,
  Globe, Clock, Shield, Award, Mail
} from 'lucide-react';
import { useDataManager, fetchProfileMetrics, formatMetricValue, calculateEnhancedWorthScore, getEnhancedPerformanceGrade } from '../utils';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label, Badge, Select } from './ui/components';

const Profile = ({ supabase, user, accountBalance, onProfileUpdate }) => {
  const dataManager = useDataManager();
  const statistics = dataManager.getStatistics();
  
  // Get dynamic account balance from centralized data manager
  const dynamicBalance = dataManager.getDynamicAccountBalance();
  const currentBalance = accountBalance || dynamicBalance;
  const portfolioMetrics = dataManager.getPortfolioMetrics(currentBalance);
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
    profile_picture_url: '',
    account_balance: 0,
    currency: 'USD',
    timezone: 'UTC',
    trading_experience: '',
    risk_tolerance: 2.00,
    worth_score: 0,
    total_trades: 0,
    winning_trades: 0,
    total_pnl: 0
  });
  
  const [profileMetrics, setProfileMetrics] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Asia/Hong_Kong', 'Asia/Singapore', 'Australia/Sydney'
  ];
  const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

  useEffect(() => {
    if (user) {
      loadProfile();
      loadProfileMetrics();
    }
  }, [user]);

  // Subscribe to dataManager changes for reactive updates
  useEffect(() => {
    const unsubscribe = dataManager.subscribe(() => {
      // Update profile metrics when trades change
      loadProfileMetrics();
    });
    
    return unsubscribe;
  }, [dataManager]);

  const loadProfileMetrics = async () => {
    try {
      const result = await fetchProfileMetrics(user.id);
      
      if (result.success) {
        setProfileMetrics(result.metrics);
      } else {
        console.error('Failed to load profile metrics:', result.error);
      }
    } catch (error) {
      console.error('Error loading profile metrics:', error);
    }
  };

  const loadProfile = async () => {
    try {
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError);
        return;
      }

      if (existingProfile) {
        setProfile(existingProfile);
      } else {
        // Create new profile if it doesn't exist
        const newProfile = {
          id: user.id,
          username: user.email?.split('@')[0] || '',
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          profile_picture_url: '', // Custom uploaded image (starts empty)
          account_balance: 0,
          currency: 'USD',
          timezone: 'UTC',
          trading_experience: 'Beginner',
          risk_tolerance: 2.00
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          setProfile(createdProfile);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          full_name: profile.full_name,
          account_balance: parseFloat(profile.account_balance) || 0,
          currency: profile.currency,
          timezone: profile.timezone,
          trading_experience: profile.trading_experience,
          risk_tolerance: parseFloat(profile.risk_tolerance) || 2.00,
          profile_picture_url: profile.profile_picture_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Notify parent component to update header avatar
      if (onProfileUpdate) {
        onProfileUpdate(profile);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile-${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}.${fileExt}`;

      // Check if bucket exists first
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'profile-pictures');
      
      if (!bucketExists) {
        // Try to create the bucket
        try {
          const { data: newBucket, error: createBucketError } = await supabase.storage
            .createBucket('profile-pictures', {
              public: true,
              allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
              fileSizeLimit: 5242880 // 5MB
            });
          
          if (createBucketError) throw createBucketError;
          console.log('Created profile-pictures bucket:', newBucket);
        } catch (createError) {
          throw new Error(`Storage bucket not available. Please ensure you have proper permissions or contact support. Error: ${createError.message}`);
        }
      }

      // Delete old profile picture if exists
      if (profile.profile_picture_url) {
        try {
          const oldFileName = profile.profile_picture_url.split('/').pop();
          if (oldFileName && oldFileName.includes('profile-')) {
            await supabase.storage
              .from('profile-pictures')
              .remove([`${user.id}/${oldFileName}`]);
          }
        } catch (deleteError) {
          console.warn('Could not delete old profile picture:', deleteError);
        }
      }

      // Upload image to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update profile with new image URL
      const updatedProfile = { ...profile, profile_picture_url: publicUrl };
      setProfile(updatedProfile);
      
      // If we're not in editing mode, save immediately
      if (!isEditing) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ profile_picture_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', user.id);
          
        if (updateError) throw updateError;
      }

      // Notify parent component to update header avatar
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      setPreviewImage(null);
      console.log('Profile image uploaded successfully:', publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Error uploading image: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImagePreview = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const ProfileImage = () => {
    // Priority: preview (during upload) > custom uploaded image > Google avatar > default
    const imageUrl = previewImage || profile.profile_picture_url || user?.user_metadata?.avatar_url || profile.avatar_url;
    
    return (
      <div className="relative inline-block">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide broken image and show default icon
                e.target.style.display = 'none';
                const parent = e.target.parentElement;
                const fallback = parent.querySelector('.fallback-icon');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center bg-blue-100 fallback-icon" 
            style={{ display: imageUrl ? 'none' : 'flex' }}
          >
            <User className="w-16 h-16 text-blue-600" />
          </div>
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {uploadingImage ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            handleImagePreview(e);
            handleImageUpload(e);
          }}
          className="hidden"
        />
      </div>
    );
  };

  // Unified glassmorphic design system
  const GlassCard = ({ children, className = "", hover = true }) => (
    <div className={`relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden ${hover ? 'group hover:scale-[1.02] transition-all duration-300' : ''} ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-cyan-500/5"></div>
      <div className="relative">{children}</div>
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => (
    <GlassCard className="p-6">
      <div className="flex items-center">
        <div className={`p-3 bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 backdrop-blur-sm rounded-xl mr-4`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
        </div>
      </div>
    </GlassCard>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="default"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  variant="default"
                  size="default"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
            <Button
              onClick={() => setIsEditing(true)}
              variant="default"
              size="default"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <GlassCard>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10"></div>
        <div className="relative p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <ProfileImage />
          
          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                    placeholder="Enter a username"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile.full_name || 'Anonymous Trader'}</h2>
                <p className="text-gray-600 mt-1">@{profile.username || 'username'}</p>
                <p className="text-sm text-gray-500 mt-2 flex items-center justify-center md:justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  {user.email}
                </p>
              </div>
            )}
          </div>

          {/* Enhanced Worth Score Display */}
          <div className="text-center">
            {(() => {
              // Use profileMetrics if available, otherwise calculate from current data
              const baseScore = profileMetrics?.worth_score || statistics.worthScore || 0;
              
              return (
                <div className="bg-gradient-to-r from-purple-500/90 to-indigo-600/90 backdrop-blur-sm border border-purple-300/50 text-white p-6 rounded-xl shadow-xl">
                  <Award className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-3xl font-bold">{baseScore.toFixed(1)}</div>
                  <div className="text-sm opacity-90">Worth Score</div>
                <div className="text-xs opacity-75 mt-1">
                  {(() => {
                    const grade = baseScore >= 80 ? { grade: 'A+', description: 'Excellent' } :
                                     baseScore >= 70 ? { grade: 'A', description: 'Very Good' } :
                                     baseScore >= 60 ? { grade: 'B', description: 'Good' } :
                                     baseScore >= 50 ? { grade: 'C', description: 'Average' } :
                                   { grade: 'D', description: 'Needs Improvement' };
                    return `${grade.grade} • ${grade.description}`;
                  })()}
                  </div>
                  <div className="text-xs opacity-60 mt-2">
                    Based on {statistics.totalTrades || 0} trades
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        </div>
      </GlassCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={TrendingUp}
          label="Total Trades"
          value={profileMetrics?.total_trades || statistics.totalTrades || 0}
          color="blue"
        />
        <StatCard
          icon={Target}
          label="Win Rate"
          value={`${(profileMetrics?.win_rate || statistics.winRate || 0).toFixed(1)}%`}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          label="Total P&L"
          value={formatMetricValue(profileMetrics?.total_pnl || statistics.totalPnL || 0, 'currency')}
          color={(profileMetrics?.total_pnl || statistics.totalPnL || 0) >= 0 ? "green" : "red"}
        />
      </div>

      {/* Settings */}
      <GlassCard>
        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
        <div className="relative p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Trading Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Account Balance
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                value={profile.account_balance}
                onChange={(e) => setProfile(prev => ({ ...prev, account_balance: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                placeholder="0.00"
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">${currentBalance?.toLocaleString() || '0'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Currency
            </label>
            {isEditing ? (
              <select
                value={profile.currency}
                onChange={(e) => setProfile(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            ) : (
              <p className="text-lg font-semibold text-gray-900">{profile.currency}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Timezone
            </label>
            {isEditing ? (
              <select
                value={profile.timezone}
                onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
              >
                {timezones.map(timezone => (
                  <option key={timezone} value={timezone}>{timezone}</option>
                ))}
              </select>
            ) : (
              <p className="text-lg font-semibold text-gray-900">{profile.timezone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Award className="w-4 h-4 inline mr-1" />
              Trading Experience
            </label>
            {isEditing ? (
              <select
                value={profile.trading_experience}
                onChange={(e) => setProfile(prev => ({ ...prev, trading_experience: e.target.value }))}
                className="w-full px-3 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
              >
                {experienceLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            ) : (
              <p className="text-lg font-semibold text-gray-900">{profile.trading_experience || 'Not set'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-1" />
              Risk Tolerance (% per trade)
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={profile.risk_tolerance}
                onChange={(e) => setProfile(prev => ({ ...prev, risk_tolerance: parseFloat(e.target.value) || 2.0 }))}
                className="w-full px-3 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                placeholder="2.0"
              />
            ) : (
              <div className="flex items-center">
                <p className="text-lg font-semibold text-gray-900 mr-4">{profile.risk_tolerance}%</p>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((profile.risk_tolerance / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
            {isEditing && (
              <p className="text-sm text-gray-500 mt-1">
                Recommended: 1-3% for conservative, 3-5% for moderate, 5-10% for aggressive
              </p>
            )}
          </div>
          </div>
        </div>
      </GlassCard>

      {/* Application Settings */}
      <GlassCard>
        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
        <div className="relative p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Application Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/30">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Enable Animations</label>
                <p className="text-xs text-gray-600 dark:text-gray-400">Toggle glassmorphic animations throughout the app</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value=""
                  className="sr-only peer"
                  defaultChecked={true}
                  onChange={(e) => {
                    // Store animation preference in localStorage
                    localStorage.setItem('animationsEnabled', e.target.checked);
                    // You can also dispatch this to a global state if needed
                    window.dispatchEvent(new CustomEvent('animationToggle', { detail: e.target.checked }));
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Account Actions */}
      <GlassCard>
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
        <div className="relative p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Account Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-gradient-to-r from-slate-500/80 to-slate-600/80 backdrop-blur-sm border border-slate-300/30 text-white rounded-xl hover:from-slate-600/90 hover:to-slate-700/90 transition-all duration-300 shadow-lg shadow-slate-500/25"
            >
              Sign Out
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Profile;