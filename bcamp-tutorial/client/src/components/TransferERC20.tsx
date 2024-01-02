import { InputBody } from '@moonup/moon-api';
import { MoonSDK } from '@moonup/moon-sdk';
import { Button, CircularProgress, TextField } from '@mui/material';
import { ethers } from 'ethers';
import React from 'react';

interface TransferERC20Props {
    moon: MoonSDK;
    selectedWallet: string;
    onSuccess: () => void;
}

const TransferERC20: React.FC<TransferERC20Props> = ({ moon, selectedWallet, onSuccess }: TransferERC20Props) => {
    const USDC = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23";

    const [toAddress, setToAddress] = React.useState("");
    const [amount, setAmount] = React.useState("");
    const [isSending, setIsSending] = React.useState(false);

    const transferERC20 = async () => {
        setIsSending(true);
        console.log("moon", moon);
        const data: InputBody = {
            to: toAddress,
            value: ethers.parseUnits(amount, 6).toString(),
            chain_id: moon?.MoonAccount.network.chainId,
            contract_address: USDC
        }
        const result = await moon?.getErc20SDK().transferErc20(selectedWallet, data);

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
                    Transfer USDC
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
                    <Button variant="contained" color="primary" disabled={isSending} onClick={transferERC20}>
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TransferERC20;
