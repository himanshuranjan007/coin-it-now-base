
import React, { createContext, useContext, useState, ReactNode } from "react";
import { WalletInfo, connectWallet as connectWalletUtil, disconnectWallet as disconnectWalletUtil } from "@/lib/wallet";

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
