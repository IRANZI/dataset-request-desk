import { useEffect, useState } from "react";
import api from "../services/api";

const qualityStyles = {
  good: "bg-emerald-50 text-emerald-700",
  bad: "bg-red-50 text-red-700",
};

function QualityBadge({ quality }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        qualityStyles[quality] || "bg-slate-100 text-slate-600"
      }`}
    >
      {quality}
    </span>
  );
}

export default function Episodes() {
  const [episodes, setEpisodes] = useState([]);
  const [requests, setRequests] = useState([]);

  const [taskName, setTaskName] = useState("");
  const [quality, setQuality] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState("");

  const [assigning, setAssigning] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const loadEpisodes = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (taskName.trim()) {
        params.task_name = taskName.trim();
      }

      if (quality) {
        params.quality = quality;
      }

      const response = await api.get("/episodes", {
        params,
      });

      setEpisodes(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load episodes."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await api.get("/requests");
      setRequests(response.data);
    } catch (err) {
      console.error("Unable to load requests:", err);
    }
  };

  useEffect(() => {
    loadEpisodes();
    loadRequests();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    loadEpisodes();
  };

  const clearFilters = () => {
    setTaskName("");
    setQuality("");

    setTimeout(() => {
      loadEpisodes();
    }, 0);
  };

  const openAssignment = (episode) => {
    setSelectedEpisode(episode);
    setSelectedRequest("");
    setError("");
  };

  const assignEpisode = async () => {
    if (!selectedEpisode || !selectedRequest) {
      return;
    }

    try {
      setAssigning(true);
      setError("");

      await api.post(
        `/episodes/${selectedEpisode.id}/assign/${selectedRequest}`
      );

      setSelectedEpisode(null);
      setSelectedRequest("");

      await loadEpisodes();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to assign episode."
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const importCSV = async () => {
    if (!selectedFile) {
      setError("Please select a CSV file first.");
      return;
    }

    try {
      setImporting(true);
      setError("");
      setImportResult(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await api.post(
        "/episodes/import",
        formData
      );

      setImportResult(response.data);
      setSelectedFile(null);

      await loadEpisodes();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to import CSV file."
      );
    } finally {
      setImporting(false);
    }
  };

  const availableRequests = requests.filter(
    (request) =>
      request.status === "in_progress" ||
      request.status === "submitted" ||
      request.status === "rejected"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Dataset operations
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Episodes
        </h1>

        <p className="mt-2 text-slate-500">
          Browse, import, filter and assign robot episodes.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Import */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Import episode data
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Upload a CSV file containing robot episode metadata.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              {selectedFile
                ? selectedFile.name
                : "Choose CSV"}

              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              onClick={importCSV}
              disabled={!selectedFile || importing}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import CSV"}
            </button>
          </div>
        </div>

        {/* Import result */}
        {importResult && (
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs font-medium text-emerald-600">
                  Imported
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  {importResult.imported}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-emerald-600">
                  Skipped
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  {importResult.skipped}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-emerald-600">
                  Total processed
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  {importResult.imported +
                    importResult.skipped}
                </p>
              </div>
            </div>

            {importResult.reasons?.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-emerald-800">
                  View skipped-row reasons
                </summary>

                <div className="mt-3 max-h-64 overflow-auto rounded-lg bg-white p-3">
                  {importResult.reasons.map((reason, index) => (
                    <div
                      key={index}
                      className="border-b border-slate-100 py-2 text-xs text-slate-600 last:border-0"
                    >
                      <strong>
                        Row {reason.row}
                      </strong>{" "}
                      — {reason.reason}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="grid gap-4 md:grid-cols-[1fr_200px_auto_auto]"
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
              Quality
            </label>

            <select
              value={quality}
              onChange={(event) =>
                setQuality(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            >
              <option value="">All quality</option>
              <option value="good">Good</option>
              <option value="bad">Bad</option>
            </select>
          </div>

          <button
            type="submit"
            className="self-end rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Search
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="self-end rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>
        </form>
      </div>

      {/* Episode list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Episode library
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {episodes.length} episode
              {episodes.length === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading episodes...
          </div>
        ) : episodes.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No episodes match your filters.
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">
                      Episode
                    </th>
                    <th className="px-6 py-4">
                      Robot
                    </th>
                    <th className="px-6 py-4">
                      Task
                    </th>
                    <th className="px-6 py-4">
                      Duration
                    </th>
                    <th className="px-6 py-4">
                      Operator
                    </th>
                    <th className="px-6 py-4">
                      Quality
                    </th>
                    <th className="px-6 py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {episodes.map((episode) => (
                    <tr
                      key={episode.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-900">
                          {episode.episode_id}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          #{episode.id}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {episode.robot_id}
                      </td>

                      <td className="px-6 py-5 text-sm font-medium capitalize text-slate-800">
                        {episode.task_name}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {episode.duration_seconds}s
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {episode.operator_name}
                      </td>

                      <td className="px-6 py-5">
                        <QualityBadge
                          quality={episode.quality}
                        />
                      </td>

                      <td className="px-6 py-5">
                        {episode.quality === "good" ? (
                          <button
                            onClick={() =>
                              openAssignment(episode)
                            }
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Assign
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Not assignable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-slate-100 md:hidden">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="space-y-4 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">
                        {episode.episode_id}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {episode.robot_id}
                      </p>
                    </div>

                    <QualityBadge
                      quality={episode.quality}
                    />
                  </div>

                  <div>
                    <p className="font-semibold capitalize text-slate-800">
                      {episode.task_name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {episode.duration_seconds}s ·{" "}
                      {episode.operator_name}
                    </p>
                  </div>

                  {episode.quality === "good" && (
                    <button
                      onClick={() =>
                        openAssignment(episode)
                      }
                      className="w-full rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
                    >
                      Assign episode
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Assignment modal */}
      {selectedEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6">
              <p className="text-sm font-semibold text-blue-600">
                Episode assignment
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Assign {selectedEpisode.episode_id}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {selectedEpisode.task_name} ·{" "}
                {selectedEpisode.robot_id}
              </p>
            </div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Request
            </label>

            <select
              value={selectedRequest}
              onChange={(event) =>
                setSelectedRequest(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            >
              <option value="">
                Select a request
              </option>

              {availableRequests.map((request) => (
                <option
                  key={request.id}
                  value={request.id}
                >
                  #{request.id} — {request.task_name} —{" "}
                  {request.status}
                </option>
              ))}
            </select>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={assignEpisode}
                disabled={!selectedRequest || assigning}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {assigning
                  ? "Assigning..."
                  : "Assign episode"}
              </button>

              <button
                onClick={() => setSelectedEpisode(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}