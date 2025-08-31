import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Copy, ExternalLink, Database, Key, Code } from 'lucide-react';

export default function SupabaseSetup() {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const envExample = `# Supabase Configuration
REACT_APP_SUPABASE_URL=https://vpecfpwxdzmgpslpljes.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZWNmcHd4ZHptZ3BzbHBsamVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NjQyMjAsImV4cCI6MjA3MTU0MDIyMH0.jDJpUiAY8uwPgTF6znEL58NFVVKnVvjvGmAtuFd-txE`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Supabase Configuration Required</h1>
              <p className="text-blue-100">Set up your database connection to continue</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">Configuration Needed</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your app needs to be connected to a Supabase database. Follow the steps below to set up your connection.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Step 1: Create Supabase Project */}
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Create a Supabase Project</h3>
                <p className="text-gray-600 mb-4">
                  If you haven't already, create a new project in Supabase.
                </p>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Go to Supabase Dashboard</span>
                </a>
              </div>
            </div>

            {/* Step 2: Run SQL Schema */}
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Set Up Database Schema</h3>
                <p className="text-gray-600 mb-4">
                  Run the SQL schema file to create all necessary tables and security policies.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">SQL Schema File</span>
                    </div>
                    <span className="text-xs text-gray-500">DATABASE_SCHEMA.sql</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    1. Open Supabase Dashboard → SQL Editor<br />
                    2. Copy content from <code className="bg-gray-200 px-1 rounded">DATABASE_SCHEMA.sql</code><br />
                    3. Paste and run the SQL commands
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Get Project Credentials */}
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Get Project Credentials</h3>
                <p className="text-gray-600 mb-4">
                  From your Supabase project dashboard, go to Settings → API to find your credentials.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <ExternalLink className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-700">Project URL</span>
                    </div>
                    <code className="text-xs text-gray-600 break-all">
                      https://your-project-id.supabase.co
                    </code>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Key className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-700">Anon Key</span>
                    </div>
                    <code className="text-xs text-gray-600 break-all">
                      eyJhbGciOiJIUzI1NiIsInR5cCI6...
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Update .env File */}
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Update Environment Variables</h3>
                <p className="text-gray-600 mb-4">
                  Update your <code className="bg-gray-200 px-1 rounded">.env</code> file with your actual Supabase credentials.
                </p>
                
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Code className="h-4 w-4" />
                      <span className="text-sm font-medium">.env</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(envExample, 'env')}
                      className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="text-sm overflow-x-auto">
                    <code>{envExample}</code>
                  </pre>
                </div>
                
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Important:</strong> After updating the .env file, restart your development server for the changes to take effect.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5: Restart App */}
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Restart the Application</h3>
                <p className="text-gray-600 mb-4">
                  Stop the development server and start it again to load your new configuration.
                </p>
                
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Code className="h-4 w-4" />
                    <span className="text-sm font-medium">Terminal Commands</span>
                  </div>
                  <pre className="text-sm">
                    <code>{`# Stop the current server (Ctrl+C)
# Then restart with:
npm start`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Once configured correctly:</h4>
                <p className="text-sm text-green-700 mt-1">
                  You'll be able to sign up, log in, and your app will automatically create the necessary database tables and user profiles.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}