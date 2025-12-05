import { useState, useEffect } from "react";
import { CreditCard, Check, Zap, MessageSquare, FileText, Clock, Loader2, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface UsageMetrics {
  conversations: number;
  documents: number;
  embeddings: number;
  visitors: number;
}

const Billing = () => {
  const [usage, setUsage] = useState<UsageMetrics>({
    conversations: 0,
    documents: 0,
    embeddings: 0,
    visitors: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      // Get conversation count
      const { count: convCount } = await supabase
        .from('conversations')
        .select('id', { count: 'exact' });

      // Get document count
      const { count: docCount } = await supabase
        .from('documents')
        .select('id', { count: 'exact' });

      // Get embeddings count
      const { count: embCount } = await supabase
        .from('document_embeddings')
        .select('id', { count: 'exact' });

      // Get visitor count
      const { count: visitorCount } = await supabase
        .from('user_visitors')
        .select('id', { count: 'exact' });

      setUsage({
        conversations: convCount || 0,
        documents: docCount || 0,
        embeddings: embCount || 0,
        visitors: visitorCount || 0,
      });
    } catch (err) {
      console.error('Error fetching usage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlan = {
    name: "Free Tier",
    price: "₹0",
    period: "month",
    features: [
      "Unlimited consultations",
      "All 12 languages",
      "Knowledge Base (5 documents)",
      "Basic analytics",
      "Community support",
    ],
  };

  const usageMetrics = [
    { name: "Conversations", used: usage.conversations, limit: "Unlimited", icon: MessageSquare, percentage: null },
    { name: "Documents", used: usage.documents, limit: 5, icon: FileText, percentage: (usage.documents / 5) * 100 },
    { name: "Embeddings", used: usage.embeddings, limit: 1000, icon: Database, percentage: (usage.embeddings / 1000) * 100 },
    { name: "Visitors", used: usage.visitors, limit: "Unlimited", icon: Zap, percentage: null },
  ];

  const plans = [
    {
      name: "Free",
      price: "₹0",
      features: ["Unlimited conversations", "5 KB documents", "1K embeddings", "Basic analytics"],
      current: true,
    },
    {
      name: "Professional",
      price: "₹2,999",
      features: ["Everything in Free", "50 KB documents", "50K embeddings", "Advanced analytics", "Priority support"],
      current: false,
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: ["Everything in Pro", "Unlimited documents", "Custom integrations", "SLA guarantee", "Dedicated support"],
      current: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="bg-white border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Current Plan
              </CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </div>
            <Badge className="bg-primary">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-3xl font-bold">{currentPlan.price}</span>
            <span className="text-muted-foreground">/{currentPlan.period}</span>
          </div>
          <ul className="space-y-2">
            {currentPlan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {usageMetrics.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.used.toLocaleString()} / {typeof item.limit === 'number' ? item.limit.toLocaleString() : item.limit}
                  </span>
                </div>
                {item.percentage !== null && (
                  <Progress value={Math.min(item.percentage, 100)} className="h-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Choose the plan that best fits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`border rounded-lg p-4 ${plan.current ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold mb-4">
                  {plan.price}
                  {plan.price !== "Custom" && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                </p>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plan.current ? "outline" : "default"} 
                  className="w-full"
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : plan.price === "Custom" ? "Contact Sales" : "Upgrade"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This is a development instance running on Lovable Cloud. 
            For production deployments with higher limits, please contact the Nyay Saathi team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
