import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, KeyRound, Mail, Camera, Shield, LogOut, CheckCircle2,
  AlertCircle, Loader2, Eye, EyeOff, Calendar, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ProfileData = {
  full_name: string;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
};

export default function Profile() {
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();

  // Profile fields
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Avatar
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Password change
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Stats
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);

  // Load profile
  const loadProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, email, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
      setFullName(data.full_name ?? "");
      setAvatarPreview(data.avatar_url);
    }

    // Stats
    const [enrollments, progress] = await Promise.all([
      supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("lesson_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
    ]);
    setEnrolledCount(enrollments.count ?? 0);
    setCompletedLessons(progress.count ?? 0);
    setProfileLoading(false);
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Save profile name
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Name cannot be empty.");
    setSaving(true);

    const { error: authErr } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });
    if (authErr) { setSaving(false); return toast.error(authErr.message); }

    if (user) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", user.id);
    }
    setSaving(false);
    toast.success("Profile updated successfully.");
  };

  // Avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image must be under 5MB.");
    }

    if (!file.type.startsWith("image/")) {
      return toast.error("Please select an image file.");
    }

    setAvatarUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;

    // Upload to storage
    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) {
      setAvatarUploading(false);
      return toast.error(`Upload failed: ${uploadErr.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`; // cache-bust

    // Update profile table
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

    // Update auth metadata
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

    setAvatarPreview(publicUrl);
    setAvatarUploading(false);
    toast.success("Profile photo updated!");
  };

  // Change email
  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || trimmed === user?.email) return toast.error("Enter a different email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return toast.error("Invalid email format.");

    setEmailSaving(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setEmailSaving(false);

    if (error) return toast.error(error.message);
    toast.success("Confirmation email sent to both addresses. Please verify to complete the change.");
    setNewEmail("");
    setShowEmailForm(false);
  };

  // Change password
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match.");

    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);

    if (error) return toast.error(error.message);
    toast.success("Password updated successfully.");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Password strength
  const pwStrength = (() => {
    if (!newPassword) return { score: 0, label: "", color: "" };
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (newPassword.length >= 12) s++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) s++;
    if (/\d/.test(newPassword)) s++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) s++;
    if (s <= 1) return { score: 1, label: "Weak", color: "bg-destructive" };
    if (s <= 2) return { score: 2, label: "Fair", color: "bg-warning" };
    if (s <= 3) return { score: 3, label: "Good", color: "bg-primary" };
    return { score: 4, label: "Strong", color: "bg-green-500" };
  })();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const initials = (fullName || user?.email || "?")
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  if (profileLoading) {
    return (
      <section className="container py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground mt-3">Loading profile…</p>
      </section>
    );
  }

  return (
    <section className="container px-4 sm:px-6 py-10 md:py-16 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-5 sm:gap-6 mb-10 md:mb-12">
        {/* Avatar */}
        <div className="relative group shrink-0">
          <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full gold-border overflow-hidden flex items-center justify-center bg-secondary/40">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl sm:text-3xl font-display text-primary">{initials}</span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60 sm:opacity-0 sm:group-hover:opacity-100 opacity-0 active:opacity-100 transition-all cursor-pointer"
          >
            {avatarUploading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </button>
          {/* Mobile camera badge (always visible) */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="sm:hidden absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
          >
            {avatarUploading ? (
              <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5 text-primary-foreground" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-primary mb-1">Account</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl truncate">{fullName || "Your Profile"}</h1>
          <p className="text-sm text-muted-foreground mt-1 truncate">{user?.email}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Member since {memberSince}
            </span>
            {isAdmin && (
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <Shield className="h-3.5 w-3.5" /> Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 md:mb-10">
        <div className="gold-border rounded-xl p-4 sm:p-5 text-center">
          <p className="font-display text-2xl sm:text-3xl text-primary">{enrolledCount}</p>
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mt-1">Courses enrolled</p>
        </div>
        <div className="gold-border rounded-xl p-4 sm:p-5 text-center">
          <p className="font-display text-2xl sm:text-3xl text-primary">{completedLessons}</p>
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mt-1">Lessons completed</p>
        </div>
        <div className="gold-border rounded-xl p-4 sm:p-5 text-center col-span-2 sm:col-span-1">
          <p className="font-display text-2xl sm:text-3xl text-primary">{memberSince.split(" ")[0] ?? "—"}</p>
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mt-1">Joined {memberSince.split(",")[0]?.split(" ").pop()}</p>
        </div>
      </div>

      {/* Personal Information */}
      <form onSubmit={saveProfile} className="gold-border rounded-xl p-5 sm:p-8 space-y-5 mb-5 sm:mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl">Personal Information</h2>
            <p className="text-xs text-muted-foreground">Update your name and profile details</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <Label>Email address</Label>
            <Input value={user?.email ?? ""} disabled className="opacity-60" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="gold" type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Save changes</>
            )}
          </Button>
        </div>
      </form>

      {/* Change Email */}
      <div className="gold-border rounded-xl p-5 sm:p-8 space-y-5 mb-5 sm:mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl sm:text-2xl">Email Address</h2>
            <p className="text-xs text-muted-foreground">Change the email associated with your account</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 hidden sm:block" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-[11px] text-muted-foreground">Current email address</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowEmailForm(!showEmailForm)}
            className="w-full sm:w-auto"
          >
            {showEmailForm ? "Cancel" : "Change"}
          </Button>
        </div>

        {showEmailForm && (
          <form onSubmit={changeEmail} className="space-y-4 pt-2">
            <div>
              <Label>New email address</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="your-new-email@example.com"
                required
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                You'll receive a confirmation email at both addresses.
              </p>
            </div>
            <Button variant="gold" type="submit" disabled={emailSaving} className="w-full sm:w-auto">
              {emailSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                "Send confirmation"
              )}
            </Button>
          </form>
        )}
      </div>

      {/* Change Password */}
      <form onSubmit={changePassword} className="gold-border rounded-xl p-5 sm:p-8 space-y-5 mb-5 sm:mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <KeyRound className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl">Security</h2>
            <p className="text-xs text-muted-foreground">Update your password to keep your account secure</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>New password</Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password strength bar */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        i <= pwStrength.score ? pwStrength.color : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">{pwStrength.label}</p>
              </div>
            )}
          </div>

          <div>
            <Label>Confirm new password</Label>
            <div className="relative">
              <Input
                type={showConfirmPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Repeat your new password"
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Match indicator */}
            {confirmPassword && (
              <p className={`text-[11px] mt-1 flex items-center gap-1 ${
                confirmPassword === newPassword ? "text-green-500" : "text-destructive"
              }`}>
                {confirmPassword === newPassword ? (
                  <><CheckCircle2 className="h-3 w-3" /> Passwords match</>
                ) : (
                  <><AlertCircle className="h-3 w-3" /> Passwords don't match</>
                )}
              </p>
            )}
          </div>
        </div>

        <Button variant="gold" type="submit" disabled={changingPw} className="w-full sm:w-auto">
          {changingPw ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>
          ) : (
            <><KeyRound className="h-4 w-4" /> Update password</>
          )}
        </Button>
      </form>

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/30 p-5 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <LogOut className="h-4.5 w-4.5 text-destructive" />
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl">Sign Out</h2>
            <p className="text-xs text-muted-foreground">Sign out from all devices</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full sm:w-auto border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={async () => {
            await signOut();
            nav("/");
            toast.success("Signed out successfully.");
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out of your account
        </Button>
      </div>
    </section>
  );
}
