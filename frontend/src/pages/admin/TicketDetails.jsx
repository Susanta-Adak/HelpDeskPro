import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import TicketDetailView from "../../components/TicketDetailView";
import { LoadingState, ErrorState } from "../../components/States";
import { useAuth } from "../../context/AuthContext";
import * as adminApi from "../../api/adminApi";
import * as ticketsApi from "../../api/ticketsApi";
import { extractErrorMessage } from "../../api/client";

export default function TicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loadError, setLoadError] = useState("");

  function load() {
    setLoadError("");
    setTicket(null);
    Promise.all([adminApi.getTicket(ticketId), adminApi.listSupportUsers()])
      .then(([ticketData, users]) => {
        setTicket(ticketData);
        setAssignableUsers(users);
      })
      .catch((err) => setLoadError(extractErrorMessage(err, "Could not load this ticket.")));
  }

  useEffect(load, [ticketId]);

  async function handleSave(updates) {
    try {
      const updated = await ticketsApi.updateTicket(ticketId, updates);
      setTicket(updated);
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Could not save changes."));
    }
  }

  async function handleAdminDelete() {
    try {
      await adminApi.deleteTicket(ticketId);
      navigate("/admin/tickets", { replace: true });
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Could not delete this ticket."));
    }
  }

  async function handleReassign(assigneeId) {
    try {
      const updated = await adminApi.assignTicket(ticketId, assigneeId);
      setTicket(updated);
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Could not reassign this ticket."));
    }
  }

  async function handleChangeStatus(nextStatus) {
    try {
      const updated = await adminApi.changeTicketStatus(ticketId, nextStatus);
      setTicket(updated);
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Could not change ticket status."));
    }
  }

  async function handleAddComment(body) {
    try {
      await ticketsApi.addComment(ticketId, body);
      const updated = await adminApi.getTicket(ticketId);
      setTicket(updated);
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Could not post your comment."));
    }
  }

  async function handleDownload() {
    await ticketsApi.downloadAttachment(ticketId, ticket.attachment_filename);
  }

  return (
    <AdminLayout>
      {ticket === null && !loadError && <LoadingState label="Loading ticket…" />}
      {loadError && <ErrorState message={loadError} onRetry={load} />}
      {ticket && (
        <TicketDetailView
          ticket={ticket}
          currentUser={user}
          assignableUsers={assignableUsers}
          onSave={handleSave}
          onAdminDelete={handleAdminDelete}
          onReassign={handleReassign}
          onChangeStatus={handleChangeStatus}
          onAddComment={handleAddComment}
          onDownloadAttachment={handleDownload}
          backLink={{ to: "/admin/tickets", label: "Back to All Tickets" }}
        />
      )}
    </AdminLayout>
  );
}
