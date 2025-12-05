import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Activity, BookOpen, MessageSquare, Settings, Palette, BarChart3, CreditCard, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminRoute from "@/components/AdminRoute";
import SystemStatus from "@/components/admin/SystemStatus";
import KnowledgeBase from "@/components/admin/KnowledgeBase";
import Conversations from "@/components/admin/Conversations";
import SystemBehavior from "@/components/admin/SystemBehavior";
import Branding from "@/components/admin/Branding";
import Analytics from "@/components/admin/Analytics";
import Billing from "@/components/admin/Billing";

const AdminContent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("status");

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Nyay Saathi</p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </header>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white border-b border-border overflow-x-auto">
          <TabsList className="h-auto p-0 bg-transparent rounded-none w-full justify-start">
            <TabsTrigger 
              value="status" 
              className="gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Activity className="h-4 w-4" />
              System Status
            </TabsTrigger>
            <TabsTrigger 
              value="knowledge" 
              className="gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <BookOpen className="h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger 
              value="conversations" 
              className="gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <MessageSquare className="h-4 w-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger 
              value="behavior" 
              className="gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Settings className="h-4 w-4" />
              System Behavior
            </TabsTrigger>
            <TabsTrigger 
              value="branding" 
              className="gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className="gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <TabsContent value="status" className="mt-0">
            <SystemStatus />
          </TabsContent>
          <TabsContent value="knowledge" className="mt-0">
            <KnowledgeBase />
          </TabsContent>
          <TabsContent value="conversations" className="mt-0">
            <Conversations />
          </TabsContent>
          <TabsContent value="behavior" className="mt-0">
            <SystemBehavior />
          </TabsContent>
          <TabsContent value="branding" className="mt-0">
            <Branding />
          </TabsContent>
          <TabsContent value="analytics" className="mt-0">
            <Analytics />
          </TabsContent>
          <TabsContent value="billing" className="mt-0">
            <Billing />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

const Admin = () => {
  return (
    <AdminRoute>
      <AdminContent />
    </AdminRoute>
  );
};

export default Admin;
