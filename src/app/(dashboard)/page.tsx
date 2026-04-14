"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Guardhouse } from "@/lib/mock-data";
import { Loader2 } from "lucide-react";
import { useFirebase } from "@/firebase/provider";
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function ManagementPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [guardhouses, setGuardhouses] = useState<Guardhouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [currentCrowd, setCurrentCrowd] = useState(0);

  useEffect(() => {
    if (!firestore || !user) return;
    console.log("Setting up Firestore listeners...");

    const checkAdmin = async () => {
      try {
        const snap = await getDoc(doc(firestore, "personnel", user.uid));
        const role = snap.exists() ? snap.data().role : "none";
        console.log("User role:", role);
        setIsAdmin(role === "admin");
      } catch (e) {
        console.error("Admin check failed:", e);
      }
    };
    checkAdmin();

    const unsubscribe = onSnapshot(
      query(collection(firestore, "guardhouses")),
      (snapshot) => {
        console.log("Snapshot received, docs:", snapshot.docs.length);
        const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Guardhouse[];
        setGuardhouses(data);
        setLoading(false);
      },
      (error) => {
        console.error("Snapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, user]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !editingId) return;
    console.log("handleEdit called, id:", editingId);
    setIsEditing(true);
    try {
      console.log("Calling updateDoc...");
      await updateDoc(doc(firestore, "guardhouses", editingId), {
        name: editName,
        location: editLocation,
        capacity: parseInt(editCapacity),
        currentCrowd: currentCrowd,
        lastUpdated: new Date().toISOString(),
      });
      console.log("updateDoc success!");
      toast({ title: "Updated!", description: `${editName} has been updated.` });
      setEditingId(null);
    } catch (error: any) {
      console.error("updateDoc error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      console.log("finally block, resetting isEditing");
      setIsEditing(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!firestore || !isAdmin) return;
    if (!window.confirm(`Delete ${name}?`)) return;
    console.log("handleDelete called, id:", id);
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, "guardhouses", id));
      console.log("deleteDoc success!");
      toast({ title: "Deleted", description: `${name} removed.` });
    } catch (error: any) {
      console.error("deleteDoc error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (gh: Guardhouse) => {
    console.log("openEdit called for:", gh.name, "id:", gh.id);
    setEditingId(gh.id);
    setEditName(gh.name);
    setEditLocation(gh.location);
    setEditCapacity(gh.capacity.toString());
    setCurrentCrowd(gh.currentCrowd ?? 0);
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">Location Management</h2>
      <p className="text-sm text-gray-500">Admin: {isAdmin ? "YES" : "NO"}</p>

      {/* Inline Edit Form */}
      {editingId && (
        <div className="border rounded p-4 bg-gray-50 space-y-3">
          <h3 className="font-semibold">Editing Guardhouse</h3>
          <form onSubmit={handleEdit} className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} required />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={editLocation} onChange={e => setEditLocation(e.target.value)} required />
            </div>
            <div>
              <Label>Capacity</Label>
              <Input type="number" value={editCapacity} onChange={e => setEditCapacity(e.target.value)} required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isEditing}>
                {isEditing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditingId(null)} disabled={isEditing}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Guardhouse list */}
      <div className="space-y-2">
        {guardhouses.map(gh => (
          <div key={gh.id} className="border rounded p-4 flex items-center justify-between bg-white">
            <div>
              <p className="font-medium">{gh.name}</p>
              <p className="text-sm text-gray-500">
                {gh.location} — Capacity: {gh.capacity} — Crowd: {gh.currentCrowd}
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(gh)}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" disabled={isDeleting} onClick={() => handleDelete(gh.id, gh.name)}>
                  Delete
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
