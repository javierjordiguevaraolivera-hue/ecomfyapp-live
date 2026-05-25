"use client";

import { Button } from "@/components/ui/button";
import { Bell, BellOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ReadyForSellLead = {
  lead_id: string;
  created_at: string;
  source: string | null;
  domain: string | null;
  sub1: string | null;
};

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const POLL_MS = 30 * 1000;
const PROMPT_REMINDER_MS = 15 * 60 * 1000;
const READY_FOR_SELL_SEEN_EVENT = "ready-for-sell-seen";
const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;

function isNotificationSupported() {
  return "Notification" in window && "serviceWorker" in navigator;
}

function getLeadLabel(lead: ReadyForSellLead) {
  return [lead.source, lead.domain, lead.sub1].filter(Boolean).join(" | ");
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replaceAll("-", "+").replaceAll("_", "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function playNotificationTone(kind: "prompt" | "cash-register" = "prompt") {
  const audioWindow = window as AudioWindow;
  const AudioContextClass =
    audioWindow.AudioContext || audioWindow.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  const now = audioContext.currentTime;

  const playBeep = (
    start: number,
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine",
  ) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  };

  if (kind === "cash-register") {
    playBeep(now, 1760, 0.08, 0.12, "square");
    playBeep(now + 0.09, 2349, 0.1, 0.14, "triangle");
    playBeep(now + 0.2, 1318, 0.16, 0.16, "sine");
    playBeep(now + 0.34, 2637, 0.22, 0.18, "triangle");
    window.setTimeout(() => audioContext.close(), 850);
    return;
  }

  playBeep(now, 880, 0.12, 0.18);
  playBeep(now + 0.1, 1174, 0.18, 0.16);
  window.setTimeout(() => audioContext.close(), 500);
}

export function ReadyForSellNotifier() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const [isEnabled, setIsEnabled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [subscriptionEndpoint, setSubscriptionEndpoint] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isNotificationSupported()) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission);
    setShowPrompt(Notification.permission === "default");

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setIsEnabled(Boolean(subscription));
        setSubscriptionEndpoint(subscription?.endpoint ?? null);
      })
      .catch(() => {
        setIsEnabled(false);
      });
  }, []);

  useEffect(() => {
    if (!showPrompt) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        playNotificationTone();
      } catch {
        // Some browsers block sound before the first user gesture.
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [showPrompt]);

  useEffect(() => {
    if (permission !== "default" || isEnabled || showPrompt) {
      return;
    }

    const reminderId = window.setTimeout(() => {
      setShowPrompt(true);
    }, PROMPT_REMINDER_MS);

    return () => window.clearTimeout(reminderId);
  }, [isEnabled, permission, showPrompt]);

  const enableNotifications = async () => {
    if (!isNotificationSupported()) {
      setPermission("unsupported");
      return;
    }

    if (!PUBLIC_VAPID_KEY) {
      return;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    setShowPrompt(false);

    if (nextPermission !== "granted") {
      setIsEnabled(false);
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const existingSubscription =
      await registration.pushManager.getSubscription();
    const subscription =
      existingSubscription ??
      (await registration.pushManager.subscribe({
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
        userVisibleOnly: true,
      }));

    const response = await fetch("/api/push/subscribe", {
      body: JSON.stringify({ subscription: subscription.toJSON() }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Could not save push subscription.");
    }

    setIsEnabled(true);
    setSubscriptionEndpoint(subscription.endpoint);

    try {
      playNotificationTone();
    } catch {
      // The permission flow should continue even if audio is blocked.
    }
  };

  const disableNotifications = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await fetch("/api/push/subscribe", {
        body: JSON.stringify({ endpoint: subscription.endpoint }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "DELETE",
      }).catch(() => {});
      await subscription.unsubscribe();
    } else if (subscriptionEndpoint) {
      await fetch("/api/push/subscribe", {
        body: JSON.stringify({ endpoint: subscriptionEndpoint }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "DELETE",
      }).catch(() => {});
    }

    setSubscriptionEndpoint(null);
    setIsEnabled(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  if (permission === "unsupported") {
    return null;
  }

  if (permission === "granted" && isEnabled) {
    return (
      <Button
        aria-label="Desactivar notificaciones ready for sell"
        onClick={disableNotifications}
        size="icon"
        title="Notificaciones ready for sell activas"
        type="button"
        variant="default"
      >
        <Bell />
      </Button>
    );
  }

  return (
    <>
      <Button
        aria-label="Activar notificaciones ready for sell"
        onClick={enableNotifications}
        size="icon"
        title={
          permission === "denied"
            ? "Permiso de notificaciones bloqueado"
            : "Activar notificaciones ready for sell"
        }
        type="button"
        variant="outline"
      >
        <BellOff />
      </Button>
      {showPrompt ? (
        <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[360px]">
          <div className="rounded-lg border bg-background p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-primary p-2 text-primary-foreground">
                <Bell className="h-4 w-4 sm:animate-bell-shake" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-semibold">
                    Activar notificaciones
                  </h2>
                  <button
                    aria-label="Cerrar aviso de notificaciones"
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={dismissPrompt}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Se enviaran notificaciones utiles sobre leads y status
                  importantes.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    onClick={dismissPrompt}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Luego
                  </Button>
                  <Button onClick={enableNotifications} size="sm" type="button">
                    Activar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
