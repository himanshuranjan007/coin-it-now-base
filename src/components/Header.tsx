
import React from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/WalletContext";
import { Wallet } from "lucide-react";

const Header = () => {
  const { wallet, isConnecting, connectWallet, disconnectWallet } = useWallet();

  return (
    <header className="flex justify-between items-center py-4 px-6 md:px-10 w-full">
      <div className="flex items-center space-x-2">
        <div className="font-bold text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-brand to-accent">
          justCOINit
        </div>
      </div>

      <div>
        {wallet?.isConnected ? (
          <div className="flex items-center gap-2">
            <div className="hidden md:block px-3 py-1 rounded-full bg-secondary text-sm font-mono">
              {wallet.shortAddress}
            </div>
            <Button
              onClick={() => disconnectWallet()}
              variant="outline"
              size="sm"
              className="border-accent/50 text-accent hover:bg-accent/10"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => connectWallet()} 
            disabled={isConnecting}
            className="wallet-button"
            size="sm"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
