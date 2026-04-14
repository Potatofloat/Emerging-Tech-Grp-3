
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Guardhouse } from "@/lib/mock-data";
import { Users, Clock, Loader2 } from "lucide-react";
import { useFirebase } from "@/firebase/provider";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { cn, formatDate } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function DashboardPage() {
  const router = useRouter();
  const { firestore, user, isUserLoading } = useFirebase();
  const [guardhouses, setGuardhouses] = useState<Guardhouse[]>([]);
  const [rawHistory, setRawHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!firestore || !user) return;

    // Fetch guardhouses
    const gq = query(collection(firestore, "guardhouses"));
    const unsubscribeG = onSnapshot(gq, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Guardhouse[];
      setGuardhouses(data);
    });

    // Fetch historical data
    const hq = query(
      collection(firestore, "crowd_history"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const unsubscribeH = onSnapshot(hq, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })).reverse(); // Oldest first for the chart
      setRawHistory(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching historical data:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeG();
      unsubscribeH();
    };
  }, [firestore, user]);

  const historicalData = rawHistory.map(d => {
    const gh = guardhouses.find(g => g.id === d.guardhouseId);
    const date = formatDate(d.timestamp);
    return {
      time: format(date, 'HH:mm'),
      crowd: d.crowdCount,
      location: gh ? gh.name : 'Unknown',
      fullTime: date.toLocaleString()
    };
  });

  if (isUserLoading || loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-[400px] bg-muted rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold text-foreground">Guardhouse Overview</h2>
        <p className="text-muted-foreground mt-2">Real-time crowd monitoring across all locations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-2 border-primary/10 shadow-lg relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-sm uppercase font-bold tracking-wider text-primary">Average Crowd</CardDescription>
            <CardTitle className="text-5xl font-bold tracking-tight">
              {guardhouses.length > 0 
                ? Math.round(guardhouses.reduce((acc, gh) => acc + gh.currentCrowd, 0) / guardhouses.length)
                : 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
              <Users className="h-4 w-4 text-primary" /> 
              <span>Personnel currently waiting across locations</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-primary/10 shadow-lg relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-sm uppercase font-bold tracking-wider text-primary">Est. Waiting Time</CardDescription>
            <CardTitle className="text-5xl font-bold tracking-tight">
              {(() => {
                const total = guardhouses.reduce((acc, gh) => acc + gh.currentCrowd, 0);
                const seconds = total * 8;
                if (seconds < 60) return `${seconds}s`;
                return `${Math.round(seconds / 60)}m`;
              })()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
              <Clock className="h-4 w-4 text-primary" /> 
              <span>Estimated processing time (8s/person)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md bg-card p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl font-bold">Crowd Trend Analysis</CardTitle>
          <CardDescription>Real-time headcount fluctuations over time</CardDescription>
        </CardHeader>
        <CardContent className="px-0 h-[300px]">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCrowd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="crowd" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCrowd)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/10 rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
