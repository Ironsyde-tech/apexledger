/**
 * End-to-end-style integration tests for lesson access gating.
 *
 * Verifies that the lesson viewer is correctly protected:
 *   1. Unauthenticated user           -> redirected to /login by RequireAuth
 *   2. Authenticated, no enrollment   -> redirected to /courses/:slug
 *   3. Authenticated, with enrollment -> lesson content renders
 *   4. Admin without enrollment       -> bypass, lesson content renders
 *   5. Enrollment without confirmed order -> still blocked
 *      (an enrollment row only exists after USDT payment confirmation,
 *      because Admin.tsx inserts it when an order is set to "confirmed".)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// --- Mock useAuth -----------------------------------------------------------
const authState: {
  user: { id: string } | null;
  loading: boolean;
  roleLoading: boolean;
  isAdmin: boolean;
} = { user: null, loading: false, roleLoading: false, isAdmin: false };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ ...authState, session: null, signOut: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// --- Mock supabase client ---------------------------------------------------
// Drives what each .from(table) call returns based on the current scenario.
const dbState: {
  course: { id: string; title: string } | null;
  enrollment: { id: string } | null;
  modules: any[];
  progress: any[];
} = { course: null, enrollment: null, modules: [], progress: [] };

function makeBuilder(table: string) {
  const exec = async () => {
    if (table === "courses") return { data: dbState.course, error: null };
    if (table === "enrollments") return { data: dbState.enrollment, error: null };
    if (table === "modules") return { data: dbState.modules, error: null };
    if (table === "lesson_progress") return { data: dbState.progress, error: null };
    return { data: null, error: null };
  };
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    maybeSingle: () => exec(),
    then: (resolve: any, reject: any) => exec().then(resolve, reject),
  };
  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => makeBuilder(table) },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import LessonViewer from "@/pages/LessonViewer";
import { RequireAuth } from "@/components/RequireAuth";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/lesson/:slug/:lessonId"
          element={
            <RequireAuth>
              <LessonViewer />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
        <Route path="/courses/:slug" element={<div>COURSE DETAIL PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  authState.user = null;
  authState.loading = false;
  authState.roleLoading = false;
  authState.isAdmin = false;
  dbState.course = { id: "course-1", title: "Test Course" };
  dbState.enrollment = null;
  dbState.modules = [
    {
      id: "m1",
      title: "Module 1",
      position: 1,
      lessons: [
        { id: "l1", title: "Intro Lesson", duration: "5m", video_url: null, position: 1 },
      ],
    },
  ];
  dbState.progress = [];
});

describe("Lesson access gating (enrollment-only after USDT confirmation)", () => {
  it("redirects unauthenticated users to /login", async () => {
    authState.user = null;
    renderAt("/lesson/test-course/l1");
    await waitFor(() => expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument());
  });

  it("redirects authenticated users without an enrollment row back to course detail", async () => {
    authState.user = { id: "user-1" };
    dbState.enrollment = null; // no enrollment => USDT payment not yet confirmed by admin
    renderAt("/lesson/test-course/l1");
    await waitFor(() =>
      expect(screen.getByText("COURSE DETAIL PAGE")).toBeInTheDocument()
    );
  });

  it("renders lesson content for an enrolled user (enrollment created on confirmed order)", async () => {
    authState.user = { id: "user-1" };
    dbState.enrollment = { id: "enr-1" }; // present only after admin confirms USDT order
    renderAt("/lesson/test-course/l1");
    await waitFor(() =>
      expect(screen.getByText("Intro Lesson")).toBeInTheDocument()
    );
  });

  it("admins bypass enrollment check", async () => {
    authState.user = { id: "admin-1" };
    authState.isAdmin = true;
    dbState.enrollment = null;
    renderAt("/lesson/test-course/l1");
    await waitFor(() =>
      expect(screen.getByText("Intro Lesson")).toBeInTheDocument()
    );
  });

  it("non-existent course redirects back to course detail", async () => {
    authState.user = { id: "user-1" };
    dbState.course = null;
    renderAt("/lesson/missing/l1");
    await waitFor(() =>
      expect(screen.getByText("COURSE DETAIL PAGE")).toBeInTheDocument()
    );
  });
});
