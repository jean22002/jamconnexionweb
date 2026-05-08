import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

export const musicianAccountingApi = {
  /**
   * List all musician accounting entries (one per event).
   */
  list: async (token) => {
    const res = await axios.get(`${API}/musicians/me/accounting`, {
      headers: authHeaders(token),
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * Get a single entry by event_id. Returns null on 404.
   */
  getOne: async (token, eventId) => {
    try {
      const res = await axios.get(
        `${API}/musicians/me/accounting/${encodeURIComponent(eventId)}`,
        { headers: authHeaders(token) }
      );
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  /**
   * Upsert an entry. Returns the saved entry (with server-side GUSO calculations).
   */
  save: async (token, entry) => {
    const eventId = entry.event_id;
    const res = await axios.put(
      `${API}/musicians/me/accounting/${encodeURIComponent(eventId)}`,
      entry,
      { headers: authHeaders(token) }
    );
    return res.data;
  },

  /**
   * Delete an entry.
   */
  remove: async (token, eventId) => {
    await axios.delete(
      `${API}/musicians/me/accounting/${encodeURIComponent(eventId)}`,
      { headers: authHeaders(token) }
    );
  },
};

export default musicianAccountingApi;
