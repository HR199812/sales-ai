import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import "./AuthPage.css";

const RegisterPage: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const { register, isLoading, error, clearError } = useAuthStore();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		clearError();
		try {
			await register(email, password, firstName, lastName);
			navigate("/chat");
		} catch {
			// error is already set in store
		}
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<h1 className="auth-title">Sales-AI</h1>
				<h2 className="auth-subtitle">Create an account</h2>

				{error && <div className="auth-error">{error}</div>}

				<form onSubmit={handleSubmit} className="auth-form">
					<div className="form-row">
						<div className="form-group">
							<label htmlFor="firstName">First Name</label>
							<input
								id="firstName"
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								placeholder="John"
								required
							/>
						</div>
						<div className="form-group">
							<label htmlFor="lastName">Last Name</label>
							<input
								id="lastName"
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								placeholder="Doe"
								required
							/>
						</div>
					</div>
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
							placeholder="Min 8 characters"
							required
							minLength={8}
							autoComplete="new-password"
						/>
					</div>
					<button type="submit" disabled={isLoading} className="auth-button">
						{isLoading ? "Creating account..." : "Create Account"}
					</button>
				</form>

				<p className="auth-link">
					Already have an account? <Link to="/login">Sign In</Link>
				</p>
			</div>
		</div>
	);
};

export default RegisterPage;
