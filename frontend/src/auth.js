import {
	CognitoUserPool,
	CognitoUser,
	AuthenticationDetails
	} from "amazon-cognito-identity-js";
	
	const poolData = {
            UserPoolId: 'us-east-1_vVjERbLLA', 
            ClientId: '5jbhsqehe8bru5u262kjlardv8'
	};
	const userPool = new CognitoUserPool(poolData);
	// Signup function
	export const signUp = (email, password) => {
		return new Promise((resolve, reject) => {
			userPool.signUp(email, password, [], null, (err, result) => {
				if (err) reject(err);
				else resolve(result);
			});
		});
	};
	// Login function
	export const signIn = (email, password) => {
		const user = new CognitoUser({
			Username: email,
			Pool: userPool
		});
		const authDetails = new AuthenticationDetails({
			Username: email,
			Password: password
		});
		return new Promise((resolve, reject) => {
			user.authenticateUser(authDetails, {
				onSuccess: (session) => {
					const idToken = session.getIdToken().getJwtToken();
					resolve(idToken);
				},
				onFailure: (err) => reject(err)
			});
		});
	};
	// Logout function
	export const signOut = () => {
		const user = userPool.getCurrentUser();
		if (user) user.signOut();
	};
