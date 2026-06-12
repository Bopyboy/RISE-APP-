// src/components/app-tutorial.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";

type TutorialStep = {
  target: string; // data-tut attribute value
  title: string;
  body: string;
  route: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: "tap" | "auto"; // tap = user clicks highlighted element, auto = shows button
  tab?: string; // if you need to switch tabs before highlighting
};

const STORAGE_KEY = "rise-tutorial-v7-seen";

const STEPS: TutorialStep[] = [
  {
    target: "home-log-meal",
    title: "Welcome to Rize! 👋",
    body: "Let's log your first meal together. This button right here is where you start.",
    route: "/",
    position: "bottom",
    action: "tap",
  },
  {
    target: "add-breakfast-btn",
    title: "Add Breakfast",
    body: "Great! Now tap the + Add Breakfast button to pick your food.",
    route: "/nutrition",
    position: "bottom",
    action: "tap",
  },
  {
    target: "workout-start",
    title: "Train Like a Pro",
    body: "When you're ready to exercise, tap here to start your workout.",
    route: "/train",
    position: "top",
    action: "tap",
  },
  {
    target: "bottom-nav-profile",
    title: "Your Profile",
    body: "Everything about you lives here — goals, progress, and settings.",
    route: "/profile",
    position: "top",
    action: "tap",
  },
  {
    target: "center",
    title: "You're All Set! 🎉",
    body: "You now know the basics. Let's build something amazing together!",
    route: "/",
    position: "center",
    action: "auto",
  },
];

export default function AppTutorial() {
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<<DOMRect | null>(null);
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0, placement: "bottom" as "top" | "bottom" | "left" | "right" });
  const containerRef = useRef<<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const step = STEPS[stepIdx];

  // Start tutorial on first visit
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setOpen(true);
    }
  }, []);

  const goToStep = useCallback(
    async (idx: number) => {
      if (idx >= STEPS.length) {
        setOpen(false);
        localStorage.setItem(STORAGE_KEY, "true");
        return;
      }

      const s = STEPS[idx];
      setStepIdx(idx);

      // Navigate if route changed
      if (location.pathname !== s.route) {
        await navigate({ to: s.route });
        // Give DOM time to settle after route change
        setTimeout(() => measureAndShow(s), 350);
      } else {
        measureAndShow(s);
      }
    },
    [location.pathname, navigate]
  );

  function measureAndShow(s: TutorialStep) {
    if (!containerRef.current) return;

    let el: Element | null = null;

    if (s.target === "center") {
      // Full-screen message, no spotlight
      setRect(null);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setBubblePos({
        top: vh / 2 - 80,
        left: vw / 2 - 140,
        placement: "bottom",
      });
      return;
    }

    el = document.querySelector(`[data-tut="${s.target}"]`);
    if (!el) {
      // Fallback: retry once after a short delay
      setTimeout(() => {
        const retry = document.querySelector(`[data-tut="${s.target}"]`);
        if (retry) highlightElement(retry, s);
      }, 500);
      return;
    }

    highlightElement(el, s);
  }

  function highlightElement(el: Element, s: TutorialStep) {
    const r = el.getBoundingClientRect();
    setRect(r);

    // Smooth scroll into center view
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const elementTop = r.top + scrollY;
    const offset = window.innerHeight / 2 - r.height / 2;
    window.scrollTo({ top: elementTop - offset, behavior: "smooth" });

    computeBubblePosition(r, s.position || "bottom");
  }

  function computeBubblePosition(r: DOMRect, preferred: TutorialStep["position"]) {
    const padding = 16;
    const bubbleW = 280;
    const bubbleH = 140;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = 0;
    let left = 0;
    let placement: "top" | "bottom" | "left" | "right" = "bottom";

    if (preferred === "center") {
      top = vh / 2 - bubbleH / 2;
      left = vw / 2 - bubbleW / 2;
      placement = "bottom";
    } else if (preferred === "bottom") {
      top = r.bottom + padding;
      left = r.left + r.width / 2 - bubbleW / 2;
      placement = "bottom";
    } else if (preferred === "top") {
      top = r.top - bubbleH - padding;
      left = r.left + r.width / 2 - bubbleW / 2;
      placement = "top";
    } else if (preferred === "left") {
      top = r.top + r.height / 2 - bubbleH / 2;
      left = r.left - bubbleW - padding;
      placement = "left";
    } else if (preferred === "right") {
      top = r.top + r.height / 2 - bubbleH / 2;
      left = r.right + padding;
      placement = "right";
    }

    // Clamp to viewport
    left = Math.max(12, Math.min(left, vw - bubbleW - 12));
    top = Math.max(12, Math.min(top, vh - bubbleH - 12));

    setBubblePos({ top, left, placement });
  }

  // Handle user clicking the actual highlighted element
  useEffect(() => {
    if (!open || !step || step.action !== "tap" || !rect) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const tutEl = document.querySelector(`[data-tut="${step.target}"]`);
      if (tutEl && tutEl.contains(target)) {
        e.preventDefault();
        e.stopPropagation();
        goToStep(stepIdx + 1);
      }
    };

    // Capture phase so we intercept before the app's own handler
    window.addEventListener("click", handler, true);
    return () => window.removeEventListener("click", handler, true);
  }, [open, step, rect, stepIdx, goToStep]);

  // Re-measure on resize
  useEffect(() => {
    if (!open) return;
    const onResize = () => measureAndShow(step);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, step]);

  if (!open) return null;

  const next = () => goToStep(stepIdx + 1);
  const skip = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999]"
      style={{ pointerEvents: step?.action === "tap" ? "none" : "auto" }}
    >
      {/* Dark overlay with SVG cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - 6}
                y={rect.top - 6}
                width={rect.width + 12}
                height={rect.height + 12}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tutorial-mask)"
        />
        {rect && (
          <rect
            x={rect.left - 6}
            y={rect.top - 6}
            width={rect.width + 12}
            height={rect.height + 12}
            rx={12}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={3}
            style={{
              filter: "drop-shadow(0 0 8px rgba(59,130,246,0.6))",
            }}
          >
            <animate
              attributeName="stroke-opacity"
              values="1;0.5;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </rect>
        )}
      </svg>

      {/* Speech bubble */}
      <div
        className="absolute z-10"
        style={{
          top: bubblePos.top,
          left: bubblePos.left,
          width: 280,
          pointerEvents: "auto",
        }}
      >
        <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl p-5 border border-slate-200 dark:border-slate-700">
          {/* Mascot face */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold">
              R
            </div>
            <span className="text-sm font-semibold text-blue-500">Rize</span>
          </div>

          <h3 className="text-lg font-bold mb-2 leading-tight">{step?.title}</h3>
          <p className="text-base leading-relaxed mb-4 text-slate-700 dark:text-slate-300">
            {step?.body}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    i === stepIdx ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={skip}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                Skip
              </button>
              {step?.action === "auto" && (
                <button
                  onClick={next}
                  className="px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors shadow-md"
                >
                  {stepIdx === STEPS.length - 1 ? "Finish" : "Next"}
                </button>
              )}
              {step?.action === "tap" && (
                <span className="px-3 py-2 text-sm text-blue-500 font-medium">
                  Tap the button →
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div
          className="absolute w-4 h-4 bg-white dark:bg-slate-800 border-l border-t border-slate-200 dark:border-slate-700 rotate-45"
          style={{
            top: bubblePos.placement === "bottom" ? -8 : "auto",
            bottom: bubblePos.placement === "top" ? -8 : "auto",
            left: "50%",
            marginLeft: -8,
          }}
        />
      </div>
    </div>
  );
}
