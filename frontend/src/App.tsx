import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/chat" element={<ChatPage />} />
				<Route path="*" element={<Navigate to="/chat" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
