import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Users, Wifi, Wind, Bath, MapPin, CreditCard, Building, Star, Phone, Calendar, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

type Room = {
  id: string;
  hostelName: string;
  hostelLocation: string;
  hostelType: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  currentOccupancy: number;
  price: number;
  amenities: string[];
  description: string;
  ownerId: number;
  ownerName: string;
  ownerPhone: string;
  createdAt: string;
};

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="h-3.5 w-3.5" />,
  AC: <Wind className="h-3.5 w-3.5" />,
  "Attached Bathroom": <Bath className="h-3.5 w-3.5" />,
};

const Hostels = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [rooms, setRooms] = useState<Room[]>([]);
  
  // Booking & Modal State
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Fetch Rooms and My Room simultaneously
    Promise.all([
      api.get('/rooms'),
      api.get('/rooms/my-room').catch(() => null)
    ]).then(([roomsRes, myRoomRes]) => {
      const myRoomId = myRoomRes?.data?.room?.id;
      const backendRooms = (roomsRes.data.rooms || [])
        .filter((r: any) => r.status === 'available' && String(r.id) !== String(myRoomId))
        .map((r: any) => ({
          id: String(r.id),
          hostelName: r.hostel_name || "Hostel",
          hostelLocation: r.hostel_location || "Unknown Location",
          hostelType: r.hostel_type || "Male",
          roomNumber: r.room_number,
          roomType: r.room_type,
          capacity: r.capacity,
          currentOccupancy: r.current_occupancy || 0,
          price: r.rate,
          amenities: r.amenities || [],
          description: `Spacious ${r.room_type} room located in ${r.hostel_name}.`,
          ownerId: r.owner_id,
          ownerName: r.owner_name || "Unknown",
          ownerPhone: r.owner_phone || "Not provided",
          createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recently",
        }));
      setRooms(backendRooms);
    }).catch(() => {});

    api.get('/reviews').then((res) => {
      setReviews(res.data.reviews || []);
    }).catch(() => {});
  }, []);

  const filtered = rooms.filter((room) => {
    const matchesSearch =
      room.hostelName.toLowerCase().includes(search.toLowerCase()) ||
      room.hostelLocation.toLowerCase().includes(search.toLowerCase()) ||
      room.roomNumber.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || room.roomType === typeFilter;
    const matchesGender = genderFilter === "all" || room.hostelType === genderFilter || room.hostelType === "Both";
    return matchesSearch && matchesType && matchesGender;
  });

  const checkAuth = () => {
    if (!localStorage.getItem("token")) {
      toast({ title: "Authentication required", description: "Please login to continue.", variant: "destructive" });
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleBook = async () => {
    if (!selectedRoom || !checkAuth()) return;
    setIsProcessing(true);
    
    try {
      await api.post('/payments/book', {
        roomId: parseInt(selectedRoom.id),
        amount: selectedRoom.price,
        paymentMethod
      });
      
      toast({ title: "Booking Successful!", description: `Room ${selectedRoom.roomNumber} is now assigned to you.` });
      navigate('/student/room');
    } catch (err: any) {
      toast({ title: "Booking Failed", description: err.response?.data?.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const loadChat = async (ownerId: number) => {
    if (!checkAuth()) return;
    try {
      const res = await api.get('/messages');
      const allMessages = res.data?.messages || [];
      // Filter thread between me and owner
      const messages = allMessages.filter((m: any) => 
        m.sender_id === ownerId || m.receiver_id === ownerId
      );
      setChatMessages(messages);
      setShowChat(true);
    } catch(err) {
      // Still open the chat so the student can send a first message
      setChatMessages([]);
      setShowChat(true);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;
    try {
      await api.post('/messages', {
        receiverId: selectedRoom.ownerId,
        hostelId: parseInt(selectedRoom.id),
        content: newMessage
      });
      setNewMessage("");
      loadChat(selectedRoom.ownerId); // reload chat to see new message
    } catch(err) {
      toast({ title: "Failed to send message", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Browse Hostels</h1>
          <p className="text-muted-foreground mt-1">Find and book your perfect room</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by hostel name, location or room number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Hostel Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Gender</SelectItem>
              <SelectItem value="Male">Boys</SelectItem>
              <SelectItem value="Female">Girls</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Room type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Double">Double</SelectItem>
              <SelectItem value="Triple">Triple</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Room Grid and Detail Modal */}
        <Dialog open={isDetailOpen} onOpenChange={(open) => { 
          if (!open) { setIsDetailOpen(false); setBookingStep(1); setShowChat(false); setSelectedRoom(null); }
        }}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((room) => (
              <Card 
                key={room.id}
                className="group hover:shadow-[var(--shadow-soft)] hover:-translate-y-1 transition-all cursor-pointer"
                onClick={() => { setSelectedRoom(room); setIsDetailOpen(true); setShowChat(false); setBookingStep(1); }}
              >
                <CardContent className="p-0">
                  <div className="h-40 bg-secondary rounded-t-xl flex items-center justify-center relative">
                    <Building2 className="h-10 w-10 text-muted-foreground/30" />
                    {(() => {
                      const hostelReviews = reviews.filter(rev => rev.hostel_name === room.hostelName);
                      if (hostelReviews.length > 0) {
                        const avg = hostelReviews.reduce((sum, rev) => sum + rev.rating, 0) / hostelReviews.length;
                        return (
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur pb-0 pt-0.5 px-2 rounded-full flex items-center gap-1 shadow-sm border border-border">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mb-0.5" />
                            <span className="text-xs font-bold text-slate-800">{avg.toFixed(1)}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display text-lg font-semibold text-foreground">{room.hostelName}</h3>
                          <Badge variant="outline" className={`text-[10px] uppercase ${room.hostelType === 'Female' ? 'bg-pink-50 text-pink-700 border-pink-200' : room.hostelType === 'Male' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                            {room.hostelType === 'Male' ? 'Boys' : room.hostelType === 'Female' ? 'Girls' : 'Co-ed'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {room.hostelLocation}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building className="h-3.5 w-3.5" />
                          Room {room.roomNumber}
                        </p>
                      </div>
                      <Badge variant="secondary" className="font-body text-xs">{room.roomType}</Badge>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4 mt-2">
                      <Users className="h-3.5 w-3.5" />
                      Available Beds: {room.capacity - room.currentOccupancy} / {room.capacity}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <p className="font-display text-xl font-bold text-primary">
                        PKR {room.price.toLocaleString()}
                        <span className="text-xs text-muted-foreground font-normal">/mo</span>
                      </p>
                      <Button variant="outline" size="sm" className="font-body opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details
                        </Button>
                      </div>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogContent className="max-w-[95vw] w-full md:max-w-[85vw] lg:max-w-[75vw] max-h-[95vh] overflow-hidden p-0 border-none shadow-2xl bg-background/95 backdrop-blur-3xl flex flex-col md:flex-row rounded-2xl">
            {selectedRoom && (
              <>
                {/* Left side: Image and details */}
                <div className="md:w-[45%] bg-muted/40 p-6 md:p-8 flex flex-col relative overflow-y-auto border-r border-border/50">
                  <div className="h-48 md:h-64 rounded-xl bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center mb-6 shadow-inner relative overflow-hidden flex-shrink-0">
                    <Building2 className="h-20 w-20 text-white/50" />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">{selectedRoom.hostelName}</h2>
                    <Badge className={`uppercase ${selectedRoom.hostelType === 'Female' ? 'bg-pink-100 text-pink-700 hover:bg-pink-100' : selectedRoom.hostelType === 'Male' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-purple-100 text-purple-700 hover:bg-purple-100'}`}>
                      {selectedRoom.hostelType === 'Male' ? 'Boys Hostel' : selectedRoom.hostelType === 'Female' ? 'Girls Hostel' : 'Co-ed'}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-2 text-muted-foreground mb-1 text-lg">
                    <MapPin className="h-5 w-5"/> {selectedRoom.hostelLocation}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground mb-8 text-lg">
                    <Building className="h-5 w-5"/> Room {selectedRoom.roomNumber} · {selectedRoom.roomType}
                  </p>
                  
                  <div className="space-y-4 text-sm text-foreground mt-auto">
                    <div className="flex items-center justify-between p-4 bg-background rounded-xl shadow-sm border border-border/50">
                      <span className="text-muted-foreground font-medium">Owner</span>
                      <span className="font-bold text-base">{selectedRoom.ownerName}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background rounded-xl shadow-sm border border-border/50">
                      <span className="text-muted-foreground font-medium flex items-center gap-2"><Phone className="h-4 w-4"/> Phone</span>
                      <span className="font-bold text-base">{selectedRoom.ownerPhone}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background rounded-xl shadow-sm border border-border/50">
                      <span className="text-muted-foreground font-medium flex items-center gap-2"><Calendar className="h-4 w-4"/> Posted Online</span>
                      <span className="font-bold text-base">{selectedRoom.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Actions / Chat / Booking */}
                <div className="md:w-[55%] p-6 md:p-8 flex flex-col bg-background overflow-y-auto">
                  {!showChat ? (
                    <div className="space-y-8 flex-1 flex flex-col">
                      <div>
                        <h3 className="font-display text-2xl font-bold mb-4">About this room</h3>
                        <p className="text-muted-foreground leading-relaxed text-base">{selectedRoom.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-lg mb-4">Amenities</h4>
                        <div className="flex flex-wrap gap-2.5">
                          {selectedRoom.amenities.map(a => (
                            <Badge key={a} variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                              <span className="mr-2 opacity-70">{amenityIcons[a]}</span>{a}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Rent</p>
                            <p className="font-display text-3xl font-bold text-primary">PKR {selectedRoom.price.toLocaleString()}</p>
                          </div>
                          {bookingStep === 1 ? (
                            <Button size="lg" className="shadow-md h-12 px-8 text-base" onClick={() => { if (checkAuth()) setBookingStep(2); }}>
                              Book Now
                            </Button>
                          ) : null}
                        </div>

                        {bookingStep === 2 && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 bg-muted/30 p-5 rounded-2xl">
                            <p className="font-semibold text-lg">Select Payment Method</p>
                            <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => setPaymentMethod('card')} className={`p-4 border-2 rounded-xl text-left transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background'}`}>
                                <CreditCard className="h-5 w-5 mb-2" />
                                <p className="font-medium">Card</p>
                              </button>
                              <button onClick={() => setPaymentMethod('challan')} className={`p-4 border-2 rounded-xl text-left transition-all ${paymentMethod === 'challan' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background'}`}>
                                <Building className="h-5 w-5 mb-2" />
                                <p className="font-medium">Bank Challan</p>
                              </button>
                            </div>
                            <div className="flex gap-3 pt-2">
                              <Button variant="outline" className="flex-1 h-12 text-base" onClick={() => setBookingStep(1)}>Cancel</Button>
                              <Button className="flex-1 h-12 text-base shadow-md" onClick={handleBook} disabled={isProcessing}>
                                {isProcessing ? 'Processing...' : 'Confirm'}
                              </Button>
                            </div>
                          </div>
                        )}

                        {bookingStep === 1 && (
                          <Button variant="outline" className="w-full h-12 text-base border-2" onClick={() => loadChat(selectedRoom.ownerId)}>
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Chat with Owner
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full min-h-[500px]">
                      <div className="flex items-center justify-between mb-4 border-b pb-4">
                        <h3 className="font-display text-xl font-bold flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-primary"/> Chat with {selectedRoom.ownerName}
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>Back to Details</Button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-3 custom-scrollbar">
                        {chatMessages.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-3">
                            <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center">
                              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p>No messages yet. Send a message to start!</p>
                          </div>
                        ) : (
                          chatMessages.map((m: any) => {
                            const isMe = m.sender_id !== selectedRoom.ownerId; 
                            return (
                              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                <span className="text-xs text-muted-foreground mb-1 px-1">{isMe ? 'You' : m.sender_name}</span>
                                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-sm' : 'bg-secondary text-secondary-foreground rounded-tl-sm shadow-sm'}`}>
                                  {m.content}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-auto relative pt-4 border-t">
                        <Input 
                          placeholder="Type your message here..." 
                          value={newMessage} 
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="pr-14 h-12 rounded-full border-2 focus-visible:ring-0 focus-visible:border-primary bg-secondary/30"
                        />
                        <Button size="icon" onClick={handleSendMessage} className="absolute right-2 top-6 h-8 w-8 rounded-full shadow-md" disabled={!newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No rooms found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hostels;
