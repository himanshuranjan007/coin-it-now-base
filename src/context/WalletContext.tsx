
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { WalletInfo, connectWallet as connectWalletUtil, disconnectWallet as disconnectWalletUtil } from "@/lib/wallet";
import { toast } from "sonner";

type WalletContextType = {
  wallet: WalletInfo | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for wallet connection changes
  useEffect(() => {
    // Handle account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        setWallet(null);
        toast.info("Wallet disconnected");
      } else if (wallet && accounts[0] !== wallet.address) {
        // User switched accounts, reconnect with new account
        connectWallet();
      }
    };

    // Handle chain changes
    const handleChainChanged = () => {
      // Reload when chain changes
      window.location.reload();
    };

    // Add event listeners if window.ethereum is available
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    // Clean up event listeners
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [wallet]);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const walletInfo = await connectWalletUtil();
      setWallet(walletInfo);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    await disconnectWalletUtil();
    setWallet(null);
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        isConnecting,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

// Add typings for window object
declare global {
  interface Window {
    ethereum?: any;
  }
}
