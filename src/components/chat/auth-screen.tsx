import React from "react";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";

interface AuthScreenProps {
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  authName: string;
  setAuthName: (name: string) => void;
  isRegistering: boolean;
  setIsRegistering: (isRegistering: boolean) => void;
  authError: string;
  onSubmit: (e: React.FormEvent) => void;
}

export function AuthScreen({
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authName,
  setAuthName,
  isRegistering,
  setIsRegistering,
  authError,
  onSubmit,
}: AuthScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-emerald-600 dark:text-emerald-500">
              <Scale className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-950 dark:text-white">Legal-Assist Agent Hub</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Access the legal statutory & police SOP query resolver.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Name</label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="name@domain.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1 bg-red-100/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-2 rounded">
                {authError}
              </p>
            )}

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
              {isRegistering ? "Register Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {isRegistering ? "Already have an account? Sign In" : "Need an account? Register here"}
            </button>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
