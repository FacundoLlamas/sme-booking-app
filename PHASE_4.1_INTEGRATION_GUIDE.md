# Phase 4.1 Chat Widget - Integration Guide

This guide explains how to integrate the newly built Chat Widget into your SME Booking App.

## Quick Start

### 1. Basic Implementation

The simplest way to add the chat widget to your app:

```tsx
import { ChatWidget } from '@/components/chat';

export default function MyPage() {
  return (
    <div className="flex h-screen">
      <main className="flex-1">{/* Your content */}</main>
      <aside className="w-96">
        <ChatWidget />
      </aside>
    </div>
  );
}
```

### 2. With Close Handler

Control when the chat widget is visible:

```tsx
'use client';

import { ChatWidget } from '@/components/chat';
import { useState } from 'react';

export default function MyPage() {
  const [chatOpen, setChatOpen] = useState(true);

  return (
    <div>
      {chatOpen ? (
        <ChatWidget onClose={() => setChatOpen(false)} />
      ) : (
        <button onClick={() => setChatOpen(true)}>
          Open Chat
        </button>
      )}
    </div>
  );
}
```

### 3. With Custom API Endpoints

If your API endpoints differ from the default:

```tsx
<ChatWidget
  apiUrl="/api/v1/chat"
  streamApiUrl="/api/v1/chat/stream"
  persistChat={true}
/>
```

## Component Props

```typescript
interface ChatWidgetProps {
  // Called when user clicks the close button (optional)
  onClose?: () => void;

  // Initial message to send on load (optional)
  initialMessage?: string;

  // API endpoint for regular chat messages
  apiUrl?: string; // default: '/api/v1/chat'

  // API endpoint for streaming messages
  streamApiUrl?: string; // default: '/api/v1/chat/stream'

  // Enable localStorage persistence for messages
  persistChat?: boolean; // default: true

  // Maximum messages to store
  maxMessages?: number; // default: 100

  // Additional CSS classes
  className?: string;
}
```

## Component Exports

All chat components are available from `@/components/chat`:

```tsx
import {
  ChatWidget,           // Main widget component
  MessageList,          // Message display
  MessageInput,         // Input field
  StreamingMessage,     // Streaming tokens
} from '@/components/chat';

// Types
import type {
  ChatMessage,
  ServiceClassification,
  UrgencyLevel,
} from '@/components/chat';
```

## Styling & Theming

### CSS Custom Properties

The widget uses Tailwind CSS with dark mode support:

```tsx
// Light mode (default)
<ChatWidget className="bg-white text-gray-900" />

// Dark mode (automatic via system preference)
// Or explicitly:
<html className="dark">
  <ChatWidget />
</html>
```

### Custom Styling

Override default styles with Tailwind:

```tsx
<ChatWidget
  className="
    max-w-md 
    shadow-2xl 
    rounded-xl 
    border-4 border-primary-500
  "
/>
```

### Color Scheme

The widget uses the primary color from your Tailwind config:

```javascript
// tailwind.config.js
{
  theme: {
    extend: {
      colors: {
        primary: {
          // ... your primary colors
        }
      }
    }
  }
}
```

## API Integration

### Expected API Endpoints

The widget expects two endpoints:

#### 1. Regular Chat API (POST /api/v1/chat)

**Request:**
```typescript
{
  message: string;           // The user's message
  session_id?: string;       // Optional session ID
  customer_id?: number;      // Optional customer ID
  business_id?: number;      // Optional business ID
}
```

**Response:**
```typescript
{
  data: {
    id: number;
    conversation_id: number;
    message_id: number;
    response: string;        // AI response
    service_type: string;    // e.g., "plumbing"
    urgency: UrgencyLevel;   // "low" | "medium" | "high" | "emergency"
    confidence: number;      // 0-1
    next_steps: string[];    // Suggested next steps
    timestamp: string;       // ISO 8601
  }
}
```

#### 2. Streaming Chat API (POST /api/v1/chat/stream)

**Request:** (same as regular API)

**Response:** (Server-Sent Events)

```typescript
// Events sent via SSE
{
  type: 'metadata',
  data: {
    conversation_id: number;
    message_id: number;
    service_type: string;
    urgency: UrgencyLevel;
    confidence: number;
  }
}

{
  type: 'message',
  data: {
    token: string;      // Single token/word
    index: number;      // Token index
    total: number;      // Total tokens
    percentage: string; // Progress %
  }
}

{
  type: 'status',
  data: {
    status: string;  // "classifying" | "generating" | "complete"
    message: string;
  }
}

{
  type: 'done',
  data: {
    conversation_id: number;
    message_id: number;
    tokens_sent: number;
  }
}
```

## State Management

### Using Chat Context Directly

If you need direct access to chat state:

```tsx
'use client';

import { useChatContext } from '@/contexts/ChatContext';

export function MyComponent() {
  const {
    state,    // All state
    addMessage,
    setLoading,
    setError,
    setTheme,
    clearChat,
  } = useChatContext();

  // Access state
  console.log(state.messages);
  console.log(state.service_classification);
  console.log(state.theme);

  return <div>{/* ... */}</div>;
}
```

### Using Chat Hook

For more granular control:

```tsx
'use client';

import { useChat } from '@/hooks/useChat';

export function MyComponent() {
  const {
    messages,
    loading,
    error,
    theme,
    service_classification,
    sendMessage,
    sendStreamingMessage,
    clearChat,
  } = useChat({
    apiUrl: '/api/v1/chat',
    streamApiUrl: '/api/v1/chat/stream',
    customerId: 123,
    persistChat: true,
  });

  const handleSend = async () => {
    await sendMessage('Hello');
  };

  return <div>{/* ... */}</div>;
}
```

## localStorage Persistence

Messages are automatically persisted to localStorage under the key `sme_booking_chat_messages`.

### Disabling Persistence

```tsx
<ChatWidget persistChat={false} />
```

### Clearing Persisted Messages

Programmatically:

```tsx
import { useChatStorage } from '@/hooks/useChatStorage';

function MyComponent() {
  const { clearStorage } = useChatStorage();

  const handleClear = () => {
    clearStorage();
  };

  return <button onClick={handleClear}>Clear Chat History</button>;
}
```

Or manually:

```javascript
// In browser console
localStorage.removeItem('sme_booking_chat_messages');
localStorage.removeItem('sme_booking_chat_theme');
```

## Keyboard Shortcuts

The chat widget supports several keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| **Cmd+K** (Mac) / **Ctrl+K** (Windows) | Focus chat input |
| **Enter** | Send message |
| **Shift+Enter** | New line |
| **Escape** | Blur input |
| **Tab** | Navigate between controls |
| **Shift+Tab** | Reverse navigation |

## Accessibility Features

### WCAG 2.1 AA Compliance

- ✅ 4.5:1 color contrast
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ ARIA labels on all interactive elements
- ✅ Screen reader support
- ✅ Focus indicators
- ✅ Reduced motion support

### Testing Accessibility

```bash
# Run accessibility tests
npm run test -- --grep "Accessibility"

# Check your implementation
# 1. Keyboard-only navigation
# 2. Screen reader testing
# 3. Color contrast verification
# 4. Focus indicator visibility
```

## Dark Mode

The widget automatically detects system preference and respects user theme choice.

### Manual Theme Control

```tsx
'use client';

import { ChatWidget } from '@/components/chat';
import { ChatContextProvider } from '@/contexts/ChatContext';

export default function App() {
  return (
    <ChatContextProvider initialTheme="dark">
      <ChatWidget />
    </ChatContextProvider>
  );
}
```

### Forcing Dark Mode on Document

```tsx
// In your layout or wrapper
<html className="dark">
  <body>
    <ChatWidget />
  </body>
</html>
```

## Customization

### Custom Design Tokens

The chat widget uses design tokens from `src/styles/design-system.ts`. To customize:

```typescript
// src/styles/design-system.ts
export const CHAT_WIDGET_TOKENS = {
  messagePadding: '12px 16px',      // Customize spacing
  messageBorderRadius: '8px',        // Customize border
  userMessageBg: '#0ea5e9',          // Customize colors
  // ... more tokens
};
```

### Wrapping with Custom Layout

```tsx
export function ChatPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 h-screen">
      <main className="lg:col-span-2 p-8">
        {/* Your content */}
      </main>
      <aside className="border-l border-gray-200 dark:border-gray-700">
        <ChatWidget />
      </aside>
    </div>
  );
}
```

## Performance Optimization

### Lazy Loading

For optimal performance, consider lazy loading the chat widget:

```tsx
import dynamic from 'next/dynamic';

const ChatWidget = dynamic(
  () => import('@/components/chat').then(m => m.ChatWidget),
  { loading: () => <div>Loading...</div> }
);

export default function Page() {
  return <ChatWidget />;
}
```

### Bundle Size

Current optimizations:
- ✅ Minimal dependencies (Framer Motion only)
- ✅ Tree-shaking enabled
- ✅ Code splitting ready
- ✅ Target: <40KB gzipped

Monitor with:
```bash
npm run build
# Check .next/static/chunks/ for bundle sizes
```

## Error Handling

### Common Errors

**"Streaming endpoint not available"**
- Ensure `/api/v1/chat/stream` exists
- Check CORS headers
- Verify EventSource support

**"LocalStorage quota exceeded"**
- Clear old conversations
- Reduce `maxMessages` prop
- Disable persistence

**"Cannot read property of undefined"**
- Ensure ChatContextProvider is parent
- Check API response format
- Verify fetch URLs

### Error Logging

Errors are logged to the browser console. For production, integrate with an error tracking service:

```tsx
// In your error handler
if (error) {
  Sentry.captureException(error, {
    tags: { component: 'ChatWidget' }
  });
}
```

## Testing

### Run Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test -- --watch

# UI mode
npm run test:ui

# Coverage
npm run test:coverage
```

### Write Custom Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatWidget } from '@/components/chat';

describe('My Chat Tests', () => {
  it('should render', () => {
    render(<ChatWidget />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

## Deployment

### Environment Variables

No special environment variables needed, but ensure:

```bash
# API endpoints are accessible
NEXT_PUBLIC_API_URL=https://api.example.com

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=xxx
```

### Build Optimization

```bash
# Build for production
npm run build

# Test production build
npm run start
```

### Monitoring

Setup monitoring for:
- API response times
- Streaming latency
- Error rates
- User engagement

## Migration from Previous Chat

If migrating from an old chat implementation:

1. **Export old messages** to JSON
2. **Update localStorage key** if needed
3. **Migrate API endpoints** to new format
4. **Test thoroughly** with real conversations

## Troubleshooting

### Widget Not Showing

```tsx
// Check 1: Is it mounted?
<ChatWidget /> // Make sure not wrapped in conditional that's false

// Check 2: Is CSS loaded?
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

// Check 3: Are dependencies installed?
npm install framer-motion
```

### Messages Not Persisting

```tsx
// Check 1: Is localStorage available?
typeof localStorage !== 'undefined' // Should be true

// Check 2: Is persistChat enabled?
<ChatWidget persistChat={true} /> // Default is true

// Check 3: Check browser storage
// DevTools > Application > Local Storage > sme_booking_chat_messages
```

### Streaming Not Working

```tsx
// Check 1: Endpoint returns proper SSE format
// Check 2: CORS headers allow EventSource
// Check 3: Network tab shows 'text/event-stream' content type
// Check 4: Browser supports EventSource (all modern browsers do)
```

## Support & Resources

- **Documentation:** Read the inline JSDoc comments
- **Types:** Check `src/types/chat.ts` for TypeScript definitions
- **Design System:** See `src/styles/design-system.ts` for tokens
- **Tests:** View `src/components/chat/__tests__/` for examples

## Next Steps

1. **Integrate with booking system**
   - Link chat classifications to booking flow
   - Pre-fill booking forms with chat context

2. **Add advanced features**
   - Typing indicators
   - Message search
   - Conversation export

3. **Analytics & Monitoring**
   - Track user engagement
   - Monitor response times
   - Measure conversion

4. **A/B Testing**
   - Test different greetings
   - Compare UI layouts
   - Measure satisfaction

---

## Summary

The Chat Widget is production-ready and fully integrated. Simply import it and use:

```tsx
import { ChatWidget } from '@/components/chat';

export default function App() {
  return <ChatWidget />;
}
```

For questions or issues, refer to the comprehensive documentation in the codebase and the test files for usage examples.
