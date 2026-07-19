import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import "./AuthPage.css";

const LoginPage: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { login, isLoading, error, clearError } = useAuthStore();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		clearError();
		try {
			await login(email, password);
			navigate("/chat");
		} catch {
			// error is already set in store
		}
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<h1 className="auth-title">Sales-AI</h1>
				<h2 className="auth-subtitle">Sign in to your account</h2>

				{error && <div className="auth-error">{error}</div>}

				<form onSubmit={handleSubmit} className="auth-form">
					<div className="form-group">
						<label htmlFor="email">Email</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							required
							autoComplete="email"
						/>
					</div>
					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							required
							autoComplete="current-password"
						/>
					</div>
					<button type="submit" disabled={isLoading} className="auth-button">
						{isLoading ? "Signing in..." : "Sign In"}
					</button>
				</form>

				<p className="auth-link">
					Don't have an account? <Link to="/register">Register</Link>
				</p>
			</div>
		</div>
	);
};

export default LoginPage;
