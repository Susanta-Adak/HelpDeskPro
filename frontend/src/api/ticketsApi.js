import apiClient from "./client";

export async function listMyTickets() {
  const { data } = await apiClient.get("/tickets");
  return data;
}

export async function getTicket(ticketId) {
  const { data } = await apiClient.get(`/tickets/${ticketId}`);
  return data;
}

export async function createTicket({ title, description }) {
  const { data } = await apiClient.post("/tickets", { title, description });
  return data;
}

export async function updateTicket(ticketId, { title, description }) {
  const { data } = await apiClient.put(`/tickets/${ticketId}`, { title, description });
  return data;
}

export async function deleteTicket(ticketId) {
  await apiClient.delete(`/tickets/${ticketId}`);
}
