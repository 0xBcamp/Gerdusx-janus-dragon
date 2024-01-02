import { Button, CircularProgress, Fab } from '@mui/material';
import React, { useEffect } from 'react';
import { useMoon } from '../hooks/useMoon';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { ethers } from 'ethers';

interface Account {
    key: string;
    balance: string;
}

const HomePage: React.FC = () => {
    const { moon, createAccount, disconnect, listAccounts, getWallet, setWallet, selectedWallet } = useMoon(); // Use the useMoon hook
    let navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [isLoadingAccounts, setIsLoadingAccounts] = React.useState(true);
    const [isAddingAccount, setIsAddingAccount] = React.useState(false);
    const [isLoadingAccount, setIsLoadingAccount] = React.useState(false);
    const [accounts, setAccounts] = React.useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = React.useState<Account>();

    useEffect(() => {
        console.log("moon", moon);
        if (moon) {
            if (moon.MoonAccount.isAuth) {
                setIsLoggedIn(true);
                
                const networks = moon?.getNetworks();
                if (networks && networks?.length > 0) {
                    moon?.updateNetwork(networks[0]);
                }
            } else {
                navigate("/auth/login");
            }
        }
    }, [moon]);

    useEffect(() => {
        if (selectedWallet) {
            (async () => {
                setIsLoadingAccount(true);
                const account = accounts.find((account) => account.key === selectedWallet);
                setSelectedAccount({
                    ...account!,
                    balance: "0"
                });

                const balance: any = await moon?.getAccountsSDK().getBalance(selectedWallet!, { chainId: moon?.MoonAccount.network.chainId });
                
                if (account) {
                    const formattedBalance = ethers.formatUnits(BigInt(balance.data.data.balance), 18);
                    
                    setSelectedAccount({
                        ...account!,
                        balance: formattedBalance
                    });
                }
                setIsLoadingAccount(false);
            })()
        }
    }, [selectedWallet]);

    useEffect(() => {
        if (isLoggedIn) {
            (async () => {
                setIsLoadingAccounts(true);
                const accounts = await listAccounts();

                const accountArray: Account[] = (accounts as any).data.keys?.map((key: any, index: number) => {
                    return {
                        key,
                        balance: "0"
                    };
                });

                setAccounts(accountArray);
                setIsLoadingAccounts(false);
            })();
        }
    }, [isLoggedIn]);


    const addAccount = async () => {
        setIsAddingAccount(true);
        const acc: any = await createAccount();
        setAccounts((prevAccounts) => [...prevAccounts, { key: acc.data.data.address, balance: "0" }]);
        setIsAddingAccount(false);
    };

    return (
        <div className="flex flex-grow h-screen">
            <div className={`${isLoggedIn ? "w-3/4" : "w-full"} p-4`}>
                <div className="mt-4 p-4 max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
                    <div className='flex flex-row justify-between items-center border-b border-gray-200 pb-2 min-h-12'>
                        <div>
                            Welcome, {moon?.MoonAccount.email}
                        </div>
                        <div>
                            <Button variant="outlined" color="primary" onClick={() => disconnect().then(() => navigate("/auth/login"))}>
                                Disconnect
                            </Button>
                        </div>
                    </div>
                    <div className="md:flex">
                        {isLoggedIn && <div className="p-4">
                            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Selected Account</div>
                            {selectedAccount && !isLoadingAccount && <>
                                <p className="block mt-1 text-lg leading-tight font-medium text-black">{selectedAccount.key}</p>
                                <p className="mt-2 text-gray-500">Balance: {selectedAccount.balance}</p>
                            </>}
                            {!selectedAccount && !isLoadingAccount && <p className="mt-2 text-gray-500">No Account Selected</p>}
                            {isLoadingAccount && (
                                <div className="flex justify-center items-center mt-4">
                                    <CircularProgress size={24} className="text-blue-500" />
                                </div>
                            )}
                        </div>}
                        {!isLoggedIn && <div className="flex justify-center items-center mt-4">
                            <Button variant="contained" color="primary" onClick={() => navigate("/auth/login")}>
                                Login
                            </Button>
                        </div>}
                    </div>
                </div>
                
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
                    <>
                        {accounts.map((account, index) => (
                            <div
                                key={index}
                                onClick={() => setWallet(account.key)}
                                className={`${selectedAccount && selectedAccount.key === account.key ? "bg-gray-100": ""} cursor-pointer p-2 my-2 rounded-md shadow hover:bg-gray-200`}
                            >
                                {account.key}
                            </div>
                        ))}
                    </>
                )}
            </div>}
        </div>
    );
}

export default HomePage;
