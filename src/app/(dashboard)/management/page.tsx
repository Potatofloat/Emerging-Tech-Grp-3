
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Guardhouse } from "@/lib/mock-data";
import { Plus, Edit2, Trash2, Search, MapPin, MoreVertical, Loader2, Database } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useFirebase } from "@/firebase/provider";
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

export default function ManagementPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [guardhouses, setGuardhouses] = useState<Guardhouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // New Guardhouse Form State
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newCapacity, setNewCapacity] = useState("100");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Edit Guardhouse State
  const [editingGuardhouse, setEditingGuardhouse] = useState<Guardhouse | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Delete Guardhouse State
  const [deletingGuardhouse, setDeletingGuardhouse] = useState<Guardhouse | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!firestore || !user) return;

    // Check if user is admin
    const checkAdmin = async () => {
      const personnelRef = doc(firestore, "personnel", user.uid);
      const personnelSnap = await getDoc(personnelRef);
      if (personnelSnap.exists()) {
        setIsAdmin(personnelSnap.data().role === "admin");
      }
    };
    checkAdmin();

    const q = query(collection(firestore, "guardhouses"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Guardhouse[];
      setGuardhouses(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching guardhouses:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, user]);

  const handleAddGuardhouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !isAdmin) return;

    setIsAdding(true);
    try {
      await addDoc(collection(firestore, "guardhouses"), {
        id: `gh-${Date.now()}`,
        name: newName,
        location: newLocation,
        capacity: parseInt(newCapacity),
        currentCrowd: 0,
        lastUpdated: new Date().toISOString(),
      });
      toast({ title: "Location Added", description: `${newName} has been added to the directory.` });
      setIsDialogOpen(false);
      setNewName("");
      setNewLocation("");
      setNewCapacity("100");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteGuardhouse = async () => {
    if (!firestore || !isAdmin || !deletingGuardhouse) return;

    try {
      await deleteDoc(doc(firestore, "guardhouses", deletingGuardhouse.id));
      toast({ title: "Location Removed", description: `${deletingGuardhouse.name} has been removed.` });
      setIsDeleteDialogOpen(false);
      setDeletingGuardhouse(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditGuardhouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !isAdmin || !editingGuardhouse) return;

    setIsAdding(true);
    try {
      await updateDoc(doc(firestore, "guardhouses", editingGuardhouse.id), {
        name: editName,
        location: editLocation,
        capacity: parseInt(editCapacity),
        lastUpdated: new Date().toISOString(),
      });
      toast({ title: "Location Updated", description: `${editName} has been updated.` });
      setIsEditDialogOpen(false);
      setEditingGuardhouse(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const openEditDialog = (gh: Guardhouse) => {
    setEditingGuardhouse(gh);
    setEditName(gh.name);
    setEditLocation(gh.location);
    setEditCapacity(gh.capacity.toString());
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (gh: Guardhouse) => {
    setDeletingGuardhouse(gh);
    setIsDeleteDialogOpen(true);
  };

  const seedInitialData = async () => {
    if (!firestore || !isAdmin) return;
    try {
      await addDoc(collection(firestore, "guardhouses"), {
        id: 'gh-aftc',
        name: 'AFTC Guardhouse',
        location: 'Main Gate',
        currentCrowd: 15,
        capacity: 100,
        lastUpdated: new Date().toISOString(),
      });
      toast({ title: "Data Seeded", description: "Initial guardhouse data has been added." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filtered = guardhouses.filter(gh => 
    gh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gh.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-foreground">Location Management</h2>
          <p className="text-muted-foreground mt-2">Manage guardhouse parameters and access settings.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && guardhouses.length === 0 && (
            <Button variant="outline" onClick={seedInitialData}>
              <Database className="mr-2 h-4 w-4" /> Seed Initial Data
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white" disabled={!isAdmin}>
                <Plus className="mr-2 h-4 w-4" /> Add New Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Guardhouse</DialogTitle>
                <DialogDescription>Enter the details for the new monitoring location.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddGuardhouse} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Guardhouse Name</Label>
                  <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. West Gate" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Physical Location</Label>
                  <Input id="location" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="e.g. Building B Entrance" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Max Capacity</Label>
                  <Input id="capacity" type="number" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} required />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Location"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Guardhouse Directory</CardTitle>
              <CardDescription>
                Total {guardhouses.length} active monitoring points. 
                Combined capacity: {guardhouses.reduce((acc, gh) => acc + gh.capacity, 0)}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search locations..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold py-4">Name</TableHead>
                <TableHead className="font-bold">Location</TableHead>
                <TableHead className="font-bold">Capacity</TableHead>
                <TableHead className="font-bold">Current Crowd</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((gh) => (
                <TableRow key={gh.id} className="hover:bg-muted/10 transition-colors">
                  <TableCell className="font-medium py-4">
                    <div className="flex flex-col">
                      <span>{gh.name}</span>
                      <span className="text-xs text-muted-foreground">ID: {gh.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {gh.location}
                    </div>
                  </TableCell>
                  <TableCell>{gh.capacity}</TableCell>
                  <TableCell>{gh.currentCrowd}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={!isAdmin}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => openEditDialog(gh)}
                        >
                          <Edit2 className="h-3 w-3" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2 text-destructive focus:text-destructive"
                          onClick={() => openDeleteDialog(gh)}
                        >
                          <Trash2 className="h-3 w-3" /> Remove Location
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              No guardhouses matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Guardhouse</DialogTitle>
            <DialogDescription>Update the details for the selected monitoring location.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditGuardhouse} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Guardhouse Name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. West Gate" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Physical Location</Label>
              <Input id="edit-location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="e.g. Building B Entrance" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Max Capacity</Label>
              <Input id="edit-capacity" type="number" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isAdding}>
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the guardhouse
              <span className="font-bold text-foreground"> {deletingGuardhouse?.name} </span>
              and all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGuardhouse}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
