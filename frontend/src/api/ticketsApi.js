import apiClient from "./client";

export async function listMyTickets() {
  const { data } = await apiClient.get("/tickets");
  return data;
}

export async function getTicket(ticketId) {
  const { data } = await apiClient.get(`/tickets/${ticketId}`);
  return data;
}

export async function createTicket(formData) {
  const { data } = await apiClient.post("/tickets", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateTicket(ticketId, { title, description, category, priority }) {
  const { data } = await apiClient.put(`/tickets/${ticketId}`, {
    title,
    description,
    category,
    priority,
  });
  return data;
}

export async function deleteTicket(ticketId) {
  await apiClient.delete(`/tickets/${ticketId}`);
}

export async function assignTicket(ticketId, assigneeId) {
  const { data } = await apiClient.patch(`/tickets/${ticketId}/assign`, {
    assignee_id: assigneeId,
  });
  return data;
}

export async function changeTicketStatus(ticketId, status) {
  const { data } = await apiClient.patch(`/tickets/${ticketId}/status`, { status });
  return data;
}

export async function addComment(ticketId, body) {
  const { data } = await apiClient.post(`/tickets/${ticketId}/comments`, { body });
  return data;
}

export async function listAssignableUsers() {
  const { data } = await apiClient.get("/tickets/assignable-users");
  return data;
}

export async function downloadAttachment(ticketId, filename) {
  const { data } = await apiClient.get(`/tickets/${ticketId}/attachment`, { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "attachment";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
