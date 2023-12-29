import { MoonSDK } from "@moonup/moon-sdk";
import { useEffect, useState } from "react";
import { AUTH, Chain, MOON_SESSION_KEY, MoonAccount, Storage  } from "@moonup/types";
import { AccountResponse, CreateAccountInput } from "@moonup/moon-api";

export const useMoon = () => {
    const [moon, setMoon] = useState<MoonSDK | null>(null);
    const [accounts, setAccounts] = useState<AccountResponse | undefined>();
    const [selectedWallet, setSelectedWallet] = useState<string>("");

    
    useEffect(() => {
        initialize();
	}, []);
    
    const initialize = async () => {
        console.log("initializing...")

        const chains: Chain[] = [{
            chainId: "80001",
            chainName: "Mamubai Testnet (Polygon)",
            nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
            },
            rpcUrls: [process.env.REACT_APP_POLYGON_MUMBAI_RPC_URL || ""],
            blockExplorerUrls:['https://mumbai.polygonscan.com/'],
        }];

		const moonInstance = new MoonSDK({
			Storage: {
				key: MOON_SESSION_KEY,
				type: Storage.SESSION,
			},
			Auth: {
				AuthType: AUTH.JWT,
			},
            Networks: chains,
		});
		setMoon(moonInstance);
		moonInstance.login();
	};

    const updateToken = async (token: string, refreshToken: string) => {
		if (moon) {
			moon.updateToken(token);
            moon.updateRefreshToken(refreshToken);

            moon.login();
            // listAccounts();
		}
	};

    const connect = async () => {
		if (moon) {
			return moon.connect();
		}
	};


    const listAccounts = async () => {
		const accounts = await moon?.listAccounts();
        setAccounts(accounts);
        return accounts;
	}

    const createAccount = async () => {
        if (moon) {
            // const data: CreateAccountInput = {private_key: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"}; //hardhat account
            const data: CreateAccountInput = {};
            const newAccount = await moon?.getAccountsSDK().createAccount(data);
            return newAccount;
        }
	}

    const getWallet = () => {
        if (moon) {
            const wallet = moon?.getMoonAccount().getWallet();
            return wallet;
        }
	}

    const setWallet = (address: string) => {
        if (moon) {
            moon?.getMoonAccount().setWallet(address);
            setSelectedWallet(address);
        }
	}

    const getNetworks = () => {
        if (moon) {
            moon?.getNetworks();
        }
	}

    const disconnect = async () => {
		if (moon) {
            console.log("gonna disconnect")
			await moon.disconnect();
            sessionStorage.removeItem(MOON_SESSION_KEY)
			setMoon(null);
		}
	};

    return {
        // account,
        moon,
        connect,
        accounts,
		listAccounts,
        createAccount,
        updateToken,
        disconnect,
        getWallet,
        setWallet,
        selectedWallet,
		// updateAccount
    }
}