"use client";

import React, { useState, useEffect } from "react";
import { User, ShieldAlert, Key, UserX, Loader2, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onSignOut: () => void;
}

export function UserSettingsModal({
  isOpen,
  onClose,
  session,
  onSignOut,
}: UserSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "danger">("profile");
  const supabase = createClient();

  // Profile Form States
  const [name, setName] = useState(
    session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || ""
  );
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password Form States
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Account Deletion States
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Sync state with props and reset forms on open
  useEffect(() => {
    if (isOpen) {
      setName(session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || "");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setProfileSuccess("");
      setProfileError("");
      setPasswordSuccess("");
      setPasswordError("");
      setDeleteConfirmation("");
      setDeleteError("");
    }
  }, [isOpen, session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");
    setIsUpdatingProfile(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: name,
          full_name: name,
        },
      });

      if (error) throw error;
      setProfileSuccess("Profile updated successfully!");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      setPasswordSuccess("Password updated successfully!");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      setDeleteError("Please type DELETE to confirm");
      return;
    }

    setDeleteError("");
    setIsDeletingAccount(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = session?.access_token;

      if (!token) {
        throw new Error("No active session found");
      }

      const res = await fetch(`${API_BASE}/api/users/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to delete account");
      }

      // Account deleted successfully on backend, now sign out locally
      onSignOut();
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden rounded-xl shadow-2xl flex flex-col md:flex-row h-[420px]">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-48 bg-zinc-50 dark:bg-zinc-900/50 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 p-4 flex md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-x-visible">
          <div className="hidden md:block mb-4">
            <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Settings
            </h3>
          </div>
          
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full ${
              activeTab === "profile"
                ? "bg-zinc-200/60 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            Profile Info
          </button>

          <button
            onClick={() => setActiveTab("password")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full ${
              activeTab === "password"
                ? "bg-zinc-200/60 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
            }`}
          >
            <Key className="w-4 h-4 shrink-0" />
            Password
          </button>

          <button
            onClick={() => setActiveTab("danger")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full ${
              activeTab === "danger"
                ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
            }`}
          >
            <UserX className="w-4 h-4 shrink-0" />
            Delete Account
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            {activeTab === "profile" && (
              <div className="space-y-4">
                <div>
                  <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                    Profile Information
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Update your account details and display name.
                  </DialogDescription>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Email Address</label>
                    <Input
                      type="email"
                      value={session?.user?.email || ""}
                      disabled
                      className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Display Name</label>
                    <Input
                      type="text"
                      placeholder="Enter display name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white bg-white dark:bg-zinc-950"
                    />
                  </div>

                  {profileSuccess && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg">
                      {profileSuccess}
                    </p>
                  )}

                  {profileError && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/20 p-2 rounded-lg">
                      {profileError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full bg-zinc-900 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </div>
            )}

            {activeTab === "password" && (
              <div className="space-y-4">
                <div>
                  <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                    Change Password
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Update your password to keep your account secure.
                  </DialogDescription>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
                   <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">New Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white bg-white dark:bg-zinc-950 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Confirm New Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white bg-white dark:bg-zinc-950 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {passwordSuccess && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg">
                      {passwordSuccess}
                    </p>
                  )}

                  {passwordError && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/20 p-2 rounded-lg">
                      {passwordError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full bg-zinc-900 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </div>
            )}

            {activeTab === "danger" && (
              <div className="space-y-4">
                <div>
                  <DialogTitle className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    Danger Zone
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Once you delete your account, there is no going back. All your chat history and sessions will be deleted permanently.
                  </DialogDescription>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                      To confirm, type <span className="font-bold text-red-600 dark:text-red-400">DELETE</span> below:
                    </p>
                    <Input
                      type="text"
                      placeholder="Type DELETE"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="border-red-200 dark:border-red-950 text-zinc-900 dark:text-white bg-white dark:bg-zinc-950"
                    />
                  </div>

                  {deleteError && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/20 p-2 rounded-lg">
                      {deleteError}
                    </p>
                  )}

                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== "DELETE" || isDeletingAccount}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
                  >
                    {isDeletingAccount ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Deleting Account...
                      </>
                    ) : (
                      "Permanently Delete My Account"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
