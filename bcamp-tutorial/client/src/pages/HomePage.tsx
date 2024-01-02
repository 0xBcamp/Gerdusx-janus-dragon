import { Button, CircularProgress, Fab, TextField } from '@mui/material';
import React, { useEffect } from 'react';
import { useMoon } from '../hooks/useMoon';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { ethers } from 'ethers';
import { InputBody, UniswapInput } from '@moonup/moon-api';
import TransferETH from '../components/TransferETH';
import TransferERC20 from '../components/TransferERC20';

interface Account {
    key: string;
    balance: string;
    balance_usdc: string;
}

const HomePage: React.FC = () => {

    const UNI_ROUTER = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD";
    const USDC = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23";
    const { moon, createAccount, disconnect, listAccounts, getWallet, setWallet, selectedWallet } = useMoon(); // Use the useMoon hook
    let navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [isLoadingAccounts, setIsLoadingAccounts] = React.useState(true);
    const [isAddingAccount, setIsAddingAccount] = React.useState(false);
    const [isLoadingAccount, setIsLoadingAccount] = React.useState(false);
    const [accounts, setAccounts] = React.useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = React.useState<Account>();
    const [refreshBalances, setRefreshBalances] = React.useState(0);
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
            fetchBalances();
        }
    }, [selectedWallet, refreshBalances]);

    useEffect(() => {
        if (refreshBalances > 0) {
            fetchBalances();
        }
    }, [selectedWallet, refreshBalances]);

    const fetchBalances = async () => {
        setIsLoadingAccount(true);
        const account = accounts.find((account) => account.key === selectedWallet);
        setSelectedAccount({
            ...account!,
            balance: "0",
            balance_usdc: "0"
        });

        const data: InputBody = {
            contract_address: USDC,
            chain_id: "80001"
        }

        const [balance_eth, balance_usdc] = await Promise.all([
            moon?.getAccountsSDK().getBalance(selectedWallet!, { chainId: moon?.MoonAccount.network.chainId }) as any,
            moon?.getErc20SDK().balanceOfErc20(selectedWallet, data) as any
        ]);

        if (account) {
            const formattedBalance = balance_eth?.data?.data?.balance ? ethers.formatUnits(BigInt(balance_eth.data.data.balance), 18) : "0";
            const formattedUsdcBalance = balance_usdc.data.data.balance_of ? ethers.formatUnits(BigInt(balance_usdc.data.data.balance_of), 6) : "0";

            setSelectedAccount({
                ...account!,
                balance: formattedBalance,
                balance_usdc: formattedUsdcBalance
            });
        }
        setIsLoadingAccount(false);
    }

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
        setAccounts((prevAccounts) => [...prevAccounts, { key: acc.data.data.address, balance: "0", balance_usdc: "0" }]);
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
                                <p className="mt-2 text-gray-500">MATIC: {selectedAccount.balance}</p>
                                <p className="mt-2 text-gray-500">USDC: {selectedAccount.balance_usdc}</p>
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
                {isLoggedIn && moon && <TransferETH moon={moon} selectedWallet={selectedWallet} onSuccess={() => setRefreshBalances(new Date().getTime())} /> }

                {/* {isLoggedIn && <div className="mt-4 p-4 max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
                    <div className='flex flex-row justify-between items-center border-b border-gray-200 pb-2 min-h-12'>
                        <div>
                            Swap MATIC for USDC
                        </div>
                    </div>
                    <div className="flex flex-row items-center">
                        <div className="p-4 w-full">
                            <TextField
                                label="Matic"
                                variant="outlined"
                                fullWidth
                                name="matic"
                            // value={formData.email}
                            // onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <Button variant="contained" color="primary" onClick={async () => {
                                console.log("moon", moon);
                                const data: UniswapInput = {
                                    to: selectedWallet, 
                                    contract_address: UNI_ROUTER, // Fill in the contract address of the router
                                    // token_a: "0x4ee8a9c9b409db09750e9f22da94402be2085fcd", // Fill in the address of token A
                                    token_b: USDC, // Fill in the address of token B
                                    amount_a: "10000000", // Fill in the amount of token A
                                    amount_b: "0", // Fill in the amount of token B
                                    chain_id: "80001",
                                    value: "10000000", // Fill in the amount of token A
                                }

                                const result = await moon?.getUniswapSDK().swapExactEthForTokens(selectedWallet, data);
                                console.log("result", result);
                            }}>
                                Swap
                            </Button>
                        </div>
                    </div>
                </div>} */}
                {isLoggedIn && moon && <TransferERC20 moon={moon} selectedWallet={selectedWallet} onSuccess={() => setRefreshBalances(new Date().getTime())} /> }
                
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
                                className={`${selectedAccount && selectedAccount.key === account.key ? "bg-gray-100" : ""} cursor-pointer p-2 my-2 rounded-md shadow hover:bg-gray-200`}
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
