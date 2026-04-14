
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent 
} from "@/components/ui/chart";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from "recharts";
import { Guardhouse } from "@/lib/mock-data";
import { useFirebase } from "@/firebase/provider";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

const chartConfig = {
  crowd: { label: "Crowd Count", color: "hsl(var(--accent))" },
};

export default function TrendsPage() {
  const { firestore } = useFirebase();
  const [guardhouses, setGuardhouses] = useState<Guardhouse[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchData = async () => {
      try {
        // 1. Fetch Guardhouses
        const ghSnapshot = await getDocs(collection(firestore, "guardhouses"));
        const ghList = ghSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Guardhouse[];
        setGuardhouses(ghList);

        // 2. Fetch History (last 50 entries for simplicity)
        const historyQuery = query(
          collection(firestore, "crowd_history"),
          orderBy("timestamp", "asc"),
          limit(50)
        );
        const historySnapshot = await getDocs(historyQuery);
        const historyList = historySnapshot.docs.map(doc => {
          const data = doc.data();
          const date = formatDate(data.timestamp);
          return {
            hour: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            crowd: data.crowdCount,
            guardhouseId: data.guardhouseId
          };
        });
        setHistoryData(historyList);
      } catch (error) {
        console.error("Error fetching trend data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [firestore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold text-foreground">Hourly Crowd Trends</h2>
        <p className="text-muted-foreground mt-2">Historical data analysis of crowd flow over time.</p>
      </div>

      <Card className="border-none shadow-xl bg-card p-6">
        <CardHeader className="px-0">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Aggregate view of latest crowd reports across all guardhouses.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 h-[400px]">
          {historyData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorCrowd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="crowd" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCrowd)" 
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground italic">
              No historical data available yet.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        {guardhouses.map((gh) => {
          const ghHistory = historyData.filter(d => d.guardhouseId === gh.id);
          return (
            <Card key={gh.id} className="border-none shadow-md bg-card">
              <CardHeader>
                <CardTitle className="text-lg">{gh.name} Recent Trends</CardTitle>
                <CardDescription>Activity analysis for this location</CardDescription>
              </CardHeader>
              <CardContent className="h-[200px]">
                {ghHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ghHistory}>
                      <Area 
                        type="step" 
                        dataKey="crowd" 
                        stroke="hsl(var(--accent))"
                        fill="hsl(var(--accent))"
                        fillOpacity={0.1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                    No data for this location.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
