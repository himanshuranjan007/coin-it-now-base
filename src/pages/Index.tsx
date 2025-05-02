
import React, { useState } from "react";
import Header from "@/components/Header";
import ImageUploader from "@/components/ImageUploader";
import TokenCard from "@/components/TokenCard";
import { Button } from "@/components/ui/button";
import { WalletProvider, useWallet } from "@/context/WalletContext";
import { mintToken } from "@/lib/wallet";
import { toast } from "sonner";

const MainApp = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [mintingStatus, setMintingStatus] = useState<"idle" | "minting" | "minted">("idle");
  const [mintData, setMintData] = useState<{ hash: string; tokenId: string } | null>(null);
  const { wallet } = useWallet();

  const handleImageUpload = (imageData: string) => {
    setUploadedImage(imageData);
    setMintingStatus("idle");
    setMintData(null);
  };

  const handleMint = async () => {
    if (!wallet?.isConnected || !uploadedImage) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setMintingStatus("minting");
    try {
      toast.info("Preparing to mint your NFT on Base Mainnet...");
      const result = await mintToken(uploadedImage);
      if (result) {
        setMintData(result);
        setMintingStatus("minted");
        toast.success(`Successfully minted token #${result.tokenId} on Base Mainnet!`);
      } else {
        setMintingStatus("idle");
        toast.error("Minting failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Minting error:", error);
      setMintingStatus("idle");
      toast.error(`Error during minting: ${error.message || "Unknown error"}`);
    }
  };

  const resetAll = () => {
    setUploadedImage(null);
    setMintingStatus("idle");
    setMintData(null);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-brand-light via-primary to-accent">
            justCOINit
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Turn your social media posts into tokens instantly on Base Mainnet.
            Just upload a screenshot and mint!
          </p>
        </div>

        {mintingStatus === "minted" && mintData ? (
          <div className="w-full max-w-lg mx-auto space-y-6">
            <TokenCard 
              imageUrl={uploadedImage!} 
              tokenId={mintData.tokenId} 
              txHash={mintData.hash} 
            />
            
            <div className="flex justify-center">
              <Button onClick={resetAll} variant="outline">
                Mint Another Post
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg space-y-6">
            {uploadedImage ? (
              <div className="space-y-4">
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-border">
                  <img src={uploadedImage} alt="Upload preview" className="object-cover w-full h-full" />
                </div>
                
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={resetAll}>
                    Change Image
                  </Button>
                  <Button 
                    onClick={handleMint} 
                    disabled={mintingStatus === "minting" || !wallet?.isConnected}
                    className={`wallet-button ${mintingStatus === "minting" ? "animate-pulse" : ""}`}
                  >
                    {!wallet?.isConnected
                      ? "Connect Wallet to Mint"
                      : mintingStatus === "minting"
                      ? "Minting on Base..."
                      : "Mint as Token (0.001 ETH)"}
                  </Button>
                </div>
                {mintingStatus === "minting" && (
                  <p className="text-sm text-center text-muted-foreground">
                    Please confirm the transaction in your wallet and wait for it to be mined on Base Mainnet...
                  </p>
                )}
              </div>
            ) : (
              <ImageUploader onImageUploaded={handleImageUpload} />
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-secondary/30 rounded-lg text-sm text-center max-w-lg mx-auto">
          <p className="text-muted-foreground">
            This app mints real NFTs on Base Mainnet. You will need Base ETH to cover gas fees and the 0.001 ETH minting cost.
          </p>
        </div>
      </div>
    </main>
  );
};

const Index = () => {
  return (
    <WalletProvider>
      <MainApp />
    </WalletProvider>
  );
};

export default Index;
