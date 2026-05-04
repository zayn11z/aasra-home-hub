import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Upload, Building2, ImagePlus, X, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "@/data/mockRooms";
import api, { BASE_URL } from "@/lib/api";

const allAmenities = ["WiFi", "AC", "Fan", "Attached Bathroom", "Common Bathroom", "Study Table", "Wardrobe", "Balcony", "Mini Fridge", "Laundry"];

const emptyRoom = {
  hostelName: "",
  hostelLocation: "",
  hostelType: "Male" as "Male" | "Female" | "Both",
  roomNumber: "",
  roomType: "Single" as Room["roomType"],
  price: 0,
  capacity: 1,
  amenities: [] as string[],
  description: "",
  imagePreviews: [] as string[],
  imageFiles: [] as File[],
};

type EditForm = {
  hostelLocation: string;
  hostelType: "Male" | "Female" | "Both";
  roomNumber: string;
  roomType: Room["roomType"];
  price: number;
  capacity: number;
  amenities: string[];
  existingImages: string[];
  newFiles: File[];
  newPreviews: string[];
};

const OwnerRooms = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<(Room & { currentOccupancy?: number })[]>([]);
  const [form, setForm] = useState(emptyRoom);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editRoom, setEditRoom] = useState<(Room & { currentOccupancy?: number }) | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get("/rooms")
      .then((res) => {
        const backendRooms = (res.data.rooms || []).map((r: any) => ({
          id: String(r.id),
          hostelName: r.hostel_name || "",
          hostelLocation: r.hostel_location || "",
          hostelType: r.hostel_type as "Male" | "Female" | "Both" || "Male",
          roomNumber: r.room_number,
          roomType: r.room_type as Room["roomType"],
          price: r.rate,
          capacity: r.capacity,
          currentOccupancy: r.current_occupancy || 0,
          amenities: r.amenities || [],
          description: "",
          images: r.images && r.images.length > 0 ? r.images.map((img: string) => `${BASE_URL}${img}`) : ["/placeholder.svg"],
          available: r.status === "available",
        }));
        setRooms(backendRooms);
      })
      .catch(() => {});
  }, []);

  const handleAmenityToggle = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleRoomTypeChange = (v: string) => {
    let cap = form.capacity;
    if (v === "Single") cap = 1;
    if (v === "Double") cap = 2;
    if (v === "Triple") cap = 3;
    setForm({ ...form, roomType: v as any, capacity: cap });
  };

  const handleEditRoomTypeChange = (v: string) => {
    if (!editForm) return;
    let cap = editForm.capacity;
    if (v === "Single") cap = 1;
    if (v === "Double") cap = 2;
    if (v === "Triple") cap = 3;
    setEditForm({ ...editForm, roomType: v as any, capacity: cap });
    setEditError("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPreviews: string[] = [];
    const newFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 5MB per image", variant: "destructive" });
        return;
      }
      newPreviews.push(URL.createObjectURL(file));
      newFiles.push(file);
    });
    setForm((prev) => ({ 
      ...prev, 
      imagePreviews: [...prev.imagePreviews, ...newPreviews].slice(0, 5),
      imageFiles: [...prev.imageFiles, ...newFiles].slice(0, 5)
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({ 
      ...prev, 
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
      imageFiles: prev.imageFiles.filter((_, i) => i !== index)
    }));
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editForm) return;
    const newPreviews: string[] = [];
    const newFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 5MB per image", variant: "destructive" });
        return;
      }
      newPreviews.push(URL.createObjectURL(file));
      newFiles.push(file);
    });
    
    const totalCurrent = editForm.existingImages.length + editForm.newFiles.length;
    if (totalCurrent + newFiles.length > 5) {
       toast({ title: "Max 5 images allowed", variant: "destructive" });
       return;
    }

    setEditForm((prev) => {
      if(!prev) return prev;
      return { 
        ...prev, 
        newPreviews: [...prev.newPreviews, ...newPreviews],
        newFiles: [...prev.newFiles, ...newFiles]
      };
    });
  };

  const removeEditExistingImage = (index: number) => {
    setEditForm(prev => {
      if(!prev) return prev;
      return { ...prev, existingImages: prev.existingImages.filter((_, i) => i !== index) };
    });
  };

  const removeEditNewImage = (index: number) => {
    setEditForm(prev => {
      if(!prev) return prev;
      return { 
        ...prev, 
        newPreviews: prev.newPreviews.filter((_, i) => i !== index),
        newFiles: prev.newFiles.filter((_, i) => i !== index)
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hostelName || !form.hostelLocation || !form.roomNumber || !form.price) {
      toast({ title: "Please fill all required fields (Hostel Name, Location, Room Number, Price)", variant: "destructive" });
      return;
    }
    try {
      const formData = new FormData();
      formData.append("hostel_name", form.hostelName);
      formData.append("hostel_location", form.hostelLocation);
      formData.append("hostel_type", form.hostelType);
      formData.append("room_number", form.roomNumber);
      formData.append("room_type", form.roomType);
      formData.append("capacity", form.capacity.toString());
      formData.append("rate", form.price.toString());
      formData.append("amenities", JSON.stringify(form.amenities));
      
      form.imageFiles.forEach(file => {
        formData.append("images", file);
      });

      const response = await api.post("/rooms", formData);
      const r = response.data.room;
      const newRoom: Room = {
        id: String(r.id),
        hostelName: form.hostelName || "",
        hostelLocation: form.hostelLocation || "",
        hostelType: form.hostelType || "Male",
        roomNumber: r.room_number,
        roomType: r.room_type as Room["roomType"],
        price: r.rate,
        capacity: r.capacity,
        amenities: form.amenities,
        description: form.description,
        images: r.images && r.images.length > 0 ? r.images.map((img: string) => `${BASE_URL}${img}`) : ["/placeholder.svg"],
        available: true,
      };
      setRooms((prev) => [newRoom, ...prev]);
      setForm(emptyRoom);
      setShowForm(false);
      toast({ title: "Room added successfully!" });
    } catch {
      toast({ title: "Failed to add room", variant: "destructive" });
    }
  };

  const openEdit = (room: Room & { currentOccupancy?: number }) => {
    setEditRoom(room);
    setEditForm({
      hostelLocation: room.hostelLocation || "",
      hostelType: room.hostelType || "Male",
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      price: room.price,
      capacity: room.capacity,
      amenities: [...room.amenities],
      existingImages: room.images.filter(img => img !== "/placeholder.svg").map(img => img.replace(BASE_URL, '')),
      newFiles: [],
      newPreviews: []
    });
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!editRoom || !editForm) return;
    const occupancy = editRoom.currentOccupancy || 0;
    if (editForm.capacity < occupancy) {
      setEditError(`Cannot set capacity to ${editForm.capacity}. There are currently ${occupancy} student(s) in this room.`);
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("hostel_location", editForm.hostelLocation);
      formData.append("hostel_type", editForm.hostelType);
      formData.append("room_number", editForm.roomNumber);
      formData.append("room_type", editForm.roomType);
      formData.append("capacity", editForm.capacity.toString());
      formData.append("rate", editForm.price.toString());
      formData.append("amenities", JSON.stringify(editForm.amenities));
      formData.append("existing_images", JSON.stringify(editForm.existingImages));
      
      editForm.newFiles.forEach(file => {
        formData.append("images", file);
      });

      const res = await api.put(`/rooms/${editRoom.id}`, formData);
      
      const updatedImages = res.data.images && res.data.images.length > 0 ? res.data.images.map((img:string) => `${BASE_URL}${img}`) : ["/placeholder.svg"];

      setRooms((prev) => prev.map((r) =>
        r.id === editRoom.id
          ? { ...r, hostelLocation: editForm.hostelLocation, hostelType: editForm.hostelType, roomNumber: editForm.roomNumber, roomType: editForm.roomType, capacity: editForm.capacity, price: editForm.price, amenities: editForm.amenities, images: updatedImages }
          : r
      ));
      setEditRoom(null);
      setEditForm(null);
      toast({ title: "Room updated successfully!" });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update room";
      setEditError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/rooms/${id}`);
      setRooms((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Room removed and students deallocated" });
    } catch {
      toast({ title: "Failed to delete room", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Room Management</h1>
            <p className="text-muted-foreground mt-1">Add and manage hostel rooms</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="font-body">
            <Plus className="h-4 w-4 mr-2" /> Add Room
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> Add New Room
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2 grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="hostelName">Hostel Name *</Label>
                    <Input id="hostelName" placeholder="e.g. Sunrise Boys Hostel" value={form.hostelName} onChange={(e) => setForm({ ...form, hostelName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hostelLocation">Hostel Location *</Label>
                    <Input id="hostelLocation" placeholder="e.g. F-8 Markaz, Islamabad" value={form.hostelLocation} onChange={(e) => setForm({ ...form, hostelLocation: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hostel Type</Label>
                  <Select value={form.hostelType} onValueChange={(v) => setForm({ ...form, hostelType: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Only Boys</SelectItem>
                      <SelectItem value="Female">Only Girls</SelectItem>
                      <SelectItem value="Both">Both (Co-ed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomNumber">Room Number *</Label>
                  <Input id="roomNumber" placeholder="e.g. A-101" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Room Type</Label>
                  <Select value={form.roomType} onValueChange={handleRoomTypeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Double">Double</SelectItem>
                      <SelectItem value="Triple">Triple</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Rent (PKR) *</Label>
                  <Input id="price" type="number" placeholder="e.g. 5000" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                {form.roomType === "Custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input id="capacity" type="number" min={1} max={10} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                  </div>
                )}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe the room..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label>Room Photos (max 5)</Label>
                  <div className="flex flex-wrap gap-3">
                    {form.imagePreviews.map((src, i) => (
                      <div key={i} className="relative h-24 w-24 rounded-lg overflow-hidden border border-border group">
                        <img src={src} alt={`Room photo ${i + 1}`} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {form.imagePreviews.length < 5 && (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="h-24 w-24 rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-xs">Upload</span>
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB each</p>
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label>Amenities</Label>
                  <div className="flex flex-wrap gap-4">
                    {allAmenities.map((a) => (
                      <label key={a} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={form.amenities.includes(a)} onCheckedChange={() => handleAmenityToggle(a)} />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <Button type="submit" className="font-body">Add Room</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="font-body">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Room List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="group hover:shadow-[var(--shadow-soft)] transition-all overflow-hidden">
              <div className="h-40 bg-secondary overflow-hidden">
                <img src={room.images[0]} alt={`${room.roomNumber} photo`} className="h-full w-full object-cover" />
              </div>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">{room.roomNumber}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {room.hostelName}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${room.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {room.available ? "Available" : "Booked"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{room.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {room.amenities.slice(0, 3).map((a) => (
                    <span key={a} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                  {room.amenities.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{room.amenities.length - 3} more</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-display text-xl font-bold text-primary">PKR {room.price.toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
                  <div className="flex items-center gap-1">
                    {/* Edit Button */}
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openEdit(room)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {/* Delete Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the room and automatically deallocate any students currently assigned to it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(room.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Room
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No rooms added yet</p>
            <p className="text-sm">Click "Add Room" to get started</p>
          </div>
        )}
      </div>

      {/* Edit Room Dialog */}
      <Dialog open={!!editRoom} onOpenChange={(open) => { if (!open) { setEditRoom(null); setEditForm(null); setEditError(""); } }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" /> Edit Room
            </DialogTitle>
            {editRoom && (
              <p className="text-sm text-muted-foreground pt-1">
                Editing <span className="font-semibold text-foreground">{editRoom.hostelName}</span> — hostel name cannot be changed.
              </p>
            )}
          </DialogHeader>

          {editForm && editRoom && (
            <div className="grid gap-5 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-hostelLocation">Location</Label>
                  <Input
                    id="edit-hostelLocation"
                    value={editForm.hostelLocation}
                    onChange={(e) => setEditForm({ ...editForm, hostelLocation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hostel Type</Label>
                  <Select value={editForm.hostelType} onValueChange={(v) => setEditForm({ ...editForm, hostelType: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Only Boys</SelectItem>
                      <SelectItem value="Female">Only Girls</SelectItem>
                      <SelectItem value="Both">Both (Co-ed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-roomNumber">Room Number</Label>
                <Input
                  id="edit-roomNumber"
                  value={editForm.roomNumber}
                  onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Type</Label>
                  <Select value={editForm.roomType} onValueChange={handleEditRoomTypeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Double">Double</SelectItem>
                      <SelectItem value="Triple">Triple</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">
                    Capacity
                    {editRoom.currentOccupancy ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">({editRoom.currentOccupancy} currently occupied)</span>
                    ) : null}
                  </Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    min={editRoom.currentOccupancy || 1}
                    max={20}
                    value={editForm.capacity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditForm({ ...editForm, capacity: val });
                      if (val < (editRoom.currentOccupancy || 0)) {
                        setEditError(`Cannot set capacity below current occupancy (${editRoom.currentOccupancy}).`);
                      } else {
                        setEditError("");
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price">Monthly Rent (PKR)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editForm.price || ""}
                  onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="flex flex-wrap gap-3">
                  {allAmenities.map((a) => (
                    <label key={a} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={editForm.amenities.includes(a)}
                        onCheckedChange={() => {
                          setEditForm((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              amenities: prev.amenities.includes(a)
                                ? prev.amenities.filter((x) => x !== a)
                                : [...prev.amenities, a],
                            };
                          });
                        }}
                      />
                      {a}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Room Photos</Label>
                <div className="flex flex-wrap gap-3">
                  {editForm.existingImages.map((src, i) => (
                    <div key={`existing-${i}`} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border group">
                      <img src={`${BASE_URL}${src}`} alt={`Room photo ${i + 1}`} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeEditExistingImage(i)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {editForm.newPreviews.map((src, i) => (
                    <div key={`new-${i}`} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border group">
                      <img src={src} alt={`New room photo ${i + 1}`} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeEditNewImage(i)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {(editForm.existingImages.length + editForm.newFiles.length) < 5 && (
                    <label className="h-20 w-20 rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-[10px]">Upload</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleEditImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              {editError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <span>⚠️</span>
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={handleSaveEdit} disabled={isSaving || !!editError}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { setEditRoom(null); setEditForm(null); setEditError(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerRooms;
