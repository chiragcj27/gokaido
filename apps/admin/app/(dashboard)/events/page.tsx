"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { GokaidoEvent } from "../../../lib/types";
import EventForm from "../../../components/EventForm";

export default function EventsPage() {
  const [events, setEvents] = useState<GokaidoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GokaidoEvent | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ events: GokaidoEvent[] }>("/api/events/admin");
      setEvents(res.events);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleActive(event: GokaidoEvent) {
    try {
      await api.patch(`/api/events/${event._id}`, { isActive: !event.isActive });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update event");
    }
  }

  async function handleDelete(event: GokaidoEvent) {
    if (!window.confirm(`Delete ${event.name} (${event.year})? This can't be undone.`)) return;
    try {
      await api.delete(`/api/events/${event._id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete event");
    }
  }

  if (editing) {
    return (
      <EventForm
        event={editing === "new" ? null : editing}
        onDone={() => {
          setEditing(null);
          load();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Events</h1>
        <button type="button" onClick={() => setEditing("new")}>
          New event
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Photo</th>
                <th>Year</th>
                <th>Name</th>
                <th>Sport</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((s) => (
                <tr key={s._id}>
                  <td className="mono">{s.sortOrder}</td>
                  <td>{s.images[0] ? <img src={s.images[0]} alt="" className="thumb" /> : "—"}</td>
                  <td className="mono">{s.year}</td>
                  <td>{s.name}</td>
                  <td>{s.sport}</td>
                  <td>
                    <span className={`pill ${s.isActive ? "pill-active" : "pill-inactive"}`}>
                      {s.isActive ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button type="button" onClick={() => setEditing(s)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleToggleActive(s)}>
                      {s.isActive ? "Hide" : "Show"}
                    </button>
                    <button type="button" onClick={() => handleDelete(s)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-row">
                    No events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
