import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/lib/userContext";
import { useEntitlements } from "@/lib/entitlementsContext";
import { getStripeProducts, createCheckoutSession, createPortalSession, type StripeProduct } from "@/lib/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Crown, Star, ArrowLeft } from "lucide-react";

export default function SubscriptionPage() {
  const { user } = useUser();
  const { tier, subscription, refetch } = useEntitlements();
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { products } = await getStripeProducts();
      setProducts(products);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string, productTier: string) => {
    if (!user) return;
    
    setCheckoutLoading(priceId);
    try {
      const { url } = await createCheckoutSession(user.id, priceId, productTier);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    try {
      const { url } = await createPortalSession(user.id);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    }
  };

  const getProductTier = (product: StripeProduct): string => {
    return product.metadata?.tier || 'supporter';
  };

  const getProductFeatures = (product: StripeProduct): string[] => {
    const tier = getProductTier(product);
    if (tier === 'coach') {
      return [
        "Full StatTracker access",
        "PlayMaker editing",
        "View all individual stats",
        "Roster promotion tools",
        "All team highlights"
      ];
    }
    return [
      "Upload highlights for your athlete",
      "View individual stats",
      "Track your own stats",
      "Follow athletes across teams",
      "Full HYPE card features"
    ];
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-title">Upgrade Your Experience</h1>
          <p className="text-muted-foreground" data-testid="text-subtitle">
            Unlock premium features and get the most out of STATFYR
          </p>
        </div>

        {subscription && subscription.status === 'active' && (
          <Card className="mb-8 border-primary" data-testid="card-current-subscription">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Current Plan
                </CardTitle>
                <Badge variant="default">{tier === 'coach' ? 'Coach Pro' : 'Supporter Pro'}</Badge>
              </div>
              <CardDescription>
                Your subscription renews on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" onClick={handleManageSubscription} data-testid="button-manage">
                Manage Subscription
              </Button>
            </CardFooter>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {products.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No subscription plans available at this time.
                </CardContent>
              </Card>
            ) : (
              products.map((product) => {
                const productTier = getProductTier(product);
                const features = getProductFeatures(product);
                const price = product.prices[0];
                const isCurrentPlan = tier === productTier && subscription?.status === 'active';
                
                return (
                  <Card 
                    key={product.id} 
                    className={`relative ${isCurrentPlan ? 'border-primary border-2' : ''}`}
                    data-testid={`card-product-${product.id}`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary">Current Plan</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {productTier === 'coach' ? (
                          <Crown className="w-6 h-6 text-yellow-500" />
                        ) : (
                          <Star className="w-6 h-6 text-purple-500" />
                        )}
                        <CardTitle>{product.name}</CardTitle>
                      </div>
                      <CardDescription>{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {price && (
                        <div className="mb-4">
                          <span className="text-3xl font-bold">
                            ${(price.unit_amount / 100).toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      )}
                      <ul className="space-y-2">
                        {features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {isCurrentPlan ? (
                        <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => price && handleSubscribe(price.id, productTier)}
                          disabled={checkoutLoading === price?.id || !price}
                          data-testid={`button-subscribe-${product.id}`}
                        >
                          {checkoutLoading === price?.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Subscribe Now'
                          )}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        )}

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Questions about pricing? Contact us at support@statfyr.com</p>
        </div>
      </div>
    </div>
  );
}
