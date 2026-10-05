export const invoiceNumber = (userId: string, ym: string) => `NX-${ym.replace("-", "")}-${userId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

export const monthLabel = (ym: string) =>
  new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));
