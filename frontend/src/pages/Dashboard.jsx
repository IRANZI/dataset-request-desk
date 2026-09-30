
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard({ user }) {
  const [requests, setRequests] = useState([]);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const requestsResponse = await api.get("/requests");
      const requestData = requestsResponse.data || [];

      setRequests(requestData);

      // Episode analytics are only available to operators and admins.
      if (user?.role === "operator" || user?.role === "admin") {
        const summaryResponse = await api.get("/analytics/summary");
        setEpisodeCount(summaryResponse.data?.total_episodes || 0);
      } else {
        setEpisodeCount(0);
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const totalRequests = requests.length;

  const deliveredRequests = requests.filter(
    (request) => request.status === "delivered"
  ).length;

  const acceptedRequests = requests.filter(
    (request) => request.status === "accepted"
  ).length;

  const stats = [
    {
      label: "Total Requests",
      value: totalRequests,
      description: "Requests in the system",
    },
    {
      label: "Episodes",
      value:
        user?.role === "operator" || user?.role === "admin"
          ? episodeCount
          : "—",
      description:
        user?.role === "operator" || user?.role === "admin"
          ? "Available episodes"
          : "Operator access only",
    },
    {
      label: "Delivered",
      value: deliveredRequests,
      description: "Requests delivered",
    },
    {
      label: "Accepted",
      value: acceptedRequests,
      description: "Requests accepted",
    },
  ];

  const getStatusClasses = (status) => {
    switch (status) {
      case "submitted":
        return "bg-slate-100 text-slate-700";

      case "in_progress":
        return "bg-blue-50 text-blue-700";

      case "delivered":
        return "bg-amber-50 text-amber-700";

      case "accepted":
        return "bg-emerald-50 text-emerald-700";

      case "rejected":
        return "bg-red-50 text-red-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const formatStatus = (status) => {
    return status.replaceAll("_", " ");
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const recentRequests = requests.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Overview
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Welcome back, {user?.name || "User"}. Here is an overview of your
          dataset request activity.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading ? "..." : stat.value}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {stat.description}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                {stat.label.charAt(0)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent requests */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Requests
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your latest dataset requests and their current status.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Loading requests...
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No requests yet
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Requests will appear here once they are created.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Task
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Episodes
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Deadline
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {request.task_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Request #{request.id}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {request.episodes_requested}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(request.deadline)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                            request.status
                          )}`}
                        >
                          {formatStatus(request.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {recentRequests.map((request) => (
                <div key={request.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">
                        {request.task_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Request #{request.id}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                        request.status
                      )}`}
                    >
                      {formatStatus(request.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Episodes</p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {request.episodes_requested}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Deadline</p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDate(request.deadline)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
