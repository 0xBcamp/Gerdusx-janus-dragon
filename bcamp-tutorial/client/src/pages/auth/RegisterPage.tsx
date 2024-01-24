import { Button, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useMoon } from '../../hooks/useMoon';
import { useNavigate } from 'react-router-dom';
import { EmailSignupInput } from '@moonup/moon-api';

const RegisterPage: React.FC = () => {
    const { moon, updateToken, connect } = useMoon(); // Use the useMoon hook
    let navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (moon?.MoonAccount?.isAuth) {
            navigate("/");
        }
    }, [moon]);

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(event.target.value);
    };

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
        } else {
            // Perform registration logic
            setPasswordError('');
            setLoading(true);
    
            try {
                if (moon) {
                    const auth = moon.getAuthSDK();
                    const request: EmailSignupInput = {
                        email: email,
                        password: password,
                    }
    
                    console.log("request", request)
                    await auth.emailSignup(request);
                    navigate("/auth/login");
                }
            } catch (error) {
                console.error("Signup error", error);
                setLoading(false);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="flex justify-center items-center h-screen">
            <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-96">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-4 text-center">Register an account</h2>
                    <TextField
                        label="Email"
                        variant="outlined"
                        fullWidth
                        value={email}
                        onChange={handleEmailChange}
                    />
                </div>
                <div className="mb-4">
                    <TextField
                        label="Password"
                        variant="outlined"
                        type="password"
                        fullWidth
                        value={password}
                        onChange={handlePasswordChange}
                    />
                </div>
                <div className="mb-4">
                    <TextField
                        label="Confirm Password"
                        variant="outlined"
                        type="password"
                        fullWidth
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        error={passwordError !== ''}
                        helperText={passwordError}
                    />
                </div>
                <div className="flex justify-center">
                    <Button variant="contained" color="primary" disabled={loading} onClick={handleRegister}>
                        Register
                    </Button>
                </div>
                <div className="mt-4 text-center">
                    <a href="/auth/login" className="text-blue-500 underline">Already have an account? Login</a>
                </div>
            </form>
        </div>
    );
};

export default RegisterPage;
