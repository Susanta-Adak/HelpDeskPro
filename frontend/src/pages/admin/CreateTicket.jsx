import { useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import TicketForm from "../../components/TicketForm";
import { createTicket } from "../../api/ticketsApi";
import { extractErrorMessage } from "../../api/client";

export default function CreateTicket() {
  const navigate = useNavigate();

  async function handleSubmit(formData) {
    try {
      const ticket = await createTicket(formData);
      navigate(`/admin/tickets/${ticket.id}`, { replace: true });
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Could not create the ticket. Please try again."));
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to="/admin/tickets" className="text-sm text-primary hover:underline">
            ← Back to All Tickets
          </Link>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6 md:p-8">
          <h2 className="text-xl font-semibold text-on-surface">Create New Ticket</h2>
          <p className="text-sm text-on-surface-variant mt-1 mb-6">
            Create a ticket on behalf of a customer or for internal tracking.
          </p>
          <TicketForm onSubmit={handleSubmit} cancelTo="/admin/tickets" />
        </div>
      </div>
    </AdminLayout>
  );
}
