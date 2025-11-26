import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionPlanType, SubscriptionPlan, UserSubscription, SubscriptionCheckResult } from '@/types/subscription';

const SubscriptionPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionCheckResult | null>(null);
  const [updatingPlan, setUpdatingPlan] = useState<SubscriptionPlanType | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchSubscriptionData = async () => {
      try {
        setLoading(true);
        const checkUserSubscription = httpsCallable<void, SubscriptionCheckResult>(
          functions, 
          'checkUserSubscription'
        );
        
        const result = await checkUserSubscription();
        setSubscriptionData(result.data);
      } catch (error) {
        toast.error('Failed to load subscription information');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [currentUser, navigate]);

  const handleUpdatePlan = async (planId: SubscriptionPlanType) => {
    if (!currentUser) return;
    
    try {
      setUpdatingPlan(planId);
      
      if (planId === SubscriptionPlanType.PREMIUM || planId === SubscriptionPlanType.BASIC) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      const updateSubscription = httpsCallable<{ planId: SubscriptionPlanType }, { success: boolean, message: string }>(
        functions, 
        'updateSubscription'
      );
      
      const result = await updateSubscription({ planId });
      
      if (result.data.success) {
        toast.success(`Successfully updated to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan`);
        
        const checkUserSubscription = httpsCallable<void, SubscriptionCheckResult>(
          functions, 
          'checkUserSubscription'
        );
        
        const updatedData = await checkUserSubscription();
        setSubscriptionData(updatedData.data);
      } else {
        toast.error(result.data.message || 'Failed to update subscription');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update subscription';
      toast.error(errorMessage);
    } finally {
      setUpdatingPlan(null);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading subscription information...</p>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="mt-4 text-lg">Failed to load subscription information</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const { subscription, plans } = subscriptionData;
  const currentPlan = subscription ? plans[subscription.planId] : plans[SubscriptionPlanType.FREE];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>
      
      {/* Current Subscription */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Current Plan</h2>
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">{currentPlan.name} Plan</CardTitle>
                <CardDescription>
                  {subscription?.status === 'active' ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 mt-2">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 mt-2">
                      {subscription?.status || 'Inactive'}
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${currentPlan.price}<span className="text-sm font-normal">/month</span></p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Plan Details</h3>
                <ul className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {subscription && (
                <div>
                  <h3 className="font-medium mb-2">Usage</h3>
                  <div className="space-y-2">
                    <p>Generations used: <span className="font-semibold">{subscription.generationsUsed} / {currentPlan.generationsPerMonth}</span></p>
                    <p>Renewal date: <span className="font-semibold">{formatDate(subscription.endDate?.toDate())}</span></p>
                    <p>Started on: <span className="font-semibold">{formatDate(subscription.startDate?.toDate())}</span></p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(plans).map((plan) => (
            <Card 
              key={plan.id} 
              className={`${subscription?.planId === plan.id ? 'border-2 border-primary' : ''}`}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <p className="text-2xl font-bold mt-2">${plan.price}<span className="text-sm font-normal">/month</span></p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={subscription?.planId === plan.id ? "outline" : "default"}
                  disabled={updatingPlan !== null || subscription?.planId === plan.id}
                  onClick={() => handleUpdatePlan(plan.id as SubscriptionPlanType)}
                >
                  {updatingPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : subscription?.planId === plan.id ? (
                    'Current Plan'
                  ) : (
                    `Switch to ${plan.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
