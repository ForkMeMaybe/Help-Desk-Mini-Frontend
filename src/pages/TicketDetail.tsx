import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../api/client";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

interface Agent {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface Comment {
  id: number;
  text: string;
  created_by: Agent;
  created_at: string;
}

interface HistoryEntry {
  id: number;
  changed_by: Agent;
  changed_at: string;
  field_name: string;
  old_value: string;
  new_value: string;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigned_agent: Agent | null;
  created_by: Agent;
  created_at: string;
  updated_at: string;
  version: number;
  is_breached: boolean;
  sla_deadline: string | null;
}

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAgent } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchTicket();
    if (isAgent) {
      fetchAgents();
    }
  }, [id, isAgent]);

  const fetchTicket = async () => {
    try {
      const response = await apiClient.get(`/api/tickets/${id}/`);
      setTicket(response.data);
      setComments(response.data.comments || []);
      setHistory(response.data.history || []);
    } catch (error) {
      console.error("Failed to fetch ticket:", error);
      toast.error("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await apiClient.get("/api/users/agents/");
      setAgents(response.data);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    try {
      const response = await apiClient.patch(`/api/tickets/${id}/`, {
        status: newStatus,
        version: ticket.version,
      });
      setTicket(response.data);
      setHistory(response.data.history || []);
      toast.success("Status updated successfully");
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error(
          "This ticket was updated by someone else. Please refresh the page to see the latest changes.",
          {
            autoClose: 5000,
          },
        );
      } else {
        toast.error("Failed to update status");
      }
      console.error("Failed to update status:", error);
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    if (!ticket) return;

    try {
      const response = await apiClient.patch(`/api/tickets/${id}/`, {
        assigned_agent: agentId || null,
        version: ticket.version,
      });
      setTicket(response.data);
      setHistory(response.data.history || []);
      toast.success("Agent assigned successfully");
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error(
          "This ticket was updated by someone else. Please refresh the page to see the latest changes.",
          {
            autoClose: 5000,
          },
        );
      } else {
        toast.error("Failed to assign agent");
      }
      console.error("Failed to assign agent:", error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await apiClient.post(`/api/tickets/${id}/comments/`, {
        text: commentText,
      });
      setCommentText("");
      fetchTicket();
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Ticket not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/tickets")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{ticket.title}</h1>
            <p className="mt-1 text-sm text-gray-500">Ticket #{ticket.id}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(ticket.status)}`}
              >
                {formatStatus(ticket.status)}
              </span>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}
              >
                {ticket.priority}
              </span>
              {ticket.is_breached && (
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  SLA Breached
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Created By
                  </p>
                  <p className="text-sm text-gray-900">{ticket.created_by}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Created At
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Assigned Agent
                  </p>
                  <p className="text-sm text-gray-900">
                    {ticket.assigned_to
                      ? `${ticket.assigned_to}`
                      : "Unassigned"}
                  </p>
                </div>
              </div>

              {ticket.sla_deadline && (
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      SLA Deadline
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Date(ticket.sla_deadline).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isAgent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Status
                  </label>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Agent
                  </label>
                  <select
                    value={ticket.assigned_agent?.id || ""}
                    onChange={(e) => handleAssignAgent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.first_name} {agent.last_name} ({agent.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Description
              </h3>
              <p className="text-gray-900 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Comments ({comments.length})
          </h2>

          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border-l-4 border-blue-500 pl-4 py-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {comment.user}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-gray-700">{comment.text}</p>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-gray-500 text-center py-4">No comments yet</p>
            )}
          </div>

          <form onSubmit={handleAddComment} className="mt-6">
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Add a comment
            </label>
            <textarea
              id="comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your comment here..."
              required
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingComment ? "Adding..." : "Add Comment"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Ticket History
          </h2>

          <div className="space-y-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start space-x-3 text-sm"
              >
                <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-600"></div>
                <div className="flex-1">
                  <p className="text-gray-900">
                    <span className="font-medium">{entry.user}</span> changed{" "}
                    <span className="font-medium">{entry.field_changed}</span>{" "}
                    from{" "}
                    <span className="font-medium">
                      {entry.old_value || "empty"}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {entry.new_value || "empty"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No history available
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TicketDetail;
