export function formatTicketCode(id) {
  return `TKT-${String(id).padStart(4, "0")}`;
}

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const CATEGORY_LABELS = {
  technical: "Technical",
  billing: "Billing",
  account: "Account",
  general: "General",
};
