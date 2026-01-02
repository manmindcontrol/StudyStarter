"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  User,
  Lock,
  Mail,
  CreditCard,
  CheckCircle,
  XCircle,
  Moon,
  Sun,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useTheme } from "@/contexts/ThemeContext";

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  created_at: string;
  dark_mode?: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Message states
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      const { user, profile } = await getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setProfile(profile);
      setFullName(profile?.full_name || "");
      setDisplayName(
        profile?.display_name || profile?.full_name?.split(" ")[0] || ""
      );
      setLoading(false);
    };

    loadUserData();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: fullName,
          display_name: displayName,
        })
        .eq("id", user.id);

      if (error) throw error;

      setSuccessMessage("Profile updated successfully!");

      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while updating profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCurrentPasswordError("");

    // Validate passwords
    if (!currentPassword) {
      setCurrentPasswordError("Please enter your current password");
      setSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match");
      setSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters");
      setSaving(false);
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage("New password must be different from current password");
      setSaving(false);
      return;
    }

    try {
      // Get current session for access token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setErrorMessage("Session expired. Please log in again.");
        setSaving(false);
        return;
      }

      // Call API endpoint to change password
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          accessToken: session.access_token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a wrong password error
        if (
          data.error?.includes("incorrect") ||
          data.error?.includes("password")
        ) {
          setCurrentPasswordError(data.error);
        } else {
          setErrorMessage(data.error || "Failed to change password");
        }
        setSaving(false);
        return;
      }

      setSuccessMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while changing password"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userPlan = "Free Plan"; // Placeholder - you can add payment plan logic later

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden py-8">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your personal information and settings
          </p>
        </div>
        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-2 border-green-300 text-green-800 px-6 py-4 rounded-xl flex items-center space-x-3 shadow-lg shadow-green-500/20 animate-fade-in">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">{successMessage}</p>
              <p className="text-sm text-green-700 mt-0.5">
                You can now use your new password to sign in.
              </p>
            </div>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 text-red-800 px-6 py-4 rounded-xl flex items-center space-x-3 shadow-lg shadow-red-500/20">
            <XCircle className="w-6 h-6 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* User Info Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700 mb-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-linear-to-br from-blue-500 to-cyan-500 w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                  {displayName || fullName || "User"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Plan Info Card */}
            <div className="bg-linear-to-br from-blue-600 to-cyan-600 rounded-xl shadow-sm p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <CreditCard className="w-6 h-6" />
                <h3 className="font-semibold text-lg">Your Plan</h3>
              </div>
              <p className="text-xl font-bold mb-2">{userPlan}</p>
              <p className="text-blue-100 text-sm mb-4">
                Unlimited access to basic features
              </p>
              <button className="w-full bg-white  text-blue-600  hover:bg-blue-50 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer">
                Upgrade Plan
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 border text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name (how you want to be addressed)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John, Sarah..."
                    className="w-full px-4 py-2 border text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This name will be used in the dashboard greetings
                  </p>
                </div>

                {/* Dark Mode Toggle */}
                <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dark Mode
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Switch between light and dark theme for the dashboard
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleDarkMode}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isDarkMode ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                          isDarkMode ? "translate-x-7" : "translate-x-1"
                        }`}
                      >
                        {isDarkMode ? (
                          <Moon className="w-4 h-4 text-blue-600 m-1" />
                        ) : (
                          <Sun className="w-4 h-4 text-gray-400 m-1" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-6">
                <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setCurrentPasswordError(""); // Clear error on change
                    }}
                    placeholder="Enter current password"
                    className={`w-full px-4 py-2 border text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      currentPasswordError
                        ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30"
                        : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    }`}
                    required
                  />
                  {currentPasswordError ? (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {currentPasswordError}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Required to verify your identity
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Enter new password again"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Changing password..." : "Change Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
