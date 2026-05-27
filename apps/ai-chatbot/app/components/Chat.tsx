"use client";

import { useEffect, useRef } from "react";
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  useMessagePartText,
  useThread,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { track } from "@vercel/analytics";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

// Fires `chatbot_message_sent` once per user message. Lives inside the
// runtime provider so it can observe thread state; renders nothing.
function ChatEngagementTracker() {
  const userMessageCount = useThread(
    (s) => s.messages.filter((m) => m.role === "user").length,
  );
  const lastTracked = useRef(0);
  useEffect(() => {
    if (userMessageCount > lastTracked.current) {
      track("chatbot_message_sent", { index: userMessageCount });
      lastTracked.current = userMessageCount;
    }
  }, [userMessageCount]);
  return null;
}

function UserTextPart() {
  const { text } = useMessagePartText();
  return <span className="whitespace-pre-wrap">{text}</span>;
}

function AssistantTextPart() {
  const { text } = useMessagePartText();
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-outside pl-4 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-outside pl-4 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="bg-gray-100 text-gray-800 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
        ),
        pre: ({ children }) => (
          <pre className="bg-gray-100 rounded-lg p-3 overflow-x-auto text-xs font-mono mb-2">{children}</pre>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">{children}</a>
        ),
        h1: ({ children }) => <h1 className="font-bold text-base mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="font-semibold text-sm mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="font-semibold text-sm mb-1">{children}</h3>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function UserMessage() {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-2.5 bg-blue-600 text-white text-sm leading-relaxed">
        <MessagePrimitive.Parts components={{ Text: UserTextPart }} />
      </div>
    </div>
  );
}

function AssistantMessage() {
  return (
    <div className="flex justify-start items-start gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 mt-0.5">
        AI
      </div>
      <div className="max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-2.5 bg-white text-gray-800 border border-gray-200 shadow-sm text-sm leading-relaxed">
        <MessagePrimitive.Parts components={{ Text: AssistantTextPart }} />
      </div>
    </div>
  );
}

function Message() {
  return (
    <MessagePrimitive.Root>
      <MessagePrimitive.If user>
        <UserMessage />
      </MessagePrimitive.If>
      <MessagePrimitive.If assistant>
        <AssistantMessage />
      </MessagePrimitive.If>
    </MessagePrimitive.Root>
  );
}

export default function Chat() {
  // Defaults to /api/chat to match our route
  const runtime = useChatRuntime();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatEngagementTracker />
      <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              AI
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm">Support Assistant</h1>
              <p className="text-xs text-green-500 font-medium">● Online</p>
            </div>
          </div>
          <Link
            href="/admin"
            className="text-xs text-gray-400 hover:text-gray-600 transition font-medium"
          >
            Admin →
          </Link>
        </header>

        <ThreadPrimitive.Root className="flex-1 flex flex-col overflow-hidden">
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 py-6">
            <ThreadPrimitive.Empty>
              <div className="text-center text-gray-400 mt-20">
                <p className="text-lg font-medium">How can I help you today?</p>
                <p className="text-sm mt-1">Ask me anything about our products or services.</p>
              </div>
            </ThreadPrimitive.Empty>

            <ThreadPrimitive.Messages components={{ Message }} />
          </ThreadPrimitive.Viewport>

          <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
            <ComposerPrimitive.Root className="flex gap-2 max-w-3xl mx-auto items-end">
              <ComposerPrimitive.Input
                placeholder="Type your message…"
                rows={1}
                className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
              />
              <ComposerPrimitive.Send className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full w-10 h-10 flex items-center justify-center transition shrink-0">
                <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>
          </div>
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
}