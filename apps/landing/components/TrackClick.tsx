"use client";

import { track } from "@vercel/analytics";
import { cloneElement, isValidElement } from "react";
import type { MouseEvent, ReactElement, ReactNode } from "react";

type AllowedValue = string | number | boolean | null;

type TrackClickProps = {
  event: string;
  data?: Record<string, AllowedValue>;
  children: ReactNode;
};

// Wraps a single child link/button and fires a Vercel Analytics custom
// event on click. Use this from server components where we cannot call
// track() directly. For surfaces that are already client components
// (ContactForm, MobileMenu) call track() inline instead.
//
// Preserves the child's existing onClick handler.
export default function TrackClick({ event, data, children }: TrackClickProps) {
  if (!isValidElement(children)) return <>{children}</>;
  const element = children as ReactElement<{
    onClick?: (e: MouseEvent) => void;
  }>;
  const originalOnClick = element.props.onClick;
  return cloneElement(element, {
    onClick: (e: MouseEvent) => {
      track(event, data ?? undefined);
      originalOnClick?.(e);
    },
  });
}
