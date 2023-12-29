import { Button, CircularProgress, Fab } from '@mui/material';
import React, { useEffect } from 'react';
import { useMoon } from '../hooks/useMoon';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';

interface Account {
    key: string;
    balance: string;
}

const HomePage: React.FC = () => {
    const { moon, createAccount, disconnect, listAccounts, getWallet, setWallet } = useMoon(); // Use the useMoon hook
    let navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [isLoadingAccounts, setIsLoadingAccounts] = React.useState(true);
    const [isAddingAccount, setIsAddingAccount] = React.useState(false);
    const [accounts, setAccounts] = React.useState<Account[]>([]);

    // const handleDisconnect = async () => {
    //     await disconnect();
    //     navigate("/auth/login");
    // };

    useEffect(() => {
        if (moon) {
            setIsLoggedIn(moon.MoonAccount.isAuth);
        }
    }, [moon]);

    useEffect(() => {
        if (isLoggedIn) {
            (async () => {
                setIsLoadingAccounts(true); 
                const accounts = await listAccounts();
                console.log("isLoggedIn accounts", accounts);

                const accountArray: Account[] = (accounts as any).data.keys?.map((key: any, index: number) => {
                    return {
                        key,
                        balance: "4"
                    };
                });

                setAccounts(accountArray);
                setIsLoadingAccounts(false); 
                console.log("accountArray", accountArray);
            })();
        }
    }, [isLoggedIn]);

    // useEffect(() => {
    //     (async () => {
    //         if (accounts?.length > 0) {
            
    //             console.log("accounts", accounts);
    //             setWallet(accounts[6].key)
    //             const wallet = getWallet();
    //             console.log("wallet", wallet);
    
    //             const networks = moon?.getNetworks();
    //             console.log("networks", networks);
    
    //             if (networks && networks?.length > 0) {
    //                 moon?.updateNetwork(networks[0]);
    //             }
    //             console.log("moon", moon);
    
    //             const balance = await moon?.getAccountsSDK().getBalance(wallet!, { chainId: moon?.MoonAccount.network.chainId });
    //             console.log("balance", balance)
    //         }
    //     })()

    // }, [accounts])

    const addAccount = async () => {
        setIsAddingAccount(true); 
        const acc: any = await createAccount();
        // const account = await moon?.MoonAccount.addAccount();
        console.log("acc", acc);
        setAccounts((prevAccounts) => [...prevAccounts, { key: acc.data.data.address, balance: "0" }]);
        setIsAddingAccount(false); 
    };

    return (
        <div className="flex flex-grow h-screen">
            <div className="w-3/4 p-4">
                <h1>Welcome to the Home Page</h1>
                {isLoggedIn ? (
                    <Button variant="contained" color="primary" onClick={() => disconnect().then(() => navigate("/auth/login"))}>
                        Disconnect
                    </Button>
                ) : (
                    <Button variant="contained" color="primary" onClick={() => navigate("/auth/login")}>
                        Login
                    </Button>
                )}
            </div>
            {isLoggedIn && <div className="w-1/4 p-4 h-full" style={{ boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)' }}>

                <div className="flex justify-between items-center border-b border-gray-200 pb-2 min-h-12">
                    <h2>Accounts</h2>

                    {isAddingAccount ?
                        <CircularProgress size={24} className="text-blue-500" />
                        : <Fab size="small" color="primary" aria-label="add" onClick={() => addAccount()}>
                            <AddIcon />
                        </Fab>}
                </div>

                {isLoadingAccounts ? (
                    <div className="flex justify-center items-center pt-4"> 
                        <CircularProgress size={24} className="text-blue-500" />
                    </div>
                ) : (
                    <ul>
                        {accounts.map((account, index) => (
                            <li key={index}>{account.key}</li>
                        ))}
                    </ul>
                )}
            </div>}
        </div>
    );
}

export default HomePage;
