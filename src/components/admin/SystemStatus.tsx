import { useState, useEffect } from "react";
import { MessageSquare, BarChart3, FileText, Globe, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  total_consultations: number;
  active_today: number;
  documents_uploaded: number;
  languages_used: number;
}

interface RecentActivity {
  language: string;
  message_count: number;
  created_at: string;
}

const SystemStatus = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [serviceStatus, setServiceStatus] = useState<{ name: string; status: string; checking: boolean }[]>([
    { name: "Database Connection", status: "Checking...", checking: true },
    { name: "Gemini API", status: "Checking...", checking: true },
    { name: "Text-to-Speech", status: "Checking...", checking: true },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
    checkServiceHealth();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      
      if (error) throw error;
      
      if (data) {
        setStats(data as unknown as DashboardStats);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('language, message_count, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      if (data) {
        setRecentActivity(data.map(item => ({
          language: item.language || 'Unknown',
          message_count: item.message_count || 0,
          created_at: item.created_at || ''
        })));
      }
    } catch (err) {
      console.error('Error fetching recent activity:', err);
    }
  };

  const checkServiceHealth = async () => {
    // Check Database
    try {
      const { error } = await supabase.from('system_settings').select('id').limit(1);
      setServiceStatus(prev => prev.map(s => 
        s.name === "Database Connection" 
          ? { ...s, status: error ? "Error" : "Operational", checking: false }
          : s
      ));
    } catch {
      setServiceStatus(prev => prev.map(s => 
        s.name === "Database Connection" ? { ...s, status: "Error", checking: false } : s
      ));
    }

    // Check Gemini API (via legal-chat function)
    try {
      const { error } = await supabase.functions.invoke('legal-chat', {
        body: { message: 'health check', language: 'en', conversationId: 'health-check' }
      });
      setServiceStatus(prev => prev.map(s => 
        s.name === "Gemini API" 
          ? { ...s, status: error ? "Error" : "Operational", checking: false }
          : s
      ));
    } catch {
      setServiceStatus(prev => prev.map(s => 
        s.name === "Gemini API" ? { ...s, status: "Error", checking: false } : s
      ));
    }

    // Check TTS
    try {
      const { error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: 'test', language: 'en' }
      });
      setServiceStatus(prev => prev.map(s => 
        s.name === "Text-to-Speech" 
          ? { ...s, status: error ? "Error" : "Operational", checking: false }
          : s
      ));
    } catch {
      setServiceStatus(prev => prev.map(s => 
        s.name === "Text-to-Speech" ? { ...s, status: "Error", checking: false } : s
      ));
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const statsDisplay = [
    { 
      label: "Total Consultations", 
      value: isLoading ? "..." : (stats?.total_consultations || 0).toLocaleString(), 
      icon: MessageSquare, 
      color: "bg-primary" 
    },
    { 
      label: "Active Today", 
      value: isLoading ? "..." : (stats?.active_today || 0).toString(), 
      icon: BarChart3, 
      color: "bg-green-500" 
    },
    { 
      label: "Documents Processed", 
      value: isLoading ? "..." : (stats?.documents_uploaded || 0).toString(), 
      icon: FileText, 
      color: "bg-amber-500" 
    },
    { 
      label: "Languages Used", 
      value: isLoading ? "..." : (stats?.languages_used || 0).toString(), 
      icon: Globe, 
      color: "bg-purple-500" 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsDisplay.map((stat) => (
          <Card key={stat.label} className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Service Status */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {serviceStatus.map((service) => (
              <div key={service.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{service.name}</span>
                {service.checking ? (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking...
                  </span>
                ) : (
                  <span className={`flex items-center gap-2 text-sm ${
                    service.status === "Operational" ? "text-green-600" : "text-red-600"
                  }`}>
                    {service.status === "Operational" ? (
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {service.status}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.language}</p>
                      <p className="text-xs text-muted-foreground">{activity.message_count} messages</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemStatus;
