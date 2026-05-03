import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BedDouble, Building2, Users, Wifi, Wind, Bath, BookOpen, DoorOpen, Home, MessageSquare, Send, Phone } from "lucide-react";
import api from "@/lib/api";

const amenityIcons: Record<string, React.ElementType> = {
  WiFi: Wifi,
  AC: Wind,
  "Attached Bathroom": Bath,
  "Study Table": BookOpen,
};

const StudentRoom = () => {
  const navigate = useNavigate();
  const [myRoom, setMyRoom] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const myId = JSON.parse(localStorage.getItem('user') || '{}').id;

  useEffect(() => {
    api.get('/rooms/my-room')
      .then(res => {
        setMyRoom(res.data.room);
      })
      .catch(() => {
        setMyRoom(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const loadChat = async (ownerId: number) => {
    try {
      const res = await api.get('/messages');
      const filtered = res.data.messages.filter((m: any) =>
        m.sender_id === ownerId || m.receiver_id === ownerId
      );
      setChatMessages(filtered);
      setShowChat(true);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {}
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !myRoom?.owner_id) return;
    try {
      await api.post('/messages', {
        receiverId: myRoom.owner_id,
        hostelId: myRoom.id,
        content: newMessage
      });
      setNewMessage("");
      loadChat(myRoom.owner_id);
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="flex items-center justify-center py-20">Loading...</div>
      </div>
    );
  }

  if (!myRoom) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="container mx-auto px-6 py-20">
          <Card className="max-w-md mx-auto text-center py-12 px-6">
            <Home className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
            <h2 className="font-display text-2xl font-bold mb-2">No Room Assigned</h2>
            <p className="text-muted-foreground mb-8">You haven't booked a room yet. Browse available hostels to find your perfect stay.</p>
            <Button onClick={() => navigate('/hostels')} size="lg" className="w-full sm:w-auto font-body">
              Browse Hostels
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Use actual amenities from backend
  const amenities = myRoom?.amenities || [];

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">My Room</h1>
          <p className="text-muted-foreground mt-1">Your room details and information</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Room Info */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BedDouble className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Room {myRoom.room_number}</h2>
                  <p className="text-sm text-muted-foreground">{myRoom.room_type} Room</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Hostel:</span>
                  <span className="font-medium text-foreground">{myRoom.hostel_name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <DoorOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Room Type:</span>
                  <span className="font-medium text-foreground">{myRoom.room_type}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Roommates:</span>
                  <span className="font-medium text-foreground">None (Single Room)</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Check-in Date</p>
                <p className="font-medium text-foreground">{new Date(myRoom.updated_at || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="font-display text-2xl font-bold text-primary">PKR {myRoom.rate.toLocaleString()}<span className="text-sm text-muted-foreground font-normal">/month</span></p>
              </div>

              {/* Owner Contact */}
              {myRoom.owner_name && (
                <div className="pt-2 border-t border-border space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Owner Details</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{myRoom.owner_name}</span>
                  </div>
                  {myRoom.owner_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{myRoom.owner_phone}</span>
                    </div>
                  )}
                  <Button
                    className="w-full mt-2"
                    onClick={() => loadChat(myRoom.owner_id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {showChat ? 'View Chat' : 'Chat with Owner'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4">Room Amenities</h3>
              <div className="grid grid-cols-2 gap-4">
                {amenities.map((amenity) => {
                  const Icon = amenityIcons[amenity] || BedDouble;
                  return (
                    <div key={amenity} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">{amenity}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
                  <span className="text-sm text-green-700 font-medium">Your room is currently assigned</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Panel */}
        {showChat && myRoom?.owner_id && (
          <Card className="mt-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Chat with {myRoom.owner_name || 'Owner'}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>Close</Button>
              </div>

              <div className="h-72 overflow-y-auto p-4 space-y-3 bg-secondary/10">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <MessageSquare className="h-8 w-8 opacity-20" />
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  chatMessages.map((m: any) => {
                    const isMe = m.sender_id === myId;
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-xs text-muted-foreground mb-1">
                          {isMe ? 'You' : m.sender_name}
                        </span>
                        <div className={`px-3 py-2 rounded-xl text-sm max-w-[80%] ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-white border border-border rounded-tl-sm'
                        }`}>
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="rounded-full"
                />
                <Button size="icon" className="rounded-full shrink-0" onClick={handleSend} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentRoom;
