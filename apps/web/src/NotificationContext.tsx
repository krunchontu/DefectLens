import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

type NotificationType = "success" | "error" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextValue {
  notify: (type: NotificationType, message: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

let nextId = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (type: NotificationType, message: string) => {
      const id = `toast-${++nextId}`;
      const notification: Notification = { id, type, message };
      setNotifications((prev) => [...prev, notification]);

      const timer = setTimeout(() => {
        dismiss(id);
      }, 5000);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {notifications.map((n) => (
          <div key={n.id} className={`toast toast--${n.type}`} role="alert">
            <span className="toast-message">{n.message}</span>
            <button
              className="toast-dismiss"
              onClick={() => dismiss(n.id)}
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify(): (type: NotificationType, message: string) => void {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotify must be used within a NotificationProvider");
  }
  return context.notify;
}
