import { useEffect, useState } from "react";
import api from "../services/api";

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export default function Analytics() {
  const [requestStats, setRequestStats] = useState([]);
  const [topTasks, setTopTasks] = useState([]);
  const [episodesPerDay, setEpisodesPerDay] = useState([]);
  const [deliveryTime, setDeliveryTime] = useState(null);

  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        requestsResponse,
        tasksResponse,
        episodesResponse,
        deliveryResponse,
      ] = await Promise.all([
        api.get("/analytics/requests"),
        api.get("/analytics/top-tasks"),
        api.get("/analytics/episodes-per-day", {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        }),
        api.get("/analytics/delivery-time"),
      ]);

      setRequestStats(requestsResponse.data);
      setTopTasks(tasksResponse.data);
      setEpisodesPerDay(episodesResponse.data);
      setDeliveryTime(deliveryResponse.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Unable to load analytics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const getStatusCount = (status) => {
    return requestStats.find((item) => item.status === status)?.count || 0;
  };

  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) {
      return "N/A";
    }

    const minutes = Math.round(seconds / 60);

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor dataset requests, episode production, and delivery
          performance.
        </p>
      </div>

      {/* Date filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Episode production period
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose the date range used for episode-per-day analytics.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                End date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={loadAnalytics}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Request statistics */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Request overview
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard
                title="Submitted"
                value={getStatusCount("submitted")}
              />

              <StatCard
                title="In progress"
                value={getStatusCount("in_progress")}
              />

              <StatCard
                title="Delivered"
                value={getStatusCount("delivered")}
              />

              <StatCard
                title="Accepted"
                value={getStatusCount("accepted")}
              />

              <StatCard
                title="Rejected"
                value={getStatusCount("rejected")}
              />
            </div>
          </div>

          {/* Delivery time */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <StatCard
                title="Median delivery time"
                value={formatDuration(deliveryTime?.median_seconds)}
                subtitle="Submitted → Delivered"
              />
            </div>
          </div>

          {/* Top tasks */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900">
                  Top 5 task names
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tasks with the most good-quality episodes.
                </p>
              </div>

              {topTasks.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  No task data available.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {topTasks.map((task, index) => (
                    <div
                      key={task.task_name}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                          {index + 1}
                        </span>

                        <span className="font-medium text-slate-800">
                          {task.task_name}
                        </span>
                      </div>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                        {task.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Episodes per day */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900">
                  Episodes per day
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Episode production grouped by recording date and robot.
                </p>
              </div>

              {episodesPerDay.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  No episode data available for this period.
                </div>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Robot</th>
                        <th className="px-5 py-3 text-right">Episodes</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {episodesPerDay.map((item, index) => (
                        <tr key={`${item.day}-${item.robot_id}-${index}`}>
                          <td className="px-5 py-3 text-slate-700">
                            {item.day}
                          </td>

                          <td className="px-5 py-3 font-medium text-slate-800">
                            {item.robot_id}
                          </td>

                          <td className="px-5 py-3 text-right font-semibold text-slate-900">
                            {item.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}