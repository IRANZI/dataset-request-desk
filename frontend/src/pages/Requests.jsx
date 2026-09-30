import { useEffect, useState } from "react";

import api from "../services/api";


const statusStyles = {
  submitted: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-50 text-blue-700",
  delivered: "bg-purple-50 text-purple-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};


function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        statusStyles[status] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}


export default function Requests() {
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [taskName, setTaskName] = useState("");
  const [episodesRequested, setEpisodesRequested] =
    useState(1);
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);


  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const isClient = user?.role === "client";
  const isOperator =
    user?.role === "operator" ||
    user?.role === "admin";


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


  const createRequest = async (event) => {
    event.preventDefault();

    if (!taskName.trim()) {
      setError("Please enter a task name.");
      return;
    }

    if (Number(episodesRequested) <= 0) {
      setError(
        "The number of requested episodes must be greater than zero."
      );
      return;
    }

    if (!deadline) {
      setError("Please select a deadline.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      await api.post("/requests", {
        task_name: taskName.trim(),
        episodes_requested:
          Number(episodesRequested),
        deadline,
        notes: notes.trim() || null,
      });

      setTaskName("");
      setEpisodesRequested(1);
      setDeadline("");
      setNotes("");

      setShowCreate(false);

      setSuccess(
        "Request created successfully."
      );

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


  const updateStatus = async (
    request,
    newStatus
  ) => {
    try {
      setUpdatingId(request.id);
      setError("");
      setSuccess("");

      await api.patch(
        `/requests/${request.id}/status`,
        {
          status: newStatus,
        }
      );

      const messages = {
        in_progress:
          "Request moved to in progress.",
        delivered:
          "Request delivered successfully.",
        accepted:
          "Request accepted successfully.",
        rejected:
          "Request rejected and returned to in progress.",
      };

      setSuccess(
        messages[newStatus] ||
          "Request updated successfully."
      );

      await loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update request."
      );
    } finally {
      setUpdatingId(null);
    }
  };


  const canDeliver = (request) => {
    return (
      request.status === "in_progress" &&
      request.assigned_count ===
        request.episodes_requested
    );
  };


  const hasEnoughEpisodes = (request) => {
    return (
      request.assigned_count >=
      request.episodes_requested
    );
  };


  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Request management
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Requests
          </h1>

          <p className="mt-2 text-slate-500">
            Manage dataset requests and track fulfillment.
          </p>
        </div>

        {isClient && (
          <button
            onClick={() => {
              setShowCreate(true);
              setError("");
              setSuccess("");
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + New request
          </button>
        )}
      </div>


      {/* Success */}
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span className="font-bold">
            ✓
          </span>

          <span>{success}</span>
        </div>
      )}


      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-bold">
            !
          </span>

          <span>{error}</span>
        </div>
      )}


      {/* Create request */}
      {showCreate && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Create dataset request
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tell the operator what dataset you need.
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
                value={taskName}
                onChange={(event) =>
                  setTaskName(event.target.value)
                }
                placeholder="e.g. pick cup"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>


            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Episodes requested
              </label>

              <input
                type="number"
                min="1"
                value={episodesRequested}
                onChange={(event) =>
                  setEpisodesRequested(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>


            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Deadline
              </label>

              <input
                type="date"
                value={deadline}
                onChange={(event) =>
                  setDeadline(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>


            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </label>

              <input
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="Optional notes"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>


            <div className="flex flex-col gap-3 sm:flex-row md:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "Creating..."
                  : "Create request"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                disabled={creating}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      )}


      {/* Requests */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <h2 className="font-bold text-slate-900">
            Dataset requests
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {requests.length} request
            {requests.length === 1
              ? ""
              : "s"}
          </p>
        </div>


        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No requests found.
          </div>
        ) : (

          <div className="divide-y divide-slate-100">

            {requests.map((request) => {

              const assigned =
                Number(
                  request.assigned_count || 0
                );

              const requested =
                Number(
                  request.episodes_requested
                );

              const remaining =
                Math.max(
                  requested - assigned,
                  0
                );

              const exact =
                assigned === requested;

              const overAssigned =
                assigned > requested;


              return (
                <div
                  key={request.id}
                  className="p-5 sm:p-6"
                >

                  {/* Top */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                    <div>
                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-lg font-bold capitalize text-slate-900">
                          {request.task_name}
                        </h3>

                        <StatusBadge
                          status={request.status}
                        />

                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Request #{request.id}
                      </p>
                    </div>


                    {/* Progress */}
                    <div className="min-w-[220px]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">
                          Episodes
                        </span>

                        <span
                          className={`font-bold ${
                            overAssigned
                              ? "text-red-600"
                              : exact
                              ? "text-emerald-600"
                              : "text-slate-700"
                          }`}
                        >
                          {assigned} / {requested}
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            overAssigned
                              ? "bg-red-500"
                              : exact
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              (assigned /
                                requested) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {overAssigned
                          ? `${assigned - requested} extra episode(s)`
                          : remaining > 0
                          ? `${remaining} more episode(s) needed`
                          : "All requested episodes assigned"}
                      </p>
                    </div>

                  </div>


                  {/* Details */}
                  <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Requested
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {requested} episodes
                      </p>
                    </div>


                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Assigned
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {assigned} episodes
                      </p>
                    </div>


                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Deadline
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {request.deadline}
                      </p>
                    </div>

                  </div>


                  {/* Ready message */}
                  {isOperator &&
                    request.status ===
                      "in_progress" &&
                    exact && (
                      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <p className="font-semibold text-emerald-800">
                            ✓ Request ready for delivery
                          </p>

                          <p className="mt-1 text-sm text-emerald-700">
                            All {requested} requested
                            episodes have been assigned.
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            updateStatus(
                              request,
                              "delivered"
                            )
                          }
                          disabled={
                            updatingId ===
                            request.id
                          }
                          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingId ===
                          request.id
                            ? "Delivering..."
                            : "Deliver dataset"}
                        </button>

                      </div>
                    )}


                  {/* Not enough */}
                  {isOperator &&
                    request.status ===
                      "in_progress" &&
                    assigned < requested && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="font-semibold text-amber-800">
                          Dataset not ready yet
                        </p>

                        <p className="mt-1 text-sm text-amber-700">
                          Assign{" "}
                          {requested -
                            assigned}{" "}
                          more episode
                          {requested -
                            assigned ===
                          1
                            ? ""
                            : "s"}{" "}
                          before delivering.
                        </p>
                      </div>
                    )}


                  {/* Client review */}
                  {isClient &&
                    request.status ===
                      "delivered" && (
                      <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4">

                        <p className="font-semibold text-purple-800">
                          Dataset delivered
                        </p>

                        <p className="mt-1 text-sm text-purple-700">
                          Please review the delivered
                          dataset and choose whether to
                          accept or reject it.
                        </p>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">

                          <button
                            onClick={() =>
                              updateStatus(
                                request,
                                "accepted"
                              )
                            }
                            disabled={
                              updatingId ===
                              request.id
                            }
                            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {updatingId ===
                            request.id
                              ? "Updating..."
                              : "Accept dataset"}
                          </button>


                          <button
                            onClick={() =>
                              updateStatus(
                                request,
                                "rejected"
                              )
                            }
                            disabled={
                              updatingId ===
                              request.id
                            }
                            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject dataset
                          </button>

                        </div>

                      </div>
                    )}


                  {/* Rejected */}
                  {isOperator &&
                    request.status ===
                      "rejected" && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

                        <p className="font-semibold text-red-800">
                          Dataset rejected
                        </p>

                        <p className="mt-1 text-sm text-red-700">
                          The client rejected this
                          dataset. Move the request back
                          to in progress to work on it
                          again.
                        </p>

                        <button
                          onClick={() =>
                            updateStatus(
                              request,
                              "in_progress"
                            )
                          }
                          disabled={
                            updatingId ===
                            request.id
                          }
                          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updatingId ===
                          request.id
                            ? "Updating..."
                            : "Resume request"}
                        </button>

                      </div>
                    )}


                  {/* Submitted */}
                  {isOperator &&
                    request.status ===
                      "submitted" && (
                      <div className="mt-4">

                        <button
                          onClick={() =>
                            updateStatus(
                              request,
                              "in_progress"
                            )
                          }
                          disabled={
                            updatingId ===
                            request.id
                          }
                          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updatingId ===
                          request.id
                            ? "Starting..."
                            : "Start working"}
                        </button>

                      </div>
                    )}


                  {/* Accepted */}
                  {request.status ===
                    "accepted" && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                      ✓ This request has been accepted by
                      the client.
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}