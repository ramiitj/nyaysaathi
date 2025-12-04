import { MessageSquare, BarChart3, FileText, Globe, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SystemStatus = () => {
  const stats = [
    { label: "Total Consultations", value: "1,247", icon: MessageSquare, color: "bg-primary" },
    { label: "Active Today", value: "23", icon: BarChart3, color: "bg-green-500" },
    { label: "Documents Uploaded", value: "156", icon: FileText, color: "bg-amber-500" },
    { label: "Languages Used", value: "12", icon: Globe, color: "bg-purple-500" },
  ];

  const services = [
    { name: "Database Connection", status: "Operational" },
    { name: "Gemini API", status: "Operational" },
    { name: "Text-to-Speech", status: "Operational" },
  ];

  const recentActivity = [
    { language: "Hindi", messages: 5, time: "4 Dec, 08:37 pm" },
    { language: "English", messages: 3, time: "4 Dec, 08:35 pm" },
    { language: "Tamil", messages: 7, time: "4 Dec, 08:30 pm" },
    { language: "Telugu", messages: 2, time: "4 Dec, 08:25 pm" },
    { language: "Bengali", messages: 4, time: "4 Dec, 08:20 pm" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
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
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{service.name}</span>
                <span className="flex items-center gap-2 text-sm text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  {service.status}
                </span>
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
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.language}</p>
                    <p className="text-xs text-muted-foreground">{activity.messages} messages</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemStatus;
