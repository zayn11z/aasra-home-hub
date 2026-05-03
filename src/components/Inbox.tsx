import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, ArrowLeft } from "lucide-react";
import api from "@/lib/api";

interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  timestamp: string;
}

interface Contact {
  id: string;
  name: string;
  role: "Student" | "Owner";
  lastMessage: string;
  unread: number;
  messages: Message[];
}

interface InboxProps {
  role: "student" | "owner";
}

const Inbox = ({ role }: InboxProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current logged in user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch messages and group them by contact
    api.get("/messages")
      .then((res) => {
        const msgs = res.data.messages || [];
        const contactMap: Record<string, Contact> = {};
        const currentUserId = JSON.parse(storedUser || "{}").id;

        msgs.forEach((m: any) => {
          const otherId = String(m.sender_id === currentUserId ? m.receiver_id : m.sender_id);
          const otherName = m.sender_id === currentUserId ? m.receiver_name : m.sender_name;
          const otherRole = m.sender_id === currentUserId ? m.receiver_role : m.sender_role;

          if (!contactMap[otherId]) {
            contactMap[otherId] = {
              id: otherId,
              name: otherName,
              role: otherRole.charAt(0).toUpperCase() + otherRole.slice(1) as "Student" | "Owner",
              lastMessage: m.content,
              unread: 0,
              messages: [],
            };
          }

          if (m.receiver_id === currentUserId && (m.is_read === 0 || m.is_read === false)) {
            contactMap[otherId].unread += 1;
          }

          contactMap[otherId].messages.push({
            id: String(m.id),
            text: m.content,
            sender: m.sender_id === currentUserId ? "me" : "them",
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
          contactMap[otherId].lastMessage = m.content;
        });

        setContacts(Object.values(contactMap));
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeContact || !user) return;

    try {
      const response = await api.post("/messages", {
        receiverId: parseInt(activeContact.id),
        content: newMessage.trim(),
        hostelId: null, // Optional hostel context
      });

      const m = response.data.data;
      const msg: Message = {
        id: String(m.id),
        text: m.content,
        sender: "me",
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setContacts((prev) =>
        prev.map((c) =>
          c.id === activeContact.id
            ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text }
            : c
        )
      );
      setActiveContact((prev) => prev ? { ...prev, messages: [...prev.messages, msg], lastMessage: msg.text } : null);
      setNewMessage("");
    } catch {
      // Failed to send
    }
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Inbox
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex overflow-hidden p-0 px-6 pb-6">
        {!activeContact ? (
          /* Contact list */
          <ScrollArea className="w-full">
            <div className="space-y-1">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    setActiveContact(contact);
                    setContacts((prev) => prev.map((c) => c.id === contact.id ? { ...c, unread: 0 } : c));
                    // Mark messages from this contact as read on the server
                    if (contact.unread > 0) {
                      api.put("/messages/read", { senderId: parseInt(contact.id) }).catch(() => {});
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {contact.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-foreground">{contact.name}</p>
                      {contact.unread > 0 && (
                        <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
                  </div>
                </button>
              ))}
              {contacts.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">No conversations yet</p>
              )}
            </div>
          </ScrollArea>
        ) : (
          /* Chat view */
          <div className="flex flex-col w-full">
            <button
              onClick={() => setActiveContact(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              {activeContact.name}
            </button>
            <ScrollArea className="flex-1 mb-3">
              <div className="space-y-3 pr-2">
                {activeContact.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                        msg.sender === "me"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-secondary-foreground rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Inbox;
