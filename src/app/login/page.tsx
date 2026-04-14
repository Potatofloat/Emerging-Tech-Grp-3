
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useFirebase } from "@/firebase/provider";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { auth, firestore, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleGoogleLogin = async () => {
    if (!auth || !firestore) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      // Check if personnel profile exists
      const personnelRef = doc(firestore, "personnel", loggedInUser.uid);
      const personnelSnap = await getDoc(personnelRef);

      if (!personnelSnap.exists()) {
        // Create initial profile
        // Default admin if email matches
        const isAdmin = loggedInUser.email === "Tanzhuangjie012@gmail.com";
        await setDoc(personnelRef, {
          id: loggedInUser.uid,
          name: loggedInUser.displayName || "Anonymous Personnel",
          email: loggedInUser.email || "",
          role: isAdmin ? "admin" : "officer",
          assignedGuardhouseIds: isAdmin ? ["gh-aftc"] : [], // Admins get default access
        });
      }

      toast({
        title: "Access Authorized",
        description: `Welcome, ${loggedInUser.displayName}`,
      });
      router.push("/");
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Authorization Failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-[50vw] h-full bg-primary/5 hidden lg:block skew-x-12 translate-x-32" />
      
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-card rounded-2xl shadow-2xl overflow-hidden relative z-10">
        <div className="p-8 md:p-12 flex flex-col justify-center space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-white h-6 w-6" />
            </div>
            <h1 className="text-2xl font-headline font-bold text-primary tracking-tight">
              CrowdWatch <span className="text-accent">Pro</span>
            </h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-headline">Personnel Access</h2>
            <p className="text-muted-foreground">Please sign in with your authorized Google account to access the guardhouse network.</p>
          </div>

          <div className="space-y-6">
            <Button 
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Sign in with Google <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Strictly for authorized personnel use only. All access is logged and monitored.
          </p>
        </div>

        <div className="hidden lg:block relative bg-slate-900">
          <Image 
            src="https://picsum.photos/seed/cwpro1/1200/800"
            alt="Security Operations"
            fill
            className="object-cover opacity-60 mix-blend-overlay"
            priority
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent flex flex-col justify-end p-12">
            <div className="space-y-4">
              <div className="w-12 h-1 bg-accent rounded-full" />
              <h3 className="text-white text-2xl font-bold leading-tight">
                Empowering personnel with real-time crowd insight.
              </h3>
              <p className="text-slate-300">
                Proactively manage guardhouse traffic and reduce congestion through data-driven decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
