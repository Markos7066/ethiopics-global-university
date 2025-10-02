"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import axios from "axios";
import { useAppContext } from "@/context/AppContext"; // Updated casing to match file name
import { useRouter } from "next/navigation";

// Ethiopian flag colors
const ethiopianColors = {
  green: "#009639",
  yellow: "#FFDE00",
  red: "#DA020E",
};

export function LoginPage({ darkMode }) {
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "student", // Note: This might not be sent to the backend unless required
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields (email and password)");
      setLoading(false);
      return;
    }

    try {
      // Send login request to backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          email: formData.email,
          password: formData.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // Include credentials if backend uses cookies
        }
      );

      // Validate response structure
      const { token, user } = response.data;
      if (!token || !user || !user.role) {
        throw new Error("Invalid response from server: Missing token or user data");
      }

      // Store token based on rememberMe preference
      const storage = formData.rememberMe ? localStorage : sessionStorage;
      storage.setItem("token", token);

      // Clear any existing token from the other storage to avoid conflicts
      const otherStorage = formData.rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem("token");

      // Update context with user data
      dispatch({
        type: "SET_USER",
        payload: {
          user: {
            ...user,
            // Ensure all required fields are present, fallback to defaults if missing
            id: user.id || Date.now(), // Temporary ID if backend doesn't provide it
            fullName: user.fullName || user.email.split("@")[0], // Fallback name
            role: user.role,
          },
          role: user.role,
        },
      });

      // Redirect based on role with success message
      let redirectMessage = "Login successful!";
      switch (user.role) {
        case "student":
          router.push("/student-dashboard");
          break;
        case "tutor":
          router.push("/tutor-dashboard");
          break;
        case "admin":
          router.push("/admin-dashboard");
          break;
        default:
          redirectMessage = "Unknown role detected, redirecting to home.";
          router.push("/");
          break;
      }
      toast.success(redirectMessage);
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message); // Detailed error logging
      let errorMessage = "Login failed. Please try again.";
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
        if (error.response.status === 401) {
          errorMessage = "Invalid email or password.";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please contact support.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4">
        <div className="flex justify-between items-center">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => dispatch({ type: "SET_PAGE", payload: { page: "home" } })}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(45deg, ${ethiopianColors.green}, ${ethiopianColors.yellow}, ${ethiopianColors.red})`,
              }}
            >
              <span className="text-white text-sm font-bold">🎓</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-foreground leading-tight">Ethiopics Global</h1>
              <span className="text-xs text-muted-foreground leading-tight">University</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "SET_UI_STATE", payload: { darkMode: !darkMode } })}
          >
            {darkMode ? "☀️" : "🌙"}
          </Button>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-lg border-2 border-muted/50">
        <CardHeader className="text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg"
            style={{
              background: `linear-gradient(45deg, ${ethiopianColors.green}, ${ethiopianColors.yellow}, ${ethiopianColors.red})`,
            }}
          >
            <span className="text-white text-2xl font-bold">🎓</span>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <p className="text-muted-foreground">Sign in to continue your Ethiopian language journey</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Sign in as</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="tutor">Tutor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleChange("rememberMe", checked)}
                />
                <Label htmlFor="rememberMe" className="text-sm">Remember me</Label>
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-sm"
                style={{ color: ethiopianColors.green }}
                onClick={() => dispatch({ type: "SET_PAGE", payload: { page: "forgot-password" } })}
              >
                Forgot password?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              style={{ backgroundColor: ethiopianColors.green }}
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold"
                style={{ color: ethiopianColors.green }}
                onClick={() => dispatch({ type: "SET_PAGE", payload: { page: "signup" } })}
              >
                Create account
              </Button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => dispatch({ type: "SET_PAGE", payload: { page: "home" } })}
              className="text-sm hover:bg-accent"
            >
              ← Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;