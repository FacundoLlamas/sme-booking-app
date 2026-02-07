# Dashboard Accessibility & Keyboard Shortcuts Guide

## WCAG 2.1 AA Compliance

The Business Owner Dashboard is built to meet WCAG 2.1 AA accessibility standards across all pages and components.

### Implemented Accessibility Features

#### 1. **Keyboard Navigation**
- ✅ All interactive elements are keyboard accessible
- ✅ Logical tab order throughout the application
- ✅ Focus management with visible indicators
- ✅ Keyboard shortcuts for common actions (see below)
- ✅ Escape key closes all dialogs and dropdowns

#### 2. **Screen Reader Support**
- ✅ Semantic HTML structure with proper heading hierarchy
- ✅ ARIA labels on all custom controls
- ✅ ARIA live regions for dynamic content updates
- ✅ Form labels properly associated with inputs
- ✅ Table headers properly marked with `<th>`
- ✅ Role attributes on custom components

#### 3. **Color Contrast**
- ✅ All text meets WCAG AA standard: 4.5:1 for normal text
- ✅ WCAG AAA standard on some UI elements: 7:1
- ✅ Status indicators use both color AND icons/text
- ✅ Color is never the only means of conveying information

#### 4. **Responsive Design**
- ✅ Mobile-first approach ensures accessibility on all devices
- ✅ Touch targets minimum 44x44 pixels
- ✅ No horizontal scrolling on mobile
- ✅ Readable on mobile, tablet, and desktop
- ✅ Font sizes scale appropriately

#### 5. **Motion & Animation**
- ✅ Respects `prefers-reduced-motion` system preference
- ✅ Animations can be disabled without affecting functionality
- ✅ Critical information not conveyed by motion alone

#### 6. **Form Accessibility**
- ✅ All form inputs have associated labels
- ✅ Required fields clearly marked
- ✅ Error messages linked to form fields
- ✅ Error messages descriptive and helpful
- ✅ Form hints visible and associated with fields

#### 7. **Focus Management**
- ✅ Visible focus indicator on all interactive elements
- ✅ Focus trapped in modals
- ✅ Focus restored when modals close
- ✅ Logical focus order

---

## Keyboard Shortcuts

Press any of these key combinations to quickly navigate the dashboard:

### Navigation & Views
| Shortcut | Action | Notes |
|----------|--------|-------|
| `Cmd+K` or `Ctrl+K` | Open Search | Focus search bar (global) |
| `Cmd+/` or `Ctrl+/` | Show Help | Display keyboard shortcuts |
| `?` | Show Shortcuts | Alternative to Cmd+/ |
| `Esc` | Close Dialogs | Closes modals, dropdowns, notifications |

### Dashboard Pages
| Shortcut | Action |
|----------|--------|
| `1` | Go to Dashboard Overview |
| `2` | Go to Bookings |
| `3` | Go to Calendar |
| `4` | Go to Analytics |
| `5` | Go to Customers |
| `6` | Go to Settings |

### Bookings Table
| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Navigate table rows |
| `Enter` | Open selected booking details |
| `e` | Export visible bookings |
| `f` | Focus filter bar |
| `r` | Reset all filters |

### Calendar
| Shortcut | Action |
|----------|--------|
| `←` / `→` | Previous / Next month |
| `m` | Switch to month view |
| `w` | Switch to week view |
| `d` | Switch to day view |

### Form Fields
| Shortcut | Action |
|----------|--------|
| `Tab` | Move to next field |
| `Shift+Tab` | Move to previous field |
| `Enter` | Submit form |
| `Ctrl+Enter` | Quick save (some forms) |

### Global Actions
| Shortcut | Action |
|----------|--------|
| `Cmd+S` or `Ctrl+S` | Save current form |
| `Cmd+P` or `Ctrl+P` | Print current page |
| `Cmd+,` or `Ctrl+,` | Open Settings |

---

## Screen Reader Tips

### Using with NVDA (Windows)
1. Enable browse mode: `Insert + Space`
2. Navigate headings: `H` key
3. Navigate buttons: `B` key
4. Navigate tables: `T` key and arrow keys

### Using with JAWS (Windows)
1. Use heading navigation: `H`
2. Use table mode: `T` for table, `Ctrl+Alt+T`
3. Use form mode: `F` to navigate form fields
4. Use link mode: `;` (semicolon)

### Using with VoiceOver (Mac)
1. Enable VoiceOver: `Cmd+F5`
2. Navigate headings: `H`
3. Navigate links: `L`
4. Navigate buttons: `B`

---

## Mobile & Touch Accessibility

### Touch Targets
- All interactive elements are at least 44x44 pixels
- Adequate spacing between touch targets
- No small buttons that are hard to tap

### Mobile Navigation
- Hamburger menu on mobile with clear label
- Sidebar is closable with clearly labeled close button
- Content remains readable without zooming
- Portrait and landscape orientations both supported

### Mobile Gestures
- Standard pinch-to-zoom is supported
- Double-tap zoom is not disabled
- Swipe gestures have keyboard alternatives

---

## Testing & Validation

### Automated Testing
We use the following tools to validate accessibility:

```bash
# Run accessibility tests
npm run test:a11y

# Check with axe-core
npm run test:axe

# WAVE browser extension
# Available at: https://wave.webaim.org/
```

### Manual Testing Checklist

- [ ] Keyboard navigation works on all pages
- [ ] All forms can be completed with keyboard alone
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader reads content in logical order
- [ ] Images have alt text
- [ ] Tables have proper headers
- [ ] Error messages are clear
- [ ] Touch targets are 44x44 pixels
- [ ] Page renders without horizontal scroll

### Browser Testing
Tested and verified on:
- ✅ Chrome + ChromeVox extension
- ✅ Firefox + NVDA (Windows)
- ✅ Safari + VoiceOver (Mac)
- ✅ Edge + JAWS (Windows)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## Common Accessibility Issues & Solutions

### Issue: Can't see where focus is
**Solution:** Focus indicator is shown with blue ring. Check browser developer tools to verify focus state.

### Issue: Color-only status indicators
**Solution:** All status badges include text. Colors used:
- 🟢 Green = Confirmed/Active
- 🟡 Yellow = Pending/Warning
- 🔵 Blue = Completed/Info
- 🔴 Red = Cancelled/Error

### Issue: Table is hard to read
**Solution:** Use screen reader table mode or zoom to increase text size. Tables have proper headers and can be navigated with arrow keys.

### Issue: Animations are distracting
**Solution:** Enable "Reduce motion" in system settings:
- **Mac:** System Preferences > Accessibility > Display > Reduce motion
- **Windows:** Settings > Ease of Access > Display > Show animations

### Issue: Text is too small
**Solution:** Use browser zoom (Ctrl/Cmd + Plus) or system zoom settings.

---

## Accessibility Reporting

Found an accessibility issue? Please report it:

1. **What happened:** Describe the issue
2. **Where it happened:** URL or page name
3. **Expected behavior:** What should happen
4. **Assistive technology used:** Screen reader, keyboard, etc.
5. **System/Browser:** OS and browser version

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Resources](https://webaim.org/)
- [The A11y Project](https://www.a11yproject.com/)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

## Continuous Improvement

We continuously improve accessibility by:
- Testing with real assistive technology users
- Regular accessibility audits
- Staying updated with WCAG guidelines
- Community feedback integration
- Accessibility testing in CI/CD pipeline

