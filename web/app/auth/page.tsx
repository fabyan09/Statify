"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { user: currentUser, login, logout } = useAuth();

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return userApi.login(credentials);
    },
    onSuccess: (user) => {
      login(user);
      router.push("/");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Invalid username or password";
      setLoginError(message);
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: (data: { username: string; password: string }) => userApi.create(data),
    onSuccess: (user) => {
      login(user);
      router.push("/");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Signup failed";
      setSignupError(message);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (loginUsername && loginPassword) {
      loginMutation.mutate({ username: loginUsername, password: loginPassword });
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    if (!signupUsername || !signupPassword) {
      setSignupError("Please fill all fields");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    if (signupPassword.length < 4) {
      setSignupError("Password must be at least 4 characters");
      return;
    }

    signupMutation.mutate({ username: signupUsername, password: signupPassword });
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Si l'utilisateur est déjà connecté, afficher un message
  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md !bg-background/10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
                <Music className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">Déjà connecté</CardTitle>
            <CardDescription>
              Vous êtes actuellement connecté en tant que <strong>{currentUser.username}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Pour vous connecter à un autre compte, veuillez d'abord vous déconnecter.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/")}
              >
                Retour au Dashboard
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleLogout}
              >
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md !bg-background/10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Music className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">Welcome to Statify</CardTitle>
          <CardDescription>Your music analytics dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    placeholder="Enter your username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                {loginError && (
                  <div className="text-sm text-red-500">{loginError}</div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    placeholder="Choose a username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Choose a password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {signupError && (
                  <div className="text-sm text-red-500">{signupError}</div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
