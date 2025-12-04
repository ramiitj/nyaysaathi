import { Download, MessageSquare, Users, Clock, TrendingUp, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const Analytics = () => {
  const stats = [
    { label: "Total Consultations", value: "1,247", icon: MessageSquare, change: "+12%" },
    { label: "Unique Users", value: "856", icon: Users, change: "+8%" },
    { label: "Avg Session Duration", value: "4m 32s", icon: Clock, change: "+5%" },
    { label: "Returning Users", value: "34%", icon: TrendingUp, change: "+3%" },
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
