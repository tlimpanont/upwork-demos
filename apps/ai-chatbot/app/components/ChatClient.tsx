"use client";

import dynamic from "next/dynamic";

const Chat = dynamic(() => import("@/app/components/Chat"), { ssr: false });

export default function ChatClient() {
  return <Chat />;
}
