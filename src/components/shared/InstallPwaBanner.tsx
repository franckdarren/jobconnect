"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "jc-pwa-install-dismissed";
const SHOW_AFTER_MS = 30_000;

/**
 * Floating banner that prompts mobile users to install the PWA.
 *   - Android / desktop Chromium: uses the native `beforeinstallprompt` event.
 *   - iOS Safari: shows a hint with the manual "Add to Home Screen" steps,
 *     since iOS doesn't fire `beforeinstallprompt`.
 * Banner is hidden if already installed, dismissed previously, or before the
 * 30 s session-warm-up window expires.
 */
function isIosSafariUserAgent(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/crios|fxios|chrome/.test(ua);
  return isIOS && isSafari;
}

export function InstallPwaBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  // iOS check is UA-only and never changes after mount — initialise lazily.
  const [iosHint] = useState<boolean>(isIosSafariUserAgent);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed → never show.
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (isStandalone) return;

    if (window.localStorage.getItem(DISMISSED_KEY) === "1") return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const id = setTimeout(() => setVisible(true), SHOW_AFTER_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      clearTimeout(id);
    };
  }, []);

  const onInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setDeferred(null);
      setVisible(false);
    }
  };

  const onDismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;
  if (!deferred && !iosHint) return null;

  return (
    <div className="fixed bottom-20 inset-x-3 z-40 max-w-md mx-auto rounded-2xl bg-jc-primary-dark text-white shadow-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-jc-primary-green flex items-center justify-center shrink-0">
        <Download className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">Installer JobConnect</p>
        {deferred ? (
          <p className="text-xs text-white/70 mt-0.5">
            Accédez à vos offres en un tap, même hors ligne.
          </p>
        ) : (
          <p className="text-xs text-white/70 mt-0.5">
            Ouvrez le menu Partager puis « Sur l&apos;écran d&apos;accueil ».
          </p>
        )}
        {deferred ? (
          <button
            type="button"
            onClick={onInstall}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-jc-primary-green hover:bg-jc-primary-green/90 text-white text-xs font-semibold px-4 py-1.5"
          >
            Installer
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Ne plus afficher"
        className="text-white/60 hover:text-white p-1 -m-1 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
