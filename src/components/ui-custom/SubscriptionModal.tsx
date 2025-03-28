
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: () => void;
}

const SubscriptionModal = ({
  open,
  onOpenChange,
  onSubscribe,
}: SubscriptionModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Upgrade to BudgetFlip Pro</DialogTitle>
          <DialogDescription className="text-center">
            Get unlimited room flips and more features
          </DialogDescription>
        </DialogHeader>
        
        <div className="border rounded-lg p-4 bg-gradient-to-br from-budget-teal/5 to-budget-teal/10">
          <div className="text-center mb-4">
            <div className="inline-block bg-white rounded-full px-3 py-1 text-xs font-medium text-budget-teal border border-budget-teal/20">
              MOST POPULAR
            </div>
          </div>
          
          <div className="text-center mb-4">
            <span className="text-3xl font-bold">$4.99</span>
            <span className="text-muted-foreground">/week</span>
          </div>
          
          <div className="space-y-2 mb-6">
            {[
              "Unlimited room designs",
              "Unlimited projects",
              "Advanced cost estimation",
              "DIY guides with detailed steps",
              "Priority support",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-budget-teal flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-center text-muted-foreground mb-4">
            3-day free trial, cancel anytime
          </div>
        </div>
        
        <DialogFooter className="flex flex-col gap-2 sm:gap-0">
          <Button onClick={onSubscribe} className="w-full">
            Start 3-Day Free Trial
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;
