import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun, Bell, Lock, Globe, DollarSign, Check, Loader2 } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import { useCurrency } from "@/context/currency-context";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — Investa" },
      {
        name: "description",
        content: "Configure theme, language, currency, notifications, and security preferences.",
      },
    ],
  }),
});

// Storage keys for localStorage
const STORAGE_KEYS = {
  LANGUAGE: "app_language",
  NOTIFICATIONS: "app_notifications",
};

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency: setGlobalCurrency } = useCurrency();

  // Load from localStorage or use defaults
  const [language, setLanguage] = useState("en");
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [notifications, setNotifications] = useState({ email: true, push: true, alerts: true });

  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || "en";
    const savedNotifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);

    setLanguage(savedLanguage);
    setLocalCurrency(currency);
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, [currency]);

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setHasChanges(true);
  };

  // Handle currency change
  const handleCurrencyChange = (newCurrency: string) => {
    setLocalCurrency(newCurrency);
    setHasChanges(true);
  };

  // Handle notification change
  const handleNotificationChange = (key: "email" | "push" | "alerts") => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  // Save all changes to localStorage and global state
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Simulate save delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));

      // Update global currency context
      if (localCurrency !== currency) {
        setGlobalCurrency(localCurrency as "USD" | "INR" | "EUR" | "GBP");
      }

      // Reset state
      setHasChanges(false);
      setIsSaving(false);

      // Show success toast
      toast.success("Settings saved successfully!", {
        description:
          localCurrency !== currency
            ? `Currency changed to ${localCurrency}`
            : "Your preferences have been updated",
        duration: 3000,
      });
    } catch (error) {
      setIsSaving(false);
      toast.error("Failed to save settings", {
        description: "Please try again",
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Preferences</p>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <SettingsGroup title="Appearance" icon={<Sun className="h-4 w-4" />}>
        <div className="flex gap-2">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md border p-3 text-sm capitalize",
                theme === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-surface-elevated",
              )}
            >
              {t === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {t}
            </button>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup title="Language" icon={<Globe className="h-4 w-4" />}>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="w-full rounded-md border bg-surface px-3 py-2 text-sm"
        >
          <option value="en">English (US)</option>
          <option value="en-gb">English (UK)</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="es">Español</option>
          <option value="de">Deutsch</option>
        </select>
      </SettingsGroup>

      <SettingsGroup title="Currency" icon={<DollarSign className="h-4 w-4" />}>
        <div className="space-y-3">
          <select
            value={localCurrency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="w-full rounded-md border bg-surface px-3 py-2 text-sm transition-all"
          >
            <option value="USD">USD — US Dollar</option>
            <option value="INR">INR — Indian Rupee</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </select>
          {hasChanges && (
            <p className="text-xs text-amber-500">
              ⚠️ Unsaved changes - Click "Save Changes" to apply
            </p>
          )}
        </div>
      </SettingsGroup>

      <SettingsGroup title="Notifications" icon={<Bell className="h-4 w-4" />}>
        {(["email", "push", "alerts"] as const).map((k) => (
          <label
            key={k}
            className="flex items-center justify-between border-t py-2 first:border-t-0 text-sm cursor-pointer hover:bg-surface-elevated/50 px-2 -mx-2 rounded transition-colors"
          >
            <span className="capitalize">{k} notifications</span>
            <input
              type="checkbox"
              checked={notifications[k]}
              onChange={() => handleNotificationChange(k)}
              className="h-4 w-4 accent-primary cursor-pointer"
            />
          </label>
        ))}
      </SettingsGroup>

      <SettingsGroup title="Security" icon={<Lock className="h-4 w-4" />}>
        <button
          onClick={() => toast.success("Password reset link sent")}
          className="w-full rounded-md border py-2 text-sm hover:bg-surface-elevated transition-colors"
        >
          Change password
        </button>
        <button
          onClick={() => toast.info("2FA setup opened")}
          className="mt-2 w-full rounded-md border py-2 text-sm hover:bg-surface-elevated transition-colors"
        >
          Enable two-factor authentication
        </button>
      </SettingsGroup>

      {/* Save Changes Button - Sticky at bottom */}
      {hasChanges && (
        <div className="sticky bottom-0 left-0 right-0 -mx-4 -mb-4 border-t bg-card/95 backdrop-blur-sm p-4 lg:p-6">
          <div className="mx-auto max-w-3xl">
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                isSaving
                  ? "bg-primary/50 text-primary-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95",
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Changes will be applied immediately across the app
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}
