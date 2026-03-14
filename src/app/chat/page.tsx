"use client";

import { useState, useEffect, useCallback } from "react";
import { StudyroomSidebar, type Studyroom } from "@/components/StudyroomSidebar";
import { ParticipantSidebar } from "@/components/ParticipantSidebar";
import { UnifiedChat, type CloneEntry } from "@/components/UnifiedChat";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  getAuthHeaders,
  supabase,
  waitForAuthInitialization,
} from "@/lib/supabase-client";

async function apiFetch(path: string, options: RequestInit = {}) {
  const authHeaders = await getAuthHeaders();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...("Authorization" in authHeaders
      ? { Authorization: (authHeaders as { Authorization: string }).Authorization }
      : {}),
  };
  return fetch(path, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
}

function ChatContent() {
  const [studyrooms, setStudyrooms] = useState<Studyroom[]>([]);
  const [activeStudyroomId, setActiveStudyroomId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeClones, setActiveClones] = useState<CloneEntry[]>([]);
  const [initialMessages, setInitialMessages] = useState<any[] | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.href = "/waitlist";
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    boot();
  }, []);

  const selectStudyroom = useCallback(
    async (studyroomId: string, _roomData?: Studyroom) => {
      setActiveStudyroomId(studyroomId);
      setInitialMessages(undefined);
      setActiveClones([]);
      setSessionId(null);

      try {
        const initRes = await apiFetch("/chat/init", {
          method: "POST",
          body: JSON.stringify({ mode: "god", studyroom_id: studyroomId }),
        });
        if (initRes.status === 403) {
          window.location.href = "/waitlist?pending=1";
          return;
        }
        if (!initRes.ok) throw new Error("Failed to init session");
        const session = await initRes.json();
        setSessionId(session.id);

        if (session.active_clones && session.active_clones.length > 0) {
          const cloneEntries: CloneEntry[] = session.active_clones.map(
            (id: unknown) => ({
              id: String(id),
              name: String(id),
            })
          );
          setActiveClones(cloneEntries);
        }

        const histRes = await apiFetch(
          `/chat/history?session_id=${session.id}`
        );
        if (histRes.ok) {
          const messages = await histRes.json();
          setInitialMessages(messages || []);
        } else {
          setInitialMessages([]);
        }
      } catch (err: unknown) {
        console.error("[CHAT] selectStudyroom error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load studyroom"
        );
      }
    },
    []
  );

  async function boot() {
    try {
      await waitForAuthInitialization();

      const res = await apiFetch("/studyrooms");
      if (res.status === 401) {
        window.location.href = "/waitlist";
        return;
      }
      if (res.status === 403) {
        // Pending approval - redirect to waitlist with message
        window.location.href = "/waitlist?pending=1";
        return;
      }
      if (!res.ok) throw new Error("Failed to load studyrooms");

      let rooms: Studyroom[] = await res.json();

      if (rooms.length === 0) {
        const createRes = await apiFetch("/studyrooms", {
          method: "POST",
          body: JSON.stringify({}),
        });
        if (!createRes.ok) throw new Error("Failed to create initial studyroom");
        const newRoom = await createRes.json();
        rooms = [newRoom];
      }

      setStudyrooms(rooms);
      await selectStudyroom(rooms[0].id, rooms[0]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "Failed to initialize"
      );
    } finally {
      setLoading(false);
    }
  }

  const createStudyroom = useCallback(async () => {
    try {
      const res = await apiFetch("/studyrooms", {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to create studyroom");
      const newRoom: Studyroom = await res.json();
      setStudyrooms((prev) => [newRoom, ...prev]);
      await selectStudyroom(newRoom.id, newRoom);
    } catch (err: unknown) {
      console.error("[CHAT] createStudyroom error:", err);
    }
  }, [selectStudyroom]);

  const renameStudyroom = useCallback(async (id: string, name: string) => {
    try {
      const res = await apiFetch(`/studyrooms/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to rename studyroom");
      const updated = await res.json();
      setStudyrooms((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, display_name: updated.display_name } : r
        )
      );
    } catch (err: unknown) {
      console.error("[CHAT] renameStudyroom error:", err);
    }
  }, []);

  const deleteStudyroom = useCallback(
    async (id: string) => {
      try {
        const res = await apiFetch(`/studyrooms/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete studyroom");

        setStudyrooms((prev) => {
          const remaining = prev.filter((r) => r.id !== id);
          if (id === activeStudyroomId && remaining.length > 0) {
            selectStudyroom(remaining[0].id, remaining[0]);
          }
          return remaining;
        });
      } catch (err: unknown) {
        console.error("[CHAT] deleteStudyroom error:", err);
      }
    },
    [activeStudyroomId, selectStudyroom]
  );

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-white)",
          color: "var(--color-gray-400)",
        }}
      >
        <p style={{ fontSize: "var(--text-lg)" }}>
          Loading studyrooms...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-white)",
          padding: "var(--space-xl)",
        }}
      >
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            padding: "var(--space-2xl)",
            borderRadius: "0.5rem",
            maxWidth: "500px",
          }}
        >
          <h2
            style={{
              marginBottom: "var(--space-base)",
              fontSize: "var(--text-lg)",
            }}
          >
            Session Error
          </h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-white)",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-white)",
          borderBottom: "1px solid var(--color-gray-100)",
          padding: "var(--space-lg) var(--space-xl)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--text-2xl)",
            fontWeight: "700",
            color: "var(--color-navy)",
            margin: 0,
          }}
        >
          Capy Studyroom
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <StudyroomSidebar
          studyrooms={studyrooms}
          activeStudyroomId={activeStudyroomId}
          onSelect={(id) => {
            const room = studyrooms.find((r) => r.id === id);
            selectStudyroom(id, room);
          }}
          onCreate={createStudyroom}
          onRename={renameStudyroom}
          onDelete={deleteStudyroom}
        />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {sessionId ? (
            <UnifiedChat
              key={sessionId}
              sessionId={sessionId}
              activeClones={activeClones}
              onActiveClonesChange={setActiveClones}
              initialMessages={initialMessages}
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-gray-400)",
              }}
            >
              <p>Select a studyroom to begin</p>
            </div>
          )}
        </div>
        <ParticipantSidebar currentUserId="you" activeClones={activeClones} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute component={<ChatContent />} />
  );
}
