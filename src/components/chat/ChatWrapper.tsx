'use client';

import { useState } from 'react';
import { ChatWidget } from '@/components/chat/ChatWidget';

export default function ChatWrapper() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
          aria-label="Open Evios HQ chat assistant"
          title="Need help? Chat with Evios HQ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Widget */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[32rem] z-50">
          <ChatWidget onClose={() => setChatOpen(false)} />
        </div>
      )}
    </>
  );
}
