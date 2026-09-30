import { useEffect, useState } from "react";
import api from "../services/api";

const emptyForm = {
  email: "",
  password: "",
  name: "",
  organisation: "",
  role: "client",
};

function RoleBadge({ role }) {
  const styles = {
    admin: "bg-purple-50 text-purple-700",
    operator: "bg-blue-50 text-blue-700",
    client: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[role] || styles.client
      }`}
    >
      {role}
    </span>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");
      setUsers(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const createUser = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setMessage("");

      await api.post("/users", {
        email: form.email,
        password: form.password,
        name: form.name,
        organisation: form.organisation || null,
        role: form.role,
      });

      setForm(emptyForm);
      setShowForm(false);
      setMessage("User created successfully.");
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to create user."
      );
    } finally {
      setCreating(false);
    }
  };

  const updateRole = async (user, newRole) => {
    if (newRole === user.role) return;

    try {
      setError("");
      setMessage("");

      await api.patch(`/users/${user.id}/role`, {
        role: newRole,
      });

      setMessage(`${user.name}'s role was updated.`);
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to update role."
      );
    }
  };

  const toggleActive = async (user) => {
    try {
      setError("");
      setMessage("");

      await api.patch(`/users/${user.id}/active`, {
        is_active: !user.is_active,
      });

      setMessage(
        user.is_active
          ? `${user.name} was deactivated.`
          : `${user.name} was activated.`
      );

      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to update account status."
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            User Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create users and manage roles and account access.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setError("");
            setMessage("");
          }}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {showForm ? "Close form" : "Create user"}
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create user form */}
      {showForm && (
        <form
          onSubmit={createUser}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Create a new user
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Full name
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                placeholder="jane@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>

              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Organisation
              </label>

              <input
                name="organisation"
                value={form.organisation}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                placeholder="Organisation name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Role
              </label>

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="client">Client</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      )}

      {/* Users */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            All users
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {users.length} user{users.length === 1 ? "" : "s"} in the
            system.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading users...
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Organisation</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {user.email}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {user.organisation || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={user.role}
                            onChange={(event) =>
                              updateRole(user, event.target.value)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                          >
                            <option value="client">Client</option>
                            <option value="operator">Operator</option>
                            <option value="admin">Admin</option>
                          </select>

                          <button
                            onClick={() => toggleActive(user)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-slate-100 md:hidden">
              {users.map((user) => (
                <div key={user.id} className="space-y-4 p-5">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {user.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      {user.email}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {user.organisation || "No organisation"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <RoleBadge role={user.role} />

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={user.role}
                      onChange={(event) =>
                        updateRole(user, event.target.value)
                      }
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                    >
                      <option value="client">Client</option>
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
                    </select>

                    <button
                      onClick={() => toggleActive(user)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
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