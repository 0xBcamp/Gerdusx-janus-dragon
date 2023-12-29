import { Button, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { EmailLoginInput } from '@moonup/moon-api';
import { useMoon } from '../../hooks/useMoon';
import { redirect, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const { moon, updateToken, connect } = useMoon(); // Use the useMoon hook
    let navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });


    useEffect(() => {
        console.log("moon", moon);
        if (moon?.MoonAccount?.isAuth) {
            console.log("should redirect") 
            navigate("/");
        }

    }, [moon]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (moon) {
            const auth = moon.getAuthSDK();

            const request: EmailLoginInput = {
                email: formData.email,
                password: formData.password,
            }

            const response: any = await auth.emailLogin(request);
            await updateToken(response.data.token, response.data.refreshToken);
            navigate("/");
        }
    };

    return (
        <div className="flex justify-center items-center h-screen">
            <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-96" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-4 text-center">Log into your account</h2>
                    <TextField
                        label="Email"
                        variant="outlined"
                        fullWidth
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="mb-4">
                    <TextField
                        label="Password"
                        variant="outlined"
                        type="password"
                        fullWidth
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="flex justify-center">
                    <Button type="submit" variant="contained" color="primary">
                        Login
                    </Button>
                </div>
                <div className="mt-4 text-center">
                    <a href="/auth/register" className="text-blue-500 underline">Create new account</a>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;
