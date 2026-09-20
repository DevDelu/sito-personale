export type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  last_used_at: string | null;
};

// Forma inviata dal browser (PushSubscription.toJSON()): valida in
// app/api/push/subscribe/route.ts prima di passarla a salvaSubscription().
export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};
