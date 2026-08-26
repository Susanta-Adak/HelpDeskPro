import apiClient from "./client";

export async function listAllTickets({ search, status, page = 1, pageSize = 20 } = {}) {
  const params = { page, page_size: pageSize };
  if (search) params.search = search;
  if (status) params.status = status;
  const { data } = await apiClient.get("/admin/tickets", { params });
  return data; // { items, total, page, page_size }
}

export async function getTicket(ticketId) {
  const { data } = await apiClient.get(`/admin/tickets/${ticketId}`);
  return data;
}

export async function changeTicketStatus(ticketId, status) {
  const { data } = await apiClient.patch(`/admin/tickets/${ticketId}/status`, { status });
  return data;
}

export async function assignTicket(ticketId, assigneeId) {
  const { data } = await apiClient.patch(`/admin/tickets/${ticketId}/assign`, {
    assignee_id: assigneeId,
  });
  return data;
}

export async function deleteTicket(ticketId) {
  await apiClient.delete(`/admin/tickets/${ticketId}`);
}

export async function getDashboardStats() {
  const { data } = await apiClient.get("/admin/stats");
  return data;
}

export async function listSupportUsers() {
  const { data } = await apiClient.get("/admin/support-users");
  return data;
}

export async function getTeamOverview() {
  const { data } = await apiClient.get("/admin/team-overview");
  return data;
}
