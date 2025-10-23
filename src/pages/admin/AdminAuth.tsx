import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function AdminAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is a password recovery link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setIsRecovery(true);
    }
  }, []);

  useEffect(() => {
    if (user && !isRecovery) {
      // Check if user has admin access
      checkAdminAccess();
    }
  }, [user, navigate, isRecovery]);

  const checkAdminAccess = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'editor', 'viewer'])
      .single();

    if (data) {
      navigate('/admin');
    } else {
      toast.error("Access denied. Admin privileges required.");
      await supabase.auth.signOut();
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message || "Failed to sign in");
      setLoading(false);
    }
    // checkAdminAccess will run via useEffect after successful sign in
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/login`,
    });
    
    if (error) {
      toast.error(error.message || "Failed to send reset email");
    } else {
      toast.success("Password reset email sent! Check your inbox.");
      setResetMode(false);
    }
    setLoading(false);
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      toast.error(error.message || "Failed to update password");
      setLoading(false);
    } else {
      toast.success("Password updated successfully! Please sign in.");
      setIsRecovery(false);
      setNewPassword("");
      setConfirmPassword("");
      window.location.hash = "";
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {isRecovery ? "Set New Password" : resetMode ? "Reset Password" : "Admin Access"}
          </CardTitle>
          <CardDescription>
            {isRecovery 
              ? "Enter your new password below"
              : resetMode 
              ? "Enter your email to receive a password reset link" 
              : "Sign in with your admin credentials"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRecovery ? (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Set New Password"}
              </Button>
            </form>
          ) : (
            <form onSubmit={resetMode ? handlePasswordReset : handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              {!resetMode && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading 
                  ? (resetMode ? "Sending..." : "Signing in...") 
                  : (resetMode ? "Send Reset Link" : "Sign In")}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => {
                  setResetMode(!resetMode);
                  setPassword("");
                }}
                disabled={loading}
              >
                {resetMode ? "Back to Sign In" : "Forgot Password?"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
