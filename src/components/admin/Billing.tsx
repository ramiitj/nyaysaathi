import { CreditCard, Check, Zap, MessageSquare, FileText, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Billing = () => {
  const currentPlan = {
    name: "Professional",
    price: "₹2,999",
    period: "month",
    features: [
      "Unlimited consultations",
      "All 12 languages",
      "Priority support",
      "Custom branding",
      "Advanced analytics",
    ],
  };

  const usage = [
    { name: "API Calls", used: 8547, limit: 10000, icon: Zap },
    { name: "Conversations", used: 1247, limit: 2000, icon: MessageSquare },
    { name: "Documents", used: 156, limit: 500, icon: FileText },
    { name: "Storage", used: 2.4, limit: 5, unit: "GB", icon: FileText },
  ];

  const plans = [
    {
      name: "Starter",
      price: "₹999",
      features: ["500 consultations/month", "3 languages", "Email support", "Basic analytics"],
      current: false,
    },
    {
      name: "Professional",
      price: "₹2,999",
      features: ["Unlimited consultations", "All 12 languages", "Priority support", "Custom branding", "Advanced analytics"],
      current: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: ["Everything in Pro", "Dedicated support", "Custom integrations", "SLA guarantee", "On-premise option"],
      current: false,
    },
  ];

  const paymentHistory = [
    { date: "1 Dec 2024", amount: "₹2,999", status: "Paid", invoice: "INV-2024-012" },
    { date: "1 Nov 2024", amount: "₹2,999", status: "Paid", invoice: "INV-2024-011" },
    { date: "1 Oct 2024", amount: "₹2,999", status: "Paid", invoice: "INV-2024-010" },
    { date: "1 Sep 2024", amount: "₹2,999", status: "Paid", invoice: "INV-2024-009" },
  ];

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
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Clock className="h-4 w-4" />
            Next billing: 1 Jan 2025
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
          <CardTitle>Usage This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {usage.map((item) => {
              const percentage = (item.used / item.limit) * 100;
              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.used}{item.unit || ""} / {item.limit}{item.unit || ""}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
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

      {/* Payment History */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment.invoice}>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell className="font-medium">{payment.amount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="link" className="p-0 h-auto text-primary">
                      {payment.invoice}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
