import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Camera, Save, Edit, Upload, X, Check, 
  DollarSign, Target, TrendingUp, Settings, Lock,
  Globe, Clock, Shield, Award, Mail
} from 'lucide-react';

const Profile = ({ supabase, user, trades = [], stats = {}, onProfileUpdate }) => {
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
    }
  }, [user]);

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
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;

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

  const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className={`p-3 bg-${color}-100 rounded-full mr-4`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2 inline" />
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-8">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Worth Score Display */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-lg">
              <Award className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{stats.worthScore || 0}</div>
              <div className="text-sm opacity-90">Worth Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={TrendingUp}
          label="Total Trades"
          value={profile.total_trades || 0}
          color="blue"
        />
        <StatCard
          icon={Target}
          label="Win Rate"
          value={profile.total_trades > 0 ? `${((profile.winning_trades / profile.total_trades) * 100).toFixed(1)}%` : '0%'}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          label="Total P&L"
          value={`$${(profile.total_pnl || 0).toLocaleString()}`}
          color={profile.total_pnl >= 0 ? "green" : "red"}
        />
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">${profile.account_balance?.toLocaleString() || '0'}</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Account Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          Account Actions
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;