"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useERP } from "@/lib/useERP";
import { getClientToken } from "@/lib/clientAuth";
import { Card, Button } from "@/components/ui";
import { Bell, Check, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: number;
  title: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsClient() {
  const token = getClientToken() ?? "";
  const router = useRouter();
  
  // Use SWR polling to keep notifications fresh on this page too
  const { data: notifications = [], mutate, error } = useERP<Notification[]>("/notifications", token);
  const [marking, setMarking] = useState<number | null>(null);

  const markAsRead = async (id: number) => {
    setMarking(id);
    try {
      await api.patch(`/notifications/${id}/read`, {}, token);
      mutate();
    } catch (err) {
      console.error(err);
    }
    setMarking(null);
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/mark-all-read", {}, token);
      mutate();
    } catch (err) {
      console.error(err);
    }
  };

  if (error) return <div className="text-destructive">Failed to load notifications.</div>;
  if (!notifications.length) return <div className="text-muted-foreground text-sm">No notifications yet.</div>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={markAllRead} className="gap-2 text-sm px-2 py-1">
            <Check size={14} /> Mark all as read
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {notifications.map(notif => (
          <Card 
            key={notif.id} 
            className={`p-4 transition-colors ${!notif.is_read ? 'bg-accent/5 border-accent/20' : 'bg-card'}`}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-3">
                <div className={`mt-1 p-2 rounded-full ${!notif.is_read ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className={`text-sm ${!notif.is_read ? 'font-bold' : 'font-medium'}`}>
                    {notif.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {!notif.is_read && (
                  <Button 
                    variant="ghost" 
                    onClick={() => markAsRead(notif.id)}
                    disabled={marking === notif.id}
                    className="h-8 text-xs px-2"
                  >
                    <Check size={14} className="mr-1" /> Mark read
                  </Button>
                )}
                
                {notif.link_url && (
                  <Button 
                    variant="outline" 
                    className="h-8 text-xs px-2 gap-1"
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.id);
                      router.push(notif.link_url!);
                    }}
                  >
                    View <ExternalLink size={12} />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
