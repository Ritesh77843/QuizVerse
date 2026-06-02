'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Shield, Key, Loader2, Save, Mail } from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.put<ApiResponse<any>>('/users/me', { displayName: name });
      return res.data.data;
    },
    onSuccess: () => {
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    updateProfileMutation.mutate(displayName);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">Account Settings</h1>
        <p className="text-zinc-400">Manage your profile, preferences, and security settings.</p>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-violet-600/10 text-violet-400 border border-violet-500/20 rounded-xl font-medium text-sm">
            <User className="w-4 h-4" /> Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl font-medium text-sm transition-colors">
            <Shield className="w-4 h-4" /> Security
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl font-medium text-sm transition-colors">
            <Key className="w-4 h-4" /> API Keys
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Profile Information</h2>
            
            <form onSubmit={handleSave} className="space-y-5 max-w-md">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-2">Email address cannot be changed currently.</p>
              </div>

              {success && <p className="text-emerald-400 text-sm font-medium">{success}</p>}
              {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

              <button
                type="submit"
                disabled={updateProfileMutation.isPending || !displayName.trim()}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2"
              >
                {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </form>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-2 text-red-400">Danger Zone</h2>
            <p className="text-zinc-400 text-sm mb-6">Permanently delete your account and all associated quizzes.</p>
            <button className="border border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold px-6 py-2.5 rounded-xl transition-all">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
