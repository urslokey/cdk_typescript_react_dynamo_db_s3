import React from "react";
import { signOut } from "../auth";
import styled from "styled-components";
import { toast } from "react-toastify";

const Button = styled.button`
	padding: 10px 20px;
	background: #dc3545;
	color: #fff;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 16px;
	margin: 20px auto;
	display: block;
	width: 150px;
&:hover {
	background: #c82333;
	}
`;
const Logout = (props) => {
	const { setLoginStatus } = props;
	const handleLogout = () => {
		signOut();
		localStorage.removeItem("token");
		setLoginStatus(false);
		toast.success("Logged out successfully!");
	};
	return <Button onClick={handleLogout}>Logout</Button>;
};
export default Logout;
