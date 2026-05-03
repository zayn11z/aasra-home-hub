import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MessageSquare, Send, ChevronRight, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

type Room = { id: number; hostel_name: string; };
type Message = { id: number; sender_id: number; receiver_id: number; hostel_id: number; content: string; is_read: number; sender_name: string; receiver_name: string; };

const OwnerHostels = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [myId, setMyId] = useState(0);
  
  // Modals
  const [selectedHostel, setSelectedHostel] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) setMyId(user.id);

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rRes, mRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/messages')
      ]);
      setRooms(rRes.data.rooms || []);
      setMessages(mRes.data.messages || []);
    } catch (err) {}
  };

  const hostelNames = Array.from(new Set(rooms.map(r => r.hostel_name)));
  
  const getUnreadCount = (hostelName: string) => {
    const roomIds = rooms.filter(r => r.hostel_name === hostelName).map(r => r.id);
    return messages.filter(m => 
      roomIds.includes(m.hostel_id) && m.receiver_id === myId && m.is_read === 0
    ).length;
  };

  const getStudentsForHostel = (hostelName: string) => {
    const roomIds = rooms.filter(r => r.hostel_name === hostelName).map(r => r.id);
    const relevantMsgs = messages.filter(m => roomIds.includes(m.hostel_id));
    
    const studentIds = new Set<number>();
    relevantMsgs.forEach(m => {
      if (m.sender_id !== myId) studentIds.add(m.sender_id);
      if (m.receiver_id !== myId) studentIds.add(m.receiver_id);
    });

    return Array.from(studentIds).map(sId => {
      const sMsg = relevantMsgs.find(m => m.sender_id === sId || m.receiver_id === sId);
      const name = sMsg ? (sMsg.sender_id === sId ? sMsg.sender_name : sMsg.receiver_name) : "Student";
      const unread = relevantMsgs.filter(m => m.sender_id === sId && m.receiver_id === myId && m.is_read === 0).length;
      return { id: sId, name, unread };
    });
  };

  const handleStudentClick = async (studentId: number, hostelName: string) => {
    setSelectedStudent(studentId);
    const roomIds = rooms.filter(r => r.hostel_name === hostelName).map(r => r.id);
    
    if (roomIds.length > 0) {
      try {
        await api.put('/messages/read', { senderId: studentId, roomIds });
        setMessages(prev => prev.map(m => 
          (m.sender_id === studentId && roomIds.includes(m.hostel_id)) ? { ...m, is_read: 1 } : m
        ));
      } catch (e) {}
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedStudent || !selectedHostel) return;
    const roomIds = rooms.filter(r => r.hostel_name === selectedHostel).map(r => r.id);
    if (roomIds.length === 0) return;

    try {
      await api.post('/messages', {
        receiverId: selectedStudent,
        hostelId: roomIds[0],
        content: newMessage
      });
      setNewMessage("");
      fetchData();
    } catch(err) {}
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">My Hostels</h1>
          <p className="text-muted-foreground mt-1">Manage your grouped properties and student chats</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hostelNames.map((hName) => {
            const unread = getUnreadCount(hName);
            const roomCount = rooms.filter(r => r.hostel_name === hName).length;

            return (
              <Card 
                key={hName} 
                className="group hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer relative"
                onClick={() => { setSelectedHostel(hName); setSelectedStudent(null); }}
              >
                {unread > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce">
                    {unread}
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-2">{hName}</h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <span className="font-medium text-foreground">{roomCount}</span> Rooms
                  </p>
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Open Inbox
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {hostelNames.length === 0 && (
             <div className="col-span-full text-center py-20 text-muted-foreground bg-secondary/20 rounded-xl">
               <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
               <p className="text-lg font-medium">No hostels found</p>
               <p className="text-sm">Create rooms from the Room Management page first.</p>
             </div>
          )}
        </div>
      </div>

      {/* Hostel Inbox Dialog */}
      <Dialog open={!!selectedHostel} onOpenChange={(open) => { if (!open) { setSelectedHostel(null); setSelectedStudent(null); } }}>
        <DialogContent className="max-w-[90vw] md:max-w-[70vw] w-full max-h-[85vh] p-0 overflow-hidden flex flex-col md:flex-row rounded-2xl">
          {selectedHostel && (
            <>
              {/* Left Side: Student List */}
              <div className="w-full md:w-1/3 bg-secondary/20 border-r border-border flex flex-col h-[50vh] md:h-[85vh]">
                <div className="p-4 border-b border-border bg-background">
                  <h3 className="font-display font-semibold text-lg">{selectedHostel} Inbox</h3>
                </div>
                <div className="overflow-y-auto flex-1 p-2">
                  {getStudentsForHostel(selectedHostel).map(student => (
                    <div 
                      key={student.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-1 transition-colors ${selectedStudent === student.id ? 'bg-primary/10' : 'hover:bg-secondary/50'}`}
                      onClick={() => handleStudentClick(student.id, selectedHostel)}
                    >
                      <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{student.name}</p>
                        {student.unread > 0 && <p className="text-xs text-red-500 font-semibold">{student.unread} new messages</p>}
                      </div>
                      {student.unread > 0 && <div className="h-2 w-2 rounded-full bg-red-500 shrink-0"></div>}
                    </div>
                  ))}
                  {getStudentsForHostel(selectedHostel).length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground mt-10">
                      No messages for this hostel yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Chat Interface */}
              <div className="w-full md:w-2/3 bg-background flex flex-col h-[60vh] md:h-[85vh]">
                {selectedStudent ? (
                  <>
                    <div className="p-4 border-b border-border flex items-center shadow-sm z-10">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-display font-semibold text-lg">
                        {getStudentsForHostel(selectedHostel).find(s => s.id === selectedStudent)?.name}
                      </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                      {messages
                        .filter(m => (m.sender_id === selectedStudent || m.receiver_id === selectedStudent) && rooms.filter(r => r.hostel_name === selectedHostel).map(r => r.id).includes(m.hostel_id))
                        .map(m => {
                          const isMe = m.sender_id === myId;
                          return (
                            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in`}>
                              <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white border border-border rounded-tl-sm'}`}>
                                {m.content}
                              </div>
                            </div>
                          );
                      })}
                    </div>

                    <div className="p-4 border-t border-border bg-background flex gap-2">
                      <Input 
                        placeholder="Type your reply..." 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        className="rounded-full bg-secondary/30"
                      />
                      <Button size="icon" className="rounded-full shadow-sm shrink-0" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6">
                    <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
                    <p className="font-medium text-lg text-center">Select a student</p>
                    <p className="text-sm text-center">Choose a conversation from the left to start chatting</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerHostels;
