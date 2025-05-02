
import { ethers } from "ethers";
import { toast } from "sonner";

// This simulates loading from env variables, which would be set in Supabase
// In a production app, this would come from environment variables
const PAYMASTER_API_KEY = "demo-api-key"; // This would be loaded from env in production
const PAYMASTER_API_URL = "https://paymaster.base.org"; // Base paymaster API endpoint

/**
 * Sponsors a transaction using the Base paymaster
 * @param transaction The transaction to sponsor
 * @returns The sponsored transaction or null if sponsoring failed
 */
export const sponsorTransaction = async (
  transaction: ethers.providers.TransactionRequest
): Promise<ethers.providers.TransactionRequest | null> => {
  try {
    console.log("Requesting gas sponsorship for transaction:", transaction);

    // In a real implementation, we would call the Base paymaster API
    // For demonstration purposes, we'll simulate the API call
    const response = await fetch(`${PAYMASTER_API_URL}/sponsor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYMASTER_API_KEY}`
      },
      body: JSON.stringify({
        chainId: transaction.chainId,
        from: transaction.from,
        to: transaction.to,
        data: transaction.data,
        value: transaction.value?.toString() || "0",
      })
    }).catch(error => {
      console.error("Paymaster API error:", error);
      return null;
    });

    if (!response) {
      console.error("No response from paymaster API");
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.sponsoredTransaction) {
      console.log("Transaction successfully sponsored:", result.sponsoredTransaction);
      
      // The paymaster would return a modified transaction that includes the gas payment
      const sponsoredTx = {
        ...transaction,
        gasPrice: result.sponsoredTransaction.gasPrice || transaction.gasPrice,
        maxFeePerGas: result.sponsoredTransaction.maxFeePerGas || transaction.maxFeePerGas,
        maxPriorityFeePerGas: result.sponsoredTransaction.maxPriorityFeePerGas || transaction.maxPriorityFeePerGas,
        // In a real paymaster implementation, there might be additional fields
      };
      
      return sponsoredTx;
    } else {
      console.error("Failed to sponsor transaction:", result.error || "Unknown error");
      return null;
    }
  } catch (error) {
    console.error("Error in sponsorTransaction:", error);
    return null;
  }
};

/**
 * Checks if the current user is eligible for sponsored transactions
 * In a real implementation, this might check user criteria, quotas, etc.
 */
export const isEligibleForSponsoring = async (userAddress: string): Promise<boolean> => {
  try {
    // In a real implementation, we would check if the user is eligible
    // For demonstration purposes, we'll simulate this check
    const response = await fetch(`${PAYMASTER_API_URL}/eligibility`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYMASTER_API_KEY}`
      },
      body: JSON.stringify({
        userAddress
      })
    }).catch(() => null);

    // If API call fails, default to not eligible
    if (!response) return false;

    const result = await response.json();
    return result.eligible || false;
  } catch (error) {
    console.error("Error checking sponsoring eligibility:", error);
    return false;
  }
};

/**
 * Wrapper function to execute a transaction with gas sponsorship if eligible
 * If not eligible or if sponsoring fails, falls back to regular transaction
 */
export const executeWithSponsoredGas = async (
  performTransaction: (sponsored: boolean) => Promise<any>,
  userAddress: string
): Promise<any> => {
  try {
    // Check if user is eligible for sponsored gas
    const isEligible = await isEligibleForSponsoring(userAddress);
    
    if (isEligible) {
      toast.info("Your transaction will be gas-sponsored!");
      return await performTransaction(true);
    } else {
      // If not eligible, fall back to regular transaction
      console.log("User not eligible for sponsored gas, using regular transaction");
      return await performTransaction(false);
    }
  } catch (error) {
    console.error("Error in executeWithSponsoredGas:", error);
    // If sponsoring fails, fall back to regular transaction
    return await performTransaction(false);
  }
};
