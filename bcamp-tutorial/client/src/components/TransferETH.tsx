import { InputBody } from '@moonup/moon-api';
import { MoonSDK } from '@moonup/moon-sdk';
import { Button, CircularProgress, TextField } from '@mui/material';
import { ethers } from 'ethers';
import React from 'react';

interface TransferETHProps {
    moon: MoonSDK;
    selectedWallet: string;
    onSuccess: () => void;
}

const TransferETH: React.FC<TransferETHProps> = ({ moon, selectedWallet, onSuccess }: TransferETHProps) => {

    const [toAddress, setToAddress] = React.useState("");
    const [amount, setAmount] = React.useState("");
    const [isSending, setIsSending] = React.useState(false);

    const transferETH = async () => {
        setIsSending(true);
        console.log("moon", moon);
        console.log(ethers.parseEther(amount).toString())
        const data: InputBody = {
            to: toAddress,
            value: ethers.parseEther(amount).toString(),
            chain_id: moon?.MoonAccount.network.chainId
        }
        const result = await moon?.getAccountsSDK().transferEth(selectedWallet, data);
        console.log("result", result);
        onSuccess();
        setToAddress("");
        setAmount("");
        setIsSending(false);
    }
    return (
        <div className="mt-4 p-4 max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
            <div className='flex flex-row justify-between items-center border-b border-gray-200 pb-2 min-h-12'>
                <div>
                    Transfer MATIC
                </div>
            </div>
            <div className="flex flex-row items-center">
                <div className="p-4 w-full">
                    <TextField
                        label="To Address"
                        variant="outlined"
                        fullWidth
                        name="email"
                        value={toAddress}
                        onChange={(e) => setToAddress(e.target.value)}
                    />
                </div>
                <div className="p-4 w-full">
                    <TextField
                        label="Amount"
                        variant="outlined"
                        fullWidth
                        name="email"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                <div>
                    <Button variant="contained" color="primary" disabled={isSending} onClick={transferETH}>
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TransferETH;
