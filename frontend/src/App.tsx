import React, { useState } from "react";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import Logout from "./components/Logout";
import styled from "styled-components";
import ImageGallery from "./components/ImageGallery";
import { ToastContainer } from 'react-toastify';


const Container = styled.div`
	text-align: center;
	margin-top: 50px;
`;
const ToggleButton = styled.button`
	margin-top: 20px;
	padding: 10px 20px;
	background: #6c757d;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 16px;
&:hover {
	background: #5a6268;
	}
`;

const App = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [showSignUp, setShowSignUp] = useState(false);
	const toggleForm = () => setShowSignUp(!showSignUp);
	return (
		<Container>
			<ToastContainer position="top-right" autoClose={3000} />
			{isAuthenticated ? (
				<>
				<ImageGallery />
				<Logout setLoginStatus={setIsAuthenticated}/>
				</>
			) : (
				<>

					{showSignUp ? <SignUp /> : <SignIn setLoginStatus={setIsAuthenticated}/>}
					<ToggleButton onClick={toggleForm}>
						{showSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
					</ToggleButton>

				</>
			)}
		</Container>
	);
};
export default App;
