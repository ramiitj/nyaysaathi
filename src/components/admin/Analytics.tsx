import { useEffect, useState } from "react";
import { Download, MessageSquare, Users, Clock, TrendingUp, MapPin, UserPlus, RefreshCw, Globe, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const Analytics = () => {
  const [visitorStats, setVisitorStats] = useState({
    totalVisitors: 0,
    newVisitors: 0,
    returningVisitors: 0,
    avgVisits: 0,
  });
  const [deviceBreakdown, setDeviceBreakdown] = useState<{ name: string; value: number; color: string }[]>([]);
  const [browserBreakdown, setBrowserBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(true);

  useEffect(() => {
    fetchVisitorData();
  }, []);

  const fetchVisitorData = async () => {
    setIsLoadingVisitors(true);
    try {
      // Fetch visitor statistics
      const { data: visitors, error } = await supabase
        .from('user_visitors')
        .select('*');
      
      if (error) throw error;

      if (visitors) {
        const total = visitors.length;
        const newUsers = visitors.filter(v => v.visit_count === 1).length;
        const returning = total - newUsers;
        const avgVisits = total > 0 
          ? visitors.reduce((sum, v) => sum + (v.visit_count || 0), 0) / total 
          : 0;

        setVisitorStats({
          totalVisitors: total,
          newVisitors: newUsers,
          returningVisitors: returning,
          avgVisits: Math.round(avgVisits * 10) / 10,
        });

        // Calculate device breakdown
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
    } finally {
      setIsLoadingVisitors(false);
    }
  };

  const stats = [
    { label: "Total Consultations", value: "1,247", icon: MessageSquare, change: "+12%" },
    { label: "Unique Visitors", value: visitorStats.totalVisitors.toString(), icon: Users, change: "+8%" },
    { label: "New Visitors", value: visitorStats.newVisitors.toString(), icon: UserPlus, change: "+15%" },
    { label: "Returning Visitors", value: `${visitorStats.returningVisitors}`, icon: RefreshCw, change: "+3%" },
  ];

  const languageData = [
    { name: "Hindi", value: 35, color: "#2563EB" },
    { name: "English", value: 25, color: "#10B981" },
    { name: "Tamil", value: 15, color: "#F59E0B" },
    { name: "Telugu", value: 10, color: "#8B5CF6" },
    { name: "Bengali", value: 8, color: "#EC4899" },
    { name: "Others", value: 7, color: "#6B7280" },
  ];

  const domainData = [
    { name: "Criminal", value: 320 },
    { name: "Family", value: 280 },
    { name: "Property", value: 220 },
    { name: "Consumer", value: 180 },
    { name: "Labor", value: 150 },
    { name: "Cyber", value: 97 },
  ];

  const dailyData = [
    { day: "Mon", consultations: 145 },
    { day: "Tue", consultations: 189 },
    { day: "Wed", consultations: 167 },
    { day: "Thu", consultations: 212 },
    { day: "Fri", consultations: 198 },
    { day: "Sat", consultations: 156 },
    { day: "Sun", consultations: 180 },
  ];

  const geoData = [
    { state: "Maharashtra", users: 234, percentage: "27%" },
    { state: "Delhi NCR", users: 189, percentage: "22%" },
    { state: "Karnataka", users: 145, percentage: "17%" },
    { state: "Tamil Nadu", users: 123, percentage: "14%" },
    { state: "West Bengal", users: 98, percentage: "11%" },
  ];

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
                <div className="flex flex-col items-end">
                  <stat.icon className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-green-600">{stat.change}</span>
                </div>
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
            {isLoadingVisitors ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : deviceBreakdown.length > 0 ? (
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
            {isLoadingVisitors ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : browserBreakdown.length > 0 ? (
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
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {languageData.map((lang) => (
                <div key={lang.name} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lang.color }} />
                  {lang.name} ({lang.value}%)
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legal Domain Bar Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">Legal Domain Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={domainData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Consultations Line Chart */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">Daily Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
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
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Geographic Distribution (Top 5 States)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoData.map((item, index) => (
                <div key={item.state} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-5">#{index + 1}</span>
                    <span className="text-sm font-medium">{item.state}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{item.users} users</span>
                    <span className="text-sm font-medium text-primary">{item.percentage}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
