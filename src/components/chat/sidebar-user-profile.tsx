import React from "react";
import { User, LogOut, LogIn, Settings } from "lucide-react";

interface SidebarUserProfileProps {
  session: any;
  onSignOut: () => void;
  onSignInClick: () => void;
  onSettingsClick: () => void;
}

export function SidebarUserProfile({
  session,
  onSignOut,
  onSignInClick,
  onSettingsClick,
}: SidebarUserProfileProps) {
  const isAnonymous = session?.user?.is_anonymous || false;

  return (
    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/40 text-xs">
      <div className="flex items-center space-x-2">
        <div className="p-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400">
          <User className="w-3.5 h-3.5" />
        </div>
        <div className="truncate max-w-[120px]">
          <p className="font-semibold text-zinc-900 dark:text-zinc-200 truncate">
            {isAnonymous ? "Guest User" : (session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || "User")}
          </p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate">
            {isAnonymous ? "Local history only" : session?.user?.email}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isAnonymous ? (
          <button 
            onClick={onSignInClick}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-md transition-colors flex items-center gap-1"
            title="Sign In to Sync History"
          >
            <LogIn className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button 
              onClick={onSettingsClick}
              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-md transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={onSignOut}
              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
