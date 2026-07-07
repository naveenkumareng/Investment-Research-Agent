import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { formatDate } from "@/utils/format";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — Investa" },
      { name: "description", content: "Manage your Investa profile and account details." },
    ],
  }),
});

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, email });
    toast.success("Profile updated");
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 lg:p-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Account</p>
        <h1 className="text-2xl font-semibold">Profile</h1>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold uppercase text-primary">
            {user.name?.[0] ?? "U"}
          </div>
          <div>
            <div className="text-lg font-semibold">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Member since {formatDate(user.createdAt)} · Role:{" "}
              <span className="capitalize">{user.role}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={save} className="space-y-3 rounded-xl border bg-card p-5">
        <div className="text-sm font-semibold">Edit Profile</div>
        <label className="block">
          <span className="text-xs text-muted-foreground">Full name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
