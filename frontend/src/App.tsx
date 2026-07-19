import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TerminalPage from "./pages/TerminalPage";
import { useAuthStore } from "./stores/authStore";

function App() {
	const { isAuthenticated } = useAuthStore();

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path="/login"
					element={
						!isAuthenticated ? <LoginPage /> : <Navigate to="/chat" replace />
					}
				/>
				<Route
					path="/register"
					element={
						!isAuthenticated ? (
							<RegisterPage />
						) : (
							<Navigate to="/chat" replace />
						)
					}
				/>
				<Route
					path="/chat"
					element={
						isAuthenticated ? <ChatPage /> : <Navigate to="/login" replace />
					}
				/>
				<Route path="/terminal" element={<TerminalPage />} />
				<Route
					path="*"
					element={
						<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
