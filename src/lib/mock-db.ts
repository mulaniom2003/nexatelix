/**
 * In-memory mock database provider for Demo/Preview mode.
 * Activates seamlessly when Supabase credentials are not yet supplied.
 */

export const MOCK_WALLETS = {
  balance: 14250.75,
  rcs_balance: 3800.5,
};

export const MOCK_ROUTES = [
  { id: 1, channel: "sms", name: "India Direct Premium", country: "India", iso: "IN", dial_code: "91", price: 0.0022, is_global: true, active: true },
  { id: 2, channel: "sms", name: "United Kingdom Direct", country: "United Kingdom", iso: "GB", dial_code: "44", price: 0.0085, is_global: true, active: true },
  { id: 3, channel: "sms", name: "United States High-Volume", country: "United States", iso: "US", dial_code: "1", price: 0.0045, is_global: true, active: true },
  { id: 4, channel: "sms", name: "United Arab Emirates HQ", country: "United Arab Emirates", iso: "AE", dial_code: "971", price: 0.021, is_global: true, active: true },
  { id: 5, channel: "sms", name: "Brazil Direct Operator", country: "Brazil", iso: "BR", dial_code: "55", price: 0.0125, is_global: true, active: true },
  { id: 6, channel: "sms", name: "Germany HQ Tier 1", country: "Germany", iso: "DE", dial_code: "49", price: 0.038, is_global: true, active: true },
  { id: 7, channel: "sms", name: "Philippines Direct", country: "Philippines", iso: "PH", dial_code: "63", price: 0.0185, is_global: true, active: true },
  { id: 8, channel: "sms", name: "Vietnam Telecom", country: "Vietnam", iso: "VN", dial_code: "84", price: 0.019, is_global: true, active: true },
  { id: 9, channel: "sms", name: "Indonesia Direct", country: "Indonesia", iso: "ID", dial_code: "62", price: 0.024, is_global: true, active: true },
  { id: 10, channel: "rcs", name: "Global RCS Verified Tier", country: "Global", iso: "WW", dial_code: "", price: 0.0035, is_global: true, active: true },
];

export const MOCK_SENDERS = [
  { id: 1, user_id: "demo-client-id", sender: "NEXATELIX", channel: "sms", status: "approved", created_at: "2026-09-01T10:00:00Z" },
  { id: 2, user_id: "demo-client-id", sender: "STACY_VIP", channel: "sms", status: "approved", created_at: "2026-09-12T14:30:00Z" },
  { id: 3, user_id: "demo-client-id", sender: "VERIFY_OTP", channel: "sms", status: "approved", created_at: "2026-09-20T08:15:00Z" },
  { id: 4, user_id: "demo-client-id", sender: "CASINO_ALERT", channel: "sms", status: "pending", created_at: "2026-10-04T11:00:00Z" },
];

export const MOCK_MESSAGES = [
  { id: "msg_98a72b1", user_id: "demo-client-id", channel: "sms", sender: "STACY_VIP", recipient: "+919876543210", status: "delivered", price: 0.0022, parts: 1, created_at: new Date(Date.now() - 3 * 60000).toISOString() },
  { id: "msg_98a72b2", user_id: "demo-client-id", channel: "sms", sender: "VERIFY_OTP", recipient: "+447700900123", status: "delivered", price: 0.0085, parts: 1, created_at: new Date(Date.now() - 7 * 60000).toISOString() },
  { id: "msg_98a72b3", user_id: "demo-client-id", channel: "rcs", sender: "NEXATELIX", recipient: "+12025550199", status: "delivered", price: 0.0035, parts: 1, created_at: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: "msg_98a72b4", user_id: "demo-client-id", channel: "sms", sender: "STACY_VIP", recipient: "+971501234567", status: "sent", price: 0.021, parts: 1, created_at: new Date(Date.now() - 28 * 60000).toISOString() },
  { id: "msg_98a72b5", user_id: "demo-client-id", channel: "sms", sender: "STACY_VIP", recipient: "+5511987654321", status: "delivered", price: 0.0125, parts: 1, created_at: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: "msg_98a72b6", user_id: "demo-client-id", channel: "sms", sender: "VERIFY_OTP", recipient: "+4915123456789", status: "delivered", price: 0.038, parts: 1, created_at: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: "msg_98a72b7", user_id: "demo-client-id", channel: "rcs", sender: "NEXATELIX", recipient: "+639171234567", status: "delivered", price: 0.0035, parts: 1, created_at: new Date(Date.now() - 95 * 60000).toISOString() },
  { id: "msg_98a72b8", user_id: "demo-client-id", channel: "sms", sender: "STACY_VIP", recipient: "+919812345678", status: "failed", price: 0.0022, parts: 1, created_at: new Date(Date.now() - 120 * 60000).toISOString() },
];

export const MOCK_TOPUPS = [
  { id: "top_101", user_id: "demo-client-id", amount: 5000, method: "usdt", status: "approved", reference: "0x89f2c1...b4a", created_at: "2026-10-01T09:30:00Z" },
  { id: "top_102", user_id: "demo-client-id", amount: 2500, method: "bank", status: "approved", reference: "WIRE-992817", created_at: "2026-09-15T14:15:00Z" },
  { id: "top_103", user_id: "demo-client-id", amount: 1000, method: "upi", status: "pending", reference: "UPI/392819827", created_at: "2026-10-05T18:00:00Z" },
];

export const MOCK_INVOICES = [
  { id: "inv_2026_09", user_id: "demo-client-id", month: "2026-09", total_messages: 142980, total_amount: 1248.5, status: "paid", created_at: "2026-10-01T00:00:00Z" },
  { id: "inv_2026_08", user_id: "demo-client-id", month: "2026-08", total_messages: 219400, total_amount: 1980.2, status: "paid", created_at: "2026-09-01T00:00:00Z" },
  { id: "inv_2026_07", user_id: "demo-client-id", month: "2026-07", total_messages: 95400, total_amount: 870.0, status: "paid", created_at: "2026-08-01T00:00:00Z" },
];

export const MOCK_TICKETS = [
  { id: "tkt_1", user_id: "demo-client-id", subject: "Route optimization for India OTP traffic", status: "answered", created_at: "2026-10-02T11:20:00Z", updated_at: "2026-10-02T12:00:00Z" },
  { id: "tkt_2", user_id: "demo-client-id", subject: "Sender ID approval request: CASINO_ALERT", status: "open", created_at: "2026-10-04T16:45:00Z", updated_at: "2026-10-04T16:45:00Z" },
];

export const MOCK_CLIENTS = [
  { id: "demo-client-id", email: "stacy@gmail.com", full_name: "Stacy Miller", company: "Stacy Global Gaming", role: "customer", balance: 14250.75, suspended: false, created_at: "2026-07-01T00:00:00Z" },
  { id: "usr_2", email: "arjun@casinogroup.in", full_name: "Arjun K.", company: "Crown Gaming India", role: "customer", balance: 8420.0, suspended: false, created_at: "2026-08-10T00:00:00Z" },
  { id: "usr_3", email: "sarah@igaming-uk.com", full_name: "Sarah P.", company: "BetStream UK", role: "customer", balance: 32100.5, suspended: false, created_at: "2026-08-25T00:00:00Z" },
  { id: "usr_4", email: "dmitri@euro-poker.eu", full_name: "Dmitri P.", company: "EastEuro Interactive", role: "customer", balance: 450.0, suspended: false, created_at: "2026-09-05T00:00:00Z" },
];

export function createMockQuery(tableName: string) {
  let data: any = [];

  switch (tableName) {
    case "wallets":
      data = [MOCK_WALLETS];
      break;
    case "routes":
      data = [...MOCK_ROUTES];
      break;
    case "user_routes":
      data = [];
      break;
    case "sender_ids":
      data = [...MOCK_SENDERS];
      break;
    case "messages":
      data = [...MOCK_MESSAGES];
      break;
    case "topups":
      data = [...MOCK_TOPUPS];
      break;
    case "invoices":
      data = [...MOCK_INVOICES];
      break;
    case "tickets":
      data = [...MOCK_TICKETS];
      break;
    case "profiles":
    case "clients":
      data = [...MOCK_CLIENTS];
      break;
    default:
      data = [];
  }

  const query: any = {
    _data: data,
    select(cols?: string, opts?: { count?: string; head?: boolean }) {
      if (opts?.count === "exact") {
        query._isCount = true;
      }
      return query;
    },
    eq(col: string, val: any) {
      if (Array.isArray(query._data)) {
        query._data = query._data.filter((item: any) => item[col] === val);
      }
      return query;
    },
    neq(col: string, val: any) {
      if (Array.isArray(query._data)) {
        query._data = query._data.filter((item: any) => item[col] !== val);
      }
      return query;
    },
    in(col: string, vals: any[]) {
      if (Array.isArray(query._data)) {
        query._data = query._data.filter((item: any) => vals.includes(item[col]));
      }
      return query;
    },
    order(col: string, opts?: { ascending?: boolean }) {
      return query;
    },
    limit(n: number) {
      if (Array.isArray(query._data)) {
        query._data = query._data.slice(0, n);
      }
      return query;
    },
    range(from: number, to: number) {
      if (Array.isArray(query._data)) {
        query._data = query._data.slice(from, to + 1);
      }
      return query;
    },
    single() {
      const item = Array.isArray(query._data) ? query._data[0] ?? null : query._data;
      return Promise.resolve({ data: item, error: null });
    },
    maybeSingle() {
      const item = Array.isArray(query._data) ? query._data[0] ?? null : query._data;
      return Promise.resolve({ data: item, error: null });
    },
    insert(val: any) {
      return Promise.resolve({ data: val, error: null });
    },
    update(val: any) {
      return Promise.resolve({ data: val, error: null });
    },
    upsert(val: any) {
      return Promise.resolve({ data: val, error: null });
    },
    delete() {
      return Promise.resolve({ data: null, error: null });
    },
    then(resolve: any) {
      if (query._isCount) {
        return resolve({ count: query._data?.length ?? 0, data: null, error: null });
      }
      return resolve({ data: query._data, count: query._data?.length ?? 0, error: null });
    },
  };

  return query;
}

export function createMockClient() {
  return {
    from(table: string) {
      return createMockQuery(table);
    },
    rpc(fnName: string, args?: any) {
      if (fnName === "msg_overview") {
        return Promise.resolve({
          data: [{ sent_today: 48210, sent_month: 894520, delivered_all: 12480900 }],
          error: null,
        });
      }
      if (fnName === "admin_overview") {
        return Promise.resolve({
          data: { total_users: 148, active_routes: 24, messages_today: 182040, revenue_today: 4120.5 },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    },
    auth: {
      getUser() {
        return Promise.resolve({
          data: {
            user: {
              id: "demo-client-id",
              email: "stacy@gmail.com",
              user_metadata: { full_name: "Stacy Miller" },
            },
          },
          error: null,
        });
      },
      signOut() {
        return Promise.resolve({ error: null });
      },
    },
  };
}
