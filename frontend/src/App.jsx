import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import api from "./services/api";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import Episodes from "./pages/Episodes";
import Analytics from "./pages/Analytics";
import Users from "./pages/Users";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const loginResponse = await api.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem(
        "token",
        loginResponse.data.access_token
      );

      const profileResponse = await api.get("/users/me");

      localStorage.setItem(
        "user",
        JSON.stringify(profileResponse.data)
      );

      onLogin(profileResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] px-4">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center py-10">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
          
          <div className="hidden bg-blue-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-12 flex h-12 w-12 items-center justify-center rounded-2xl bg-white font-bold text-blue-600">
                DR
              </div>

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-100">
                Dataset Request Desk
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-tight">
                Manage your dataset workflow with confidence.
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-blue-100">
                Create requests, manage robot episodes, track delivery,
                and keep every workflow step organized.
              </p>
            </div>

            <p className="text-sm text-blue-100">
              Secure workspace for dataset operations.
            </p>
          </div>

          <div className="flex items-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold text-white lg:hidden">
                  DR
                </div>

                <p className="text-sm font-semibold text-blue-600">
                  Welcome back
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  Sign in to your account
                </h2>

                <p className="mt-2 text-slate-500">
                  Enter your credentials to continue.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-8 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Demo account
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Client: client-a@example.com
                </p>

                <p className="text-sm text-slate-600">
                  Password: client123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold text-blue-600">
        Dataset Request Desk
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">
        {title}
      </h1>
      <p className="mt-2 text-slate-500">
        This section is coming next.
      </p>
    </div>
  );
}

function ProtectedApp({ user, onLogout }) {
  return (
    <Layout user={user} onLogout={onLogout}>
      <Routes>
        <Route
          path="/dashboard"
          element={<Dashboard user={user} />}
        />

        <Route
          path="/requests"
          element={<Requests user={user} />}
        />

        <Route
          path="/episodes"
          element={<Episodes  />}
        />

        <Route
          path="/analytics"
          element={<Analytics  />}
        />

        <Route
          path="/users"
          element={<Users  />}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route
            path="*"
            element={<Login onLogin={setUser} />}
          />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <ProtectedApp
        user={user}
        onLogout={() => setUser(null)}
      />
    </BrowserRouter>
  );
}