import { Button, TextField } from '@mui/material';
import React, { useState } from 'react';

const RegisterPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(event.target.value);
    };

    const handleRegister = () => {
        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
        } else {
            // Perform registration logic
            setPasswordError('');
            console.log("register user")
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
                    <Button variant="contained" color="primary" onClick={handleRegister}>
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
