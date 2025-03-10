import React, { useState } from "react";
import { signIn } from "../auth";
import styled from "styled-components";
import { toast } from "react-toastify";

const Container = styled.div`
	width: 350px;
	padding: 20px;
	margin: auto;
	margin-top: 50px;
	background: #fff;
	border-radius: 8px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	text-align: center;
`;
const Input = styled.input`
	width: 100%;
	padding: 10px;
	margin: 10px 0;
	border: 1px solid #ccc;
	border-radius: 4px;
	font-size: 16px;
`;
const Button = styled.button`
	width: 100%;
	padding: 10px;
	background: #28a745;
	color: #fff;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 16px;
	margin-top: 10px;
&:hover {
	background: #218838;
	}
`;

const Spinner = styled.div`
 width: 20px;
 height: 20px;
 border: 3px solid white;
 border-top: 3px solid transparent;
 border-radius: 50%;
 animation: spin 0.6s linear infinite;
 @keyframes spin {
   0% { transform: rotate(0deg); }
   100% { transform: rotate(360deg); }
 }
`;

const SignIn = (props) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { setLoginStatus } = props;
	const [loading, setLoading] = useState(false);

	const handleSignIn = async () => {
		setLoading(true);
		try {
			const token = await signIn(email, password);
			localStorage.setItem("token", token);
			setLoginStatus(true);
			toast.success("Login successful!");
		} catch (err) {
			toast.error(err.message);
		} finally {
			setLoading(false);
		}
	};
	return (
		<Container>
			<h2>Sign In</h2>
			<Input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
			<Input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
			<Button onClick={handleSignIn} disabled={loading}> {loading ? <Spinner /> : "Sign In"}</Button>		
	   </Container>
	);
};
export default SignIn;
