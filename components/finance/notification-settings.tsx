"use client";

import { useEffect, useState, useTransition } from "react";
import { BellOff, BellRing, LoaderCircle } from "lucide-react";
import { deletePushSubscription, savePushSubscription } from "@/app/protected/settings/notification-actions";

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

function permissionLabel(permission: NotificationPermission) {
  if (permission === "granted") return "Granted";
  if (permission === "denied") return "Blocked in browser settings";
  return "Not requested";
}

export function NotificationSettings({ publicVapidKey }: { publicVapidKey: string }) {
  const [pending, startTransition] = useTransition();
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    Promise.resolve().then(async () => {
      setSupported(available);
      if (!available) return;
      setPermission(Notification.permission);
      const registration = await navigator.serviceWorker.getRegistration();
      setEnabled(Boolean(await registration?.pushManager.getSubscription()));
    }).catch(() => setEnabled(false));
  }, []);

  function enable() {
    startTransition(async () => {
      try {
        if (!supported) throw new Error("Push notifications are not supported in this browser.");
        if (!publicVapidKey) throw new Error("Push notifications are not configured yet.");
        const nextPermission = await Notification.requestPermission();
        setPermission(nextPermission);
        if (nextPermission !== "granted") throw new Error("Notification permission was not granted.");
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        const subscription = existing ?? await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey(publicVapidKey),
        });
        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("The browser returned an incomplete push subscription.");
        const result = await savePushSubscription({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth });
        if (!result.ok) {
          if (!existing) await subscription.unsubscribe();
          throw new Error(result.message);
        }
        setEnabled(true);
        setMessage(result.message);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to enable notifications");
      }
    });
  }

  function disable() {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          const result = await deletePushSubscription(subscription.endpoint);
          if (!result.ok) throw new Error(result.message);
          await subscription.unsubscribe();
          setMessage(result.message);
        } else {
          setMessage("Notifications are already disabled");
        }
        setEnabled(false);
        setPermission(Notification.permission);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to disable notifications");
      }
    });
  }

  return (
    <section className="finance-card p-5 sm:p-6">
      <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><BellRing className="size-5" /></span><div><h2 className="text-lg font-extrabold">Notifications</h2><p className="mt-1 text-sm leading-6 text-slate-400">Get free-trial reminders 2 days and 1 day before an expected charge.</p></div></div>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm"><p className="font-semibold text-slate-500">Current permission status</p><p className="mt-1 font-extrabold text-slate-900">{supported ? permissionLabel(permission) : "Not supported"}</p><p className="mt-1 text-xs text-slate-400">Push reminders are {enabled ? "enabled on this device" : "disabled on this device"}.</p></div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Install Finova from Safari using Add to Home Screen, open the installed app, then enable notifications here.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <button type="button" className="primary-button" onClick={enable} disabled={pending || enabled || !supported || permission === "denied"}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <BellRing className="size-4" />}Enable notifications</button>
        <button type="button" className="secondary-button" onClick={disable} disabled={pending || !enabled}><BellOff className="size-4" />Disable notifications</button>
      </div>
      {message ? <p role="status" className="mt-4 text-sm font-semibold text-slate-500">{message}</p> : null}
    </section>
  );
}
