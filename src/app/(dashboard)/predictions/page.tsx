
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Sparkles, Loader2, Calendar, AlertTriangle, Clock } from "lucide-react";
import { predictPeakHours, PredictPeakHoursOutput } from "@/ai/flows/predict-peak-hours-flow";
import { Guardhouse } from "@/lib/mock-data";
import { useFirebase } from "@/firebase/provider";
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDate } from "@/lib/utils";

export default function PredictionsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [predictions, setPredictions] = useState<PredictPeakHoursOutput | null>(null);
  const [guardhouses, setGuardhouses] = useState<Guardhouse[]>([]);
  const [shortTermForecast, setShortTermForecast] = useState<{ time: string, count: number }[]>([]);

  useEffect(() => {
    if (!firestore) return;
    const fetchGH = async () => {
      const snap = await getDocs(collection(firestore, "guardhouses"));
      if (snap.empty) {
        // Auto-initialize with default guardhouse if empty
        const defaultGH = {
          name: 'AFTC Guardhouse',
          location: 'Main Gate',
          currentCrowd: 0,
          capacity: 100,
          lastUpdated: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(firestore, "guardhouses"), defaultGH);
        setGuardhouses([{ ...defaultGH, id: docRef.id }]);
      } else {
        setGuardhouses(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Guardhouse[]);
      }
    };
    fetchGH();
  }, [firestore]);

  const seedArtificialData = async () => {
    if (!firestore || guardhouses.length === 0) {
      toast({ title: "Error", description: "No guardhouses found to seed data for.", variant: "destructive" });
      return;
    }

    setSeeding(true);
    try {
      const now = new Date();
      const ghId = guardhouses[0].id; // Seed for the first one for demo
      
      // Seed past 4 hours
      const entries = [
        { hoursAgo: 4, count: 12 },
        { hoursAgo: 3, count: 25 },
        { hoursAgo: 2, count: 45 },
        { hoursAgo: 1, count: 38 },
        { hoursAgo: 0, count: 52 },
      ];

      for (const entry of entries) {
        const timestamp = new Date(now.getTime() - entry.hoursAgo * 60 * 60 * 1000);
        await addDoc(collection(firestore, "crowd_history"), {
          guardhouseId: ghId,
          timestamp: timestamp.toISOString(),
          crowdCount: entry.count,
          createdAt: serverTimestamp()
        });
      }

      // Update current crowd in guardhouse doc
      await updateDoc(doc(firestore, "guardhouses", ghId), {
        currentCrowd: 52,
        lastUpdated: now.toISOString()
      });

      // Generate 3-hour forecast (simple trend + random)
      const forecast = [
        { time: new Date(now.getTime() + 1 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), count: 65 },
        { time: new Date(now.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), count: 78 },
        { time: new Date(now.getTime() + 3 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), count: 45 },
      ];
      setShortTermForecast(forecast);

      toast({ 
        title: "Data Seeded", 
        description: `Artificial data for ${guardhouses[0].name} has been added for the last 4 hours.` 
      });
    } catch (error) {
      console.error("Failed to seed data:", error);
      toast({ title: "Error", description: "Failed to seed artificial data.", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const generatePredictions = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      // Fetch real history for analysis
      const historySnap = await getDocs(query(collection(firestore, "crowd_history"), orderBy("timestamp", "desc"), limit(100)));
      const historicalData = historySnap.docs.map(doc => {
        const data = doc.data();
        return {
          guardhouseId: data.guardhouseId,
          timestamp: formatDate(data.timestamp).toISOString(),
          crowdCount: data.crowdCount
        };
      });

      if (historicalData.length === 0) {
        toast({ title: "No Data", description: "Insufficient historical data for AI analysis. Please submit some crowd reports first." });
        setLoading(false);
        return;
      }

      const result = await predictPeakHours({ historicalData });
      setPredictions(result);
    } catch (error) {
      console.error("Failed to predict peak hours:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-foreground">AI Prediction Tool</h2>
          <p className="text-muted-foreground mt-2">Analyze historical patterns to proactively plan guardhouse staffing.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={seedArtificialData} 
            disabled={seeding || guardhouses.length === 0}
            variant="outline"
            className="border-accent text-accent hover:bg-accent/10"
          >
            {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Seed Artificial Data
          </Button>
          <Button 
            onClick={generatePredictions} 
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-white shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Patterns...
              </>
            ) : (
              <>
                <BrainCircuit className="mr-2 h-4 w-4" /> Generate New Forecast
              </>
            )}
          </Button>
        </div>
      </div>

      {shortTermForecast.length > 0 && (
        <Card className="border-none shadow-md bg-card overflow-hidden">
          <CardHeader className="bg-accent/5 border-b border-accent/10">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Immediate 3-Hour Forecast</CardTitle>
            </div>
            <CardDescription>Based on current trends and artificial data simulation</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              {shortTermForecast.map((f, i) => (
                <div key={i} className="flex flex-col items-center p-4 bg-muted/30 rounded-xl border border-muted">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{f.time}</span>
                  <span className="text-3xl font-bold mt-1">{f.count}</span>
                  <span className="text-[10px] text-muted-foreground mt-1">ESTIMATED CROWD</span>
                  <div className="w-full h-1 bg-secondary rounded-full mt-3 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full bg-accent transition-all duration-1000",
                        f.count > 70 ? "bg-rose-500" : f.count > 40 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(100, (f.count / 100) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!predictions && !loading && (
        <Card className="border-dashed border-2 bg-muted/30 py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-accent">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-xl font-bold">Ready to Forecast</h3>
            <p className="text-muted-foreground">Click the button above to start the AI analysis of past crowd data to identify upcoming peak periods.</p>
          </div>
        </Card>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 pointer-events-none">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse h-[250px] border-none shadow-md bg-card" />
          ))}
        </div>
      )}

      {predictions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictions.predictions.map((pred) => (
            <Card key={pred.guardhouseId} className="border-none shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-primary/5 pb-6">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="bg-white border-primary/20 text-primary font-bold">
                    PREDICTION
                  </Badge>
                  <Calendar className="h-4 w-4 text-primary opacity-40" />
                </div>
                <CardTitle className="mt-4 text-xl">
                  {guardhouses.find(gh => gh.id === pred.guardhouseId)?.name || pred.guardhouseId}
                </CardTitle>
                <CardDescription>Forecast for the upcoming 72 hours</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Expected Peak Periods
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {pred.predictedPeakHours.map((hour, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-rose-50 text-rose-700 border-rose-100 py-1 px-3">
                        {hour}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2 border border-muted">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-accent" /> AI Insights
                  </h4>
                  <p className="text-sm text-foreground/80 leading-relaxed italic">
                    "{pred.reasoning}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
