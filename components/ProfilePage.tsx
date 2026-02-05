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
  Trash2,
  AlertTriangle,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  created_at: string;
  dark_mode?: boolean;
};

type UserSubscription = {
  tier: string;
  status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_end: string | null;
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Message states
  const [successMessage, setSuccessMessage] = useState("");
  const [successHint, setSuccessHint] = useState(""); // Optional hint for success message
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");

  // Delete account modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReasons, setDeleteReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [deleting, setDeleting] = useState(false);

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
        profile?.display_name || profile?.full_name?.split(" ")[0] || "",
      );

      // Load subscription data
      const { data: subscriptionData } = await supabase
        .from("user_subscriptions")
        .select(
          "tier, status, stripe_subscription_id, stripe_customer_id, current_period_end",
        )
        .eq("user_id", user.id)
        .single();

      if (subscriptionData) {
        setSubscription(subscriptionData);
      }

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
    setSuccessHint("");

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: fullName,
          display_name: displayName,
        })
        .eq("id", user.id);

      if (error) throw error;

      setSuccessMessage(t("profile.successProfileUpdated"));
      setSuccessHint(""); // No hint for profile updates

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
        setSuccessHint("");
      }, 3000);

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
          : t("profile.errorUpdatingProfile"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReasonToggle = (reason: string) => {
    if (deleteReasons.includes(reason)) {
      setDeleteReasons(deleteReasons.filter((r) => r !== reason));
    } else {
      setDeleteReasons([...deleteReasons, reason]);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleting(true);
    setErrorMessage("");

    try {
      // Call API to delete account
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          reasons: deleteReasons,
          otherReason: deleteReasons.includes("other") ? otherReason : "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || t("profile.errorDeletingAccount"));
        setDeleting(false);
        return;
      }

      // Sign out user
      await supabase.auth.signOut();

      // Clear all local storage to ensure clean state
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Force a hard redirect to home page (this will refresh the app)
      window.location.href = "/";
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("profile.errorDeletingAccount"),
      );
      setDeleting(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelingSubscription(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      setSuccessMessage(t("profile.subscriptionCanceled"));
      setShowCancelModal(false);

      // Update local subscription state
      if (subscription) {
        setSubscription({ ...subscription, status: "canceled" });
      }

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("profile.errorCancelingSubscription"),
      );
    } finally {
      setCancelingSubscription(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    setSuccessHint("");
    setCurrentPasswordError("");

    // Validate passwords
    if (!currentPassword) {
      setCurrentPasswordError(t("profile.errorCurrentPassword"));
      setSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t("profile.errorPasswordMismatch"));
      setSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(t("profile.errorPasswordLength"));
      setSaving(false);
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage(t("profile.errorPasswordSame"));
      setSaving(false);
      return;
    }

    try {
      // Get current session for access token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setErrorMessage(t("profile.errorSessionExpired"));
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

      setSuccessMessage(t("profile.successPasswordChanged"));
      setSuccessHint(t("profile.successPasswordChangedHint")); // Only show hint for password changes
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
        setSuccessHint("");
      }, 5000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("profile.errorChangingPassword"),
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

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden py-8">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="mb-8 pt-14">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("profile.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t("profile.subtitle")}
          </p>
        </div>
        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 px-6 py-4 rounded-xl flex items-center space-x-3 shadow-lg shadow-green-500/20 animate-fade-in">
            <CheckCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-semibold">{successMessage}</p>
              {successHint && (
                <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">
                  {successHint}
                </p>
              )}
            </div>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 text-red-800 px-6 py-4 rounded-xl flex items-center space-x-3 shadow-lg shadow-red-500/20">
            <XCircle className="w-6 h-6 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* User Info Card */}
            <div className="bg-white dark:bg-slate-800/80  rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700 mb-6">
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
            <div
              className={`rounded-xl shadow-sm p-6 text-white ${
                subscription?.tier === "premium"
                  ? "bg-linear-to-br from-purple-600 to-pink-600"
                  : subscription?.tier === "basic"
                    ? "bg-linear-to-br from-blue-600 to-cyan-600"
                    : "bg-linear-to-br from-gray-600 to-gray-700"
              }`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <CreditCard className="w-6 h-6" />
                <h3 className="font-semibold text-lg">
                  {t("profile.yourPlan")}
                </h3>
              </div>
              <p className="text-xl font-bold mb-2">
                {subscription?.tier === "premium"
                  ? t("pricing.premium.name")
                  : subscription?.tier === "basic"
                    ? t("pricing.basic.name")
                    : t("pricing.free.name")}
              </p>
              {subscription?.status === "canceled" && (
                <p className="text-yellow-200 text-sm mb-2">
                  {t("profile.subscriptionCanceledInfo")}
                </p>
              )}
              {subscription?.current_period_end &&
                subscription?.tier !== "free" && (
                  <p className="text-blue-100 text-sm mb-4">
                    {subscription.status === "canceled"
                      ? t("profile.accessUntil")
                      : t("profile.renewsOn")}
                    :{" "}
                    {new Date(
                      subscription.current_period_end,
                    ).toLocaleDateString()}
                  </p>
                )}
              {subscription?.tier === "free" && (
                <p className="text-gray-200 text-sm mb-4">
                  {t("profile.unlimitedAccess")}
                </p>
              )}

              {subscription?.tier === "free" ? (
                <button
                  onClick={() => router.push("/pricing")}
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  {t("profile.upgradePlan")}
                </button>
              ) : subscription?.status !== "canceled" ? (
                <div className="space-y-2">
                  <button
                    onClick={() => router.push("/pricing")}
                    className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer"
                  >
                    {t("profile.changePlan")}
                  </button>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full bg-transparent border border-white/50 hover:bg-white/10 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer"
                  >
                    {t("profile.cancelSubscription")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push("/pricing")}
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  {t("profile.resubscribe")}
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t("profile.personalInfo")}
                </h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("profile.email")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/40 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("profile.emailCannotChange")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("profile.fullName")}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("profile.fullNamePlaceholder")}
                    className="w-full px-4 py-2 border text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/40 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("profile.displayName")}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t("profile.displayNamePlaceholder")}
                    className="w-full px-4 py-2 border text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/40 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("profile.displayNameHint")}
                  </p>
                </div>

                {/* Dark Mode Toggle */}
                <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t("profile.darkMode")}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("profile.darkModeHint")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleDarkMode();
                        setSuccessMessage(t("profile.successDarkModeChanged"));
                        setSuccessHint("");
                        // Auto-hide success message after 2 seconds
                        setTimeout(() => {
                          setSuccessMessage("");
                        }, 2000);
                      }}
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
                  {saving ? t("profile.saving") : t("profile.saveChanges")}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-6">
                <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t("profile.changePassword")}
                </h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("profile.currentPassword")}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setCurrentPasswordError(""); // Clear error on change
                    }}
                    placeholder={t("profile.currentPasswordPlaceholder")}
                    className={`w-full px-4 py-2 border text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      currentPasswordError
                        ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30"
                        : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/40"
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
                      {t("profile.currentPasswordHint")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("profile.newPassword")}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("profile.newPasswordPlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-slate-700/40 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("profile.confirmNewPassword")}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("profile.confirmNewPasswordPlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-slate-700/40 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  {saving
                    ? t("profile.changingPassword")
                    : t("profile.changePasswordButton")}
                </button>
              </form>
            </div>

            {/* Danger Zone - Delete Account */}
            <div className="bg-white dark:bg-red-900/10 rounded-xl shadow-sm p-6 border dark:border-red-900/50">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-red-300">
                  {t("profile.deleteAccount")}
                </h2>
              </div>
              <p className="text-sm text-gray-700 dark:text-red-300 mb-4">
                {t("profile.deleteAccountWarning")}
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-red-400/30 hover:shadow-red-400/40 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Trash2 className="w-5 h-5" />
                <span>{t("profile.deleteAccount")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cancel Subscription Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t("profile.cancelSubscriptionTitle")}
                </h3>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t("profile.cancelSubscriptionConfirm")}
              </p>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  {t("profile.cancelSubscriptionInfo")}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelingSubscription}
                  className="flex-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("profile.keepSubscription")}
                </button>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={cancelingSubscription}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelingSubscription
                    ? t("profile.canceling")
                    : t("profile.confirmCancel")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t("profile.deleteAccountTitle")}
                </h3>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t("profile.deleteAccountConfirm")}
              </p>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                  {t("profile.deleteAccountWarning")}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t("profile.deleteAccountReason")}
                </label>
                <div className="space-y-2">
                  {[
                    { id: "not-useful", label: t("profile.reasonNotUseful") },
                    {
                      id: "too-complicated",
                      label: t("profile.reasonTooComplicated"),
                    },
                    {
                      id: "found-alternative",
                      label: t("profile.reasonFoundAlternative"),
                    },
                    {
                      id: "privacy-concerns",
                      label: t("profile.reasonPrivacyConcerns"),
                    },
                    {
                      id: "too-expensive",
                      label: t("profile.reasonTooExpensive"),
                    },
                    { id: "other", label: t("profile.reasonOther") },
                  ].map((reason) => (
                    <label
                      key={reason.id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={deleteReasons.includes(reason.id)}
                        onChange={() => handleDeleteReasonToggle(reason.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {reason.label}
                      </span>
                    </label>
                  ))}
                </div>

                {deleteReasons.includes("other") && (
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder={t("profile.reasonOther")}
                    className="w-full mt-3 px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/40 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteReasons([]);
                    setOtherReason("");
                  }}
                  disabled={deleting}
                  className="flex-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("profile.cancelDelete")}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting
                    ? t("profile.deletingAccount")
                    : t("profile.confirmDelete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
