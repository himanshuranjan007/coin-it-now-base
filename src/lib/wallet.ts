
import { toast } from "sonner";
import { ethers } from "ethers";
import JustCoinItNFTArtifact from "../contracts/JustCoinItNFT.json";
import { executeWithSponsoredGas, sponsorTransaction } from "./paymaster";

export type WalletInfo = {
  address: string;
  shortAddress: string;
  isConnected: boolean;
};

// Updated to a real Base Mainnet NFT contract address
// This is the address where we've deployed our JustCoinItNFT contract
const CONTRACT_ADDRESS = "0x5CfCb3C45ae620EE3140e07779eB98F124841465"; 
const NFT_CONTRACT_ABI = JustCoinItNFTArtifact.abi;

// Connect to wallet using Web3 provider
export const connectWallet = async (): Promise<WalletInfo | null> => {
  try {
    if (!window.ethereum) {
      toast.error("Web3 wallet not found. Please install MetaMask or use a compatible wallet.");
      return null;
    }

    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (accounts.length === 0) {
      toast.error("No accounts found. Please check your wallet and try again.");
      return null;
    }
    
    const address = accounts[0];
    const shortAddress = `${address.substring(0, 6)}...${address.substring(38)}`;
    
    // Check if connected to Base Mainnet (chainId: 8453)
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId !== '0x2105') { // 0x2105 = 8453 in hex
      toast.warning("Please switch to Base Mainnet in your wallet");
      
      try {
        // Try to switch to Base Mainnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }],
        });
      } catch (switchError: any) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x2105',
                  chainName: 'Base Mainnet',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org'],
                },
              ],
            });
          } catch (addError) {
            console.error("Failed to add Base network:", addError);
          }
        }
      }
    }
    
    toast.success("Wallet connected successfully!");
    
    return {
      address,
      shortAddress,
      isConnected: true
    };
  } catch (error) {
    console.error("Error connecting wallet:", error);
    toast.error("Failed to connect wallet. Please try again.");
    return null;
  }
};

export const disconnectWallet = async (): Promise<void> => {
  // Currently, there's no standard method to disconnect in Web3
  // We just clear the state on our end
  toast.info("Wallet disconnected");
};

// Function to upload image to IPFS using NFT.Storage
const uploadToIPFS = async (imageData: string): Promise<string> => {
  // In a real implementation, we would use NFT.Storage or Pinata
  // For this demo, we'll simulate IPFS upload with a delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return a fake IPFS hash
  const randomHash = `ipfs://QmRandom${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
  return randomHash;
};

// Function to create NFT metadata
const createNFTMetadata = async (imageUrl: string): Promise<string> => {
  // In a production app, we would create and pin JSON metadata to IPFS
  // For this demo, we'll simulate metadata creation
  const ipfsImageUrl = await uploadToIPFS(imageUrl);
  
  const metadata = {
    name: "JustCoinIt Social Post",
    description: "A social media post minted as an NFT on Base Mainnet",
    image: ipfsImageUrl,
    attributes: [
      {
        trait_type: "Platform",
        value: "JustCoinIt"
      },
      {
        trait_type: "Creation Date",
        value: new Date().toISOString()
      }
    ]
  };
  
  // In production, we would upload this JSON to IPFS
  // For now, we'll just return a simulated IPFS URI
  return `ipfs://Qm${Math.random().toString(36).substring(2, 15)}`;
};

export const mintToken = async (imageUrl: string): Promise<{hash: string, tokenId: string} | null> => {
  try {
    if (!window.ethereum) {
      toast.error("Web3 wallet not found. Please install MetaMask or use a compatible wallet.");
      return null;
    }
    
    // Create metadata for the NFT
    const tokenURI = await createNFTMetadata(imageUrl);
    toast.info("Preparing your NFT metadata...");
    
    // Get web3 provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    
    // Create contract instance
    const nftContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      NFT_CONTRACT_ABI,
      signer
    );
    
    // Get mint price from contract
    let mintPrice;
    try {
      mintPrice = await nftContract.mintPrice();
      console.log("Mint price retrieved:", mintPrice.toString());
    } catch (error) {
      console.error("Error getting mint price:", error);
      mintPrice = ethers.utils.parseEther("0.001");
      console.log("Using fallback mint price:", mintPrice.toString());
    }
    
    // Define the transaction function that will be called with or without gas sponsoring
    const performMintTransaction = async (sponsored: boolean) => {
      // First estimate gas for the transaction
      const mintTxEstimate = await nftContract.estimateGas.mintToken(tokenURI, { 
        value: mintPrice
      }).catch(error => {
        console.error("Error estimating gas:", error);
        return ethers.BigNumber.from(500000); // Fallback gas limit
      });

      console.log("Estimated gas:", mintTxEstimate.toString());

      // Prepare transaction parameters
      const mintTxParams = { 
        value: mintPrice,
        gasLimit: mintTxEstimate.mul(120).div(100) // Add 20% buffer to estimated gas
      };

      // If sponsoring is enabled and the user is eligible, try to sponsor the transaction
      if (sponsored) {
        // Create a transaction object first (without sending it)
        const unsignedTx = await nftContract.populateTransaction.mintToken(tokenURI, mintTxParams);
        
        // Get the current nonce for the user
        const nonce = await provider.getTransactionCount(userAddress);
        const chainId = (await provider.getNetwork()).chainId;
        
        // Complete transaction object with necessary fields
        const txRequest = {
          ...unsignedTx,
          nonce,
          from: userAddress,
          chainId,
          gasLimit: mintTxParams.gasLimit,
        };
        
        // Try to sponsor the transaction through the paymaster
        const sponsoredTx = await sponsorTransaction(txRequest);
        
        if (sponsoredTx) {
          toast.info("Transaction gas is sponsored! No gas fees for you.");
          
          // Send the sponsored transaction
          const tx = await signer.sendTransaction(sponsoredTx);
          return tx;
        } else {
          // If sponsoring fails, fall back to regular transaction
          toast.info("Gas sponsoring unavailable. Proceeding with regular transaction.");
          const tx = await nftContract.mintToken(tokenURI, mintTxParams);
          return tx;
        }
      } else {
        // Regular non-sponsored transaction
        toast.info("Confirm the transaction in your wallet");
        const tx = await nftContract.mintToken(tokenURI, mintTxParams);
        return tx;
      }
    };
    
    // Execute the transaction with gas sponsoring if possible
    toast.info("Preparing your transaction...");
    const tx = await executeWithSponsoredGas(performMintTransaction, userAddress);
    
    // Wait for transaction to be mined
    toast.info("Minting your token on Base Mainnet...");
    const receipt = await tx.wait();
    
    // Find the TokenMinted event in the transaction logs
    let tokenId = "0";
    try {
      const event = receipt.events?.find(e => e.event === 'TokenMinted');
      tokenId = event?.args?.tokenId.toString() || "0";
    } catch (error) {
      console.error("Error parsing event logs:", error);
      // Fallback if we can't parse the event
      tokenId = "Unknown";
    }
    
    toast.success("Token minted successfully on Base Mainnet!");
    
    return {
      hash: receipt.transactionHash,
      tokenId
    };
  } catch (error: any) {
    console.error("Error minting token:", error);
    
    if (error.code === 4001) {
      toast.error("Transaction was rejected by the user");
    } else if (error.message && error.message.includes("CALL_EXCEPTION")) {
      toast.error("Failed to mint: Contract call error. Please ensure you have enough ETH for gas and mint price.");
    } else {
      toast.error(`Failed to mint token: ${error.message || "Unknown error"}`);
    }
    
    return null;
  }
};

// Add typings for window object
declare global {
  interface Window {
    ethereum?: any;
  }
}
