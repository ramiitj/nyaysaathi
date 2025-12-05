import { useEffect, useState } from "react";
import { Download, MessageSquare, Users, Clock, TrendingUp, MapPin, UserPlus, RefreshCw, Globe, Monitor, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalyticsData {
  language_distribution: { name: string; value: number }[];
  domain_distribution: { name: string; value: number }[];
  daily_consultations: { day: string; consultations: number }[];
  state_distribution: { state: string; users: number }[];
}

const Analytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConsultations: 0,
    totalVisitors: 0,
    newVisitors: 0,
    returningVisitors: 0,
    avgVisits: 0,
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    language_distribution: [],
    domain_distribution: [],
    daily_consultations: [],
    state_distribution: [],
  });
  const [deviceBreakdown, setDeviceBreakdown] = useState<{ name: string; value: number; color: string }[]>([]);
  const [browserBreakdown, setBrowserBreakdown] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchStats(),
      fetchAnalyticsData(),
      fetchVisitorData(),
    ]);
    setIsLoading(false);
  };

  const fetchStats = async () => {
    try {
      // Get conversation count
      const { count: convCount } = await supabase
        .from('conversations')
        .select('id', { count: 'exact' });

      // Get visitor stats
      const { data: visitors } = await supabase
        .from('user_visitors')
        .select('visit_count');

      if (visitors) {
        const total = visitors.length;
        const newUsers = visitors.filter(v => v.visit_count === 1).length;
        const returning = total - newUsers;
        const avgVisits = total > 0 
          ? visitors.reduce((sum, v) => sum + (v.visit_count || 0), 0) / total 
          : 0;

        setStats({
          totalConsultations: convCount || 0,
          totalVisitors: total,
          newVisitors: newUsers,
          returningVisitors: returning,
          avgVisits: Math.round(avgVisits * 10) / 10,
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_analytics_data', { days_back: 30 });

      if (error) throw error;

      if (data) {
        const parsed = data as unknown as AnalyticsData;
        setAnalyticsData({
          language_distribution: parsed.language_distribution || [],
          domain_distribution: parsed.domain_distribution || [],
          daily_consultations: parsed.daily_consultations || [],
          state_distribution: parsed.state_distribution || [],
        });
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    }
  };

  const fetchVisitorData = async () => {
    try {
      const { data: visitors, error } = await supabase
        .from('user_visitors')
        .select('device_info');
      
      if (error) throw error;

      if (visitors) {
        const deviceCounts: Record<string, number> = {};
        const browserCounts: Record<string, number> = {};
        
        visitors.forEach(v => {
          const deviceInfo = v.device_info as { os?: string; browser?: string } | null;
          if (deviceInfo) {
            const os = deviceInfo.os || 'Unknown';
            const browser = deviceInfo.browser || 'Unknown';
            deviceCounts[os] = (deviceCounts[os] || 0) + 1;
            browserCounts[browser] = (browserCounts[browser] || 0) + 1;
          }
        });

        const colors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'];
        setDeviceBreakdown(
          Object.entries(deviceCounts)
            .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
        );

        setBrowserBreakdown(
          Object.entries(browserCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
        );
      }
    } catch (err) {
      console.error('Error fetching visitor data:', err);
    }
  };

  const exportCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Consultations', stats.totalConsultations],
      ['Total Visitors', stats.totalVisitors],
      ['New Visitors', stats.newVisitors],
      ['Returning Visitors', stats.returningVisitors],
      ['Avg Visits per User', stats.avgVisits],
      [''],
      ['Language Distribution'],
      ...analyticsData.language_distribution.map(l => [l.name, l.value]),
      [''],
      ['Legal Domain Distribution'],
      ...analyticsData.domain_distribution.map(d => [d.name, d.value]),
      [''],
      ['Geographic Distribution'],
      ...analyticsData.state_distribution.map(s => [s.state, s.users]),
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Analytics exported');
  };

  const languageColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'];

  const statsDisplay = [
    { label: "Total Consultations", value: stats.totalConsultations.toLocaleString(), icon: MessageSquare },
    { label: "Unique Visitors", value: stats.totalVisitors.toString(), icon: Users },
    { label: "New Visitors", value: stats.newVisitors.toString(), icon: UserPlus },
    { label: "Returning Visitors", value: stats.returningVisitors.toString(), icon: RefreshCw },
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
      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2" onClick={exportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsDisplay.map((stat) => (
          <Card key={stat.label} className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visitor Insights Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Device Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceBreakdown.length > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {deviceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {deviceBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name} ({item.value})
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No visitor data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Browser Distribution */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Browser Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {browserBreakdown.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={browserBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No browser data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Language Usage Pie Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">Language Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.language_distribution.length > 0 ? (
              <>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.language_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {analyticsData.language_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={languageColors[index % languageColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {analyticsData.language_distribution.map((lang, idx) => (
                    <div key={lang.name} className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: languageColors[idx % languageColors.length] }} />
                      {lang.name} ({lang.value})
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No language data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legal Domain Bar Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">Legal Domain Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.domain_distribution.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.domain_distribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No domain data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Consultations Line Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">Daily Consultations (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.daily_consultations.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.daily_consultations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="consultations" 
                      stroke="#2563EB" 
                      strokeWidth={2}
                      dot={{ fill: "#2563EB" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No daily data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Geographic Distribution (Top States)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.state_distribution.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.state_distribution.map((item, index) => (
                  <div key={item.state} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-5">#{index + 1}</span>
                      <span className="text-sm font-medium">{item.state}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.users} users</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No geographic data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
