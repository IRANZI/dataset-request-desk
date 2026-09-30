import { useEffect, useState } from "react";
import api from "../services/api";

const statIcons = {
  requests: "RQ",
  episodes: "EP",
  delivered: "DL",
  accepted: "AC",
};

function StatCard({ title, value, description, type }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-600">
          {statIcons[type]}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default function Dashboard({ user }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await api.get("/requests");
        setRequests(response.data);
      } catch (error) {
        console.error("Failed to load requests:", error);
      }
    };

    loadRequests();
  }, []);

  const delivered = requests.filter(
    (request) => request.status === "delivered"
  ).length;

  const accepted = requests.filter(
    (request) => request.status === "accepted"
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-blue-600">
          Overview
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Welcome back, {user?.name || "there"}
        </h1>

        <p className="mt-2 text-slate-500">
          Here's what's happening with your dataset requests.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total requests"
          value={requests.length}
          description="Requests in your workspace"
          type="requests"
        />

        <StatCard
          title="Episodes"
          value="111"
          description="Imported valid episodes"
          type="episodes"
        />

        <StatCard
          title="Delivered"
          value={delivered}
          description="Requests awaiting review"
          type="delivered"
        />

        <StatCard
          title="Accepted"
          value={accepted}
          description="Successfully completed"
          type="accepted"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent requests
            </h2>
            <p className="text-sm text-slate-500">
              Your latest dataset activity
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {user?.role}
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            No requests yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.slice(0, 5).map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {request.task_name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {request.episodes_requested} episodes · Deadline{" "}
                    {request.deadline}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                  {request.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}