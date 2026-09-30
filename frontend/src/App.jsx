import { useState } from "react";
import api from "./services/api";
import "./index.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem("token", response.data.access_token);

      setMessage("Login successful!");
    } catch (error) {
      setMessage(
        error.response?.data?.detail || "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Dataset Request Desk</h1>
        <p className="subtitle">
          Manage dataset requests and robot episodes
        </p>

        <form onSubmit={handleLogin}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit">Sign in</button>
        </form>

        {message && <p className="message">{message}</p>}

        <div className="demo-users">
          <p>Demo accounts</p>
          <small>Client: client-a@example.com / client123</small>
          <small>Operator: ops1@example.com / ops123</small>
          <small>Admin: admin@example.com / admin123</small>
        </div>
      </div>
    </div>
  );
}

export default App;