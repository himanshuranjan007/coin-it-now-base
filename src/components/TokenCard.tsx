
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { toast } from "sonner";

interface TokenCardProps {
  imageUrl: string;
  tokenId: string;
  txHash: string;
}

const TokenCard: React.FC<TokenCardProps> = ({ imageUrl, tokenId, txHash }) => {
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  const shortHash = `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 6)}`;

  return (
    <Card className="overflow-hidden animated-border card-gradient">
      <CardHeader className="p-0">
        <div className="relative w-full h-64 overflow-hidden">
          <img
            src={imageUrl}
            alt="Minted content"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono">
            Token #{tokenId}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-2">Your post is now a token!</h3>
        <p className="text-muted-foreground text-sm">
          Successfully minted on Base Mainnet
        </p>
      </CardContent>
      <CardFooter className="bg-secondary/50 px-6 py-3 flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="text-xs font-mono overflow-hidden text-ellipsis max-w-[200px]">
          {shortHash}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs border-accent/30 hover:border-accent/60 hover:bg-accent/10"
            onClick={() => copyToClipboard(txHash, "Transaction hash")}
          >
            <Link className="h-3 w-3 mr-1" />
            Copy Tx
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => window.open(`https://basescan.org/tx/${txHash}`, '_blank')}
          >
            View on Basescan
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TokenCard;
