import { useEffect, useState } from "react";
import api from "../services/api";

const statusStyles = {
  submitted: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-50 text-blue-700",
  delivered: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        statusStyles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default function Requests({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    task_name: "",
    episodes_requested: 1,
    deadline: "",
    notes: "",
  });

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/requests");
      setRequests(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "episodes_requested"
          ? Number(value)
          : value,
    }));
  };

  const createRequest = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");

      await api.post("/requests", form);

      setForm({
        task_name: "",
        episodes_requested: 1,
        deadline: "",
        notes: "",
      });

      setShowForm(false);

      await loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to create request."
      );
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (requestId, newStatus) => {
    try {
      setError("");

      await api.patch(
        `/requests/${requestId}/status`,
        {
          status: newStatus,
        }
      );

      await loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update request status."
      );
    }
  };

  const isClient = user?.role === "client";
  const isOperator =
    user?.role === "operator" || user?.role === "admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Workspace
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Requests
          </h1>

          <p className="mt-2 text-slate-500">
            {isClient
              ? "Create and track your dataset requests."
              : "Manage dataset requests and their workflow."}
          </p>
        </div>

        {isClient && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + New request
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Create dataset request
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tell the operations team what dataset you need.
            </p>
          </div>

          <form
            onSubmit={createRequest}
            className="grid gap-5 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Task name
              </label>

              <input
                name="task_name"
                value={form.task_name}
                onChange={handleChange}
                placeholder="e.g. pick cup"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Episodes requested
              </label>

              <input
                type="number"
                name="episodes_requested"
                min="1"
                value={form.episodes_requested}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Deadline
              </label>

              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </label>

              <input
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row md:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create request"}
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                {isClient ? "My requests" : "All requests"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {requests.length} request
                {requests.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              —
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No requests yet
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {isClient
                ? "Create your first dataset request to get started."
                : "No dataset requests have been created."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Task</th>

                    {!isClient && (
                      <th className="px-6 py-4">
                        Client
                      </th>
                    )}

                    <th className="px-6 py-4">
                      Episodes
                    </th>

                    <th className="px-6 py-4">
                      Deadline
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-6 py-5">
                        <p className="font-semibold capitalize text-slate-900">
                          {request.task_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Request #{request.id}
                        </p>
                      </td>

                      {!isClient && (
                        <td className="px-6 py-5 text-sm text-slate-600">
                          Client #{request.client_id}
                        </td>
                      )}

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {request.episodes_requested}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {request.deadline}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={request.status} />
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {isOperator &&
                            request.status === "submitted" && (
                              <button
                                onClick={() =>
                                  updateStatus(
                                    request.id,
                                    "in_progress"
                                  )
                                }
                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                Start
                              </button>
                            )}

                          {isOperator &&
                            request.status === "rejected" && (
                              <button
                                onClick={() =>
                                  updateStatus(
                                    request.id,
                                    "in_progress"
                                  )
                                }
                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                Resume
                              </button>
                            )}

                          {isClient &&
                            request.status === "delivered" && (
                              <>
                                <button
                                  onClick={() =>
                                    updateStatus(
                                      request.id,
                                      "accepted"
                                    )
                                  }
                                  className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                >
                                  Accept
                                </button>

                                <button
                                  onClick={() =>
                                    updateStatus(
                                      request.id,
                                      "rejected"
                                    )
                                  }
                                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                          {isOperator &&
                            request.status ===
                              "in_progress" && (
                              <span className="text-xs text-slate-400">
                                Assign required episodes to
                                deliver
                              </span>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="space-y-4 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold capitalize text-slate-900">
                        {request.task_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Request #{request.id}
                      </p>
                    </div>

                    <StatusBadge status={request.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Episodes
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {request.episodes_requested}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Deadline
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {request.deadline}
                      </p>
                    </div>
                  </div>

                  {!isClient && (
                    <p className="text-sm text-slate-500">
                      Client #{request.client_id}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {isOperator &&
                      request.status === "submitted" && (
                        <button
                          onClick={() =>
                            updateStatus(
                              request.id,
                              "in_progress"
                            )
                          }
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                        >
                          Start request
                        </button>
                      )}

                    {isOperator &&
                      request.status === "rejected" && (
                        <button
                          onClick={() =>
                            updateStatus(
                              request.id,
                              "in_progress"
                            )
                          }
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                        >
                          Resume request
                        </button>
                      )}

                    {isClient &&
                      request.status === "delivered" && (
                        <>
                          <button
                            onClick={() =>
                              updateStatus(
                                request.id,
                                "accepted"
                              )
                            }
                            className="rounded-lg bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700"
                          >
                            Accept
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(
                                request.id,
                                "rejected"
                              )
                            }
                            className="rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}