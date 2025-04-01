import { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface SubscriptionCheckoutProps {
  onSuccess?: () => void;
}

export function SubscriptionCheckout({ onSuccess }: SubscriptionCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const { getToken } = useAuth();

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }

      onSuccess?.();
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to start subscription process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Upgrade to Pro</CardTitle>
        <CardDescription>
          Get unlimited room redesigns and save your projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Pro Features</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Unlimited room redesigns</li>
              <li>• Save and manage your projects</li>
              <li>• Priority support</li>
              <li>• Early access to new features</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Pricing</h3>
            <p className="text-2xl font-bold">$14.99<span className="text-sm text-muted-foreground">/month</span></p>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Subscribe Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 