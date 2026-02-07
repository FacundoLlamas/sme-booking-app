# Business Owner Dashboard - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ 
- npm 10+

### Installation

1. **Install dependencies** (if not already done):
```bash
cd /home/node/.openclaw/workspace/sme-booking-app
npm install
```

2. **Install dashboard dependencies**:
```bash
npm install @tanstack/react-query recharts react-big-calendar react-window @types/react-window lucide-react
```

### Running Locally

Start the development server:
```bash
npm run dev
```

Open your browser:
```
http://localhost:3000/dashboard
```

---

## 📋 Dashboard Pages

### 1. **Dashboard Overview** (`/dashboard`)
- Key business metrics (bookings, customers, revenue, completion rate)
- Recent bookings table
- Today's schedule (upcoming appointments)
- Quick links to settings

**Keyboard Shortcut:** Press `1`

### 2. **Bookings Management** (`/dashboard/bookings`)
- Table of all bookings with sorting
- Advanced filters (status, service type, date range, search)
- Pagination (25 per page)
- Export to CSV/PDF buttons
- View/edit/cancel actions per booking

**Keyboard Shortcut:** Press `2`

**Sorting:**
- Click any column header to sort
- Click again to reverse sort direction
- Supported columns: Customer, Date, Status

**Filtering:**
- Status: Pending, Confirmed, Completed, Cancelled
- Service: Plumbing, Electrical, HVAC
- Date Range: From/To dates
- Search: Customer name
- Click "Clear all" to reset filters

### 3. **Calendar View** (`/dashboard/calendar`)
- Interactive calendar with month/week/day views
- Color-coded by service type:
  - 🔴 Plumbing (red)
  - 🔵 Electrical (blue)
  - 🟢 HVAC (green)
- Click events to view details
- Drag events to reschedule (ready for implementation)

**Keyboard Shortcut:** Press `3`

**Navigation:**
- Use arrow buttons to go to previous/next month
- Click "Month", "Week", or "Day" to switch views
- Click any event to see details modal

### 4. **Analytics & Reports** (`/dashboard/analytics`)
- Line chart: Bookings trend (bookings vs completed)
- Bar chart: Revenue by day
- Pie chart: Service distribution
- Key metrics: Total bookings, revenue, completion rate, no-show rate
- Date range picker for custom reports
- Export to CSV/PDF buttons

**Keyboard Shortcut:** Press `4`

**Reports:**
1. Adjust date range using "From" and "To" date pickers
2. Click "Apply" to refresh charts
3. Click "CSV" or "PDF" to export data

### 5. **Customers** (`/dashboard/customers`)
- List of all customers
- Customer info: name, email, phone, total bookings, last booking
- VIP indicator (⭐ star icon)
- Pagination (25 per page)
- Search by name, email, or phone
- Actions: View details, send message, more options

**Keyboard Shortcut:** Press `5`

**Search:**
- Type in the search box to filter by name, email, or phone
- Click "Previous"/"Next" to paginate

**Sorting:**
- Click "Name" to sort alphabetically
- Click "Bookings" to sort by number of bookings
- Click "Last Booking" to sort by most recent activity

### 6. **Settings** (`/dashboard/settings`)
- Business information: name, email, timezone
- Booking configuration: max concurrent bookings, buffer time
- Working hours: start and end time
- Services offered: checkboxes for available services
- Success notification on save
- Danger zone: delete account button

**Keyboard Shortcut:** Press `6`

**Saving:**
1. Fill out the form fields
2. Click "Save Changes"
3. See success confirmation message

**Validation:**
- Business name: required, minimum 1 character
- Email: required, must be valid format
- Max concurrent bookings: required, minimum 1
- All fields marked with * are required

---

## ⌨️ Keyboard Shortcuts

### Global Shortcuts
| Keys | Action |
|------|--------|
| `Cmd+K` / `Ctrl+K` | Open search |
| `Cmd+/` / `Ctrl+/` | Show help/keyboard shortcuts |
| `?` | Show shortcuts |
| `Esc` | Close dialogs/dropdowns |

### Navigation
| Keys | Action |
|------|--------|
| `1` | Go to Dashboard |
| `2` | Go to Bookings |
| `3` | Go to Calendar |
| `4` | Go to Analytics |
| `5` | Go to Customers |
| `6` | Go to Settings |

### Table Operations
| Keys | Action |
|------|--------|
| `↑` / `↓` | Navigate table rows |
| `Enter` | Open booking details |
| `e` | Export data |
| `f` | Focus filter bar |
| `r` | Reset filters |

### Form Operations
| Keys | Action |
|------|--------|
| `Tab` | Move to next field |
| `Shift+Tab` | Move to previous field |
| `Enter` | Submit form |
| `Ctrl+Enter` | Quick save |

---

## 🌙 Dark Mode

### Enable Dark Mode
Click the moon/sun icon in the top-right header to toggle dark mode.

### System Preference
By default, the dashboard respects your system's dark mode preference:
- **Mac:** System Preferences > General > Appearance
- **Windows:** Settings > Ease of Access > Display

### CSS Variables
Dark mode is implemented using CSS variables and Tailwind's `dark:` prefix for seamless switching.

---

## 📱 Mobile & Responsive

### Mobile (< 640px)
- Hamburger menu for sidebar
- Single column layouts
- Touch-optimized buttons (44x44px minimum)
- Stacked forms and cards

### Tablet (640px - 1024px)
- Sidebar + content side-by-side
- 2-column grid layouts
- Balanced spacing

### Desktop (> 1024px)
- Full sidebar navigation
- Multi-column layouts
- Optimal reading widths
- All features fully accessible

---

## 🔍 Search & Find

### Search Bookings
1. Go to **Bookings** page
2. Type in the search box (top-left of filter bar)
3. Results filter in real-time

### Search Customers
1. Go to **Customers** page
2. Type in the search box
3. Filter by name, email, or phone

### Global Search
Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) to open the search overlay.

---

## 📊 Understanding the Metrics

### Dashboard Metrics

**Total Bookings**
- Count of all bookings created
- Includes pending, confirmed, completed, and cancelled

**Active Customers**
- Number of customers with status "active"
- Based on recent booking activity

**Revenue (30 days)**
- Total revenue from completed bookings in last 30 days
- Excludes cancelled and pending bookings

**Completion Rate**
- Percentage of bookings that were completed
- Calculated as: Completed ÷ Total Bookings × 100

### Analytics Metrics

**Bookings Trend** (Line Chart)
- Blue line: New bookings created
- Green line: Bookings completed
- Shows daily trend over selected period

**Revenue Trend** (Bar Chart)
- Shows daily revenue
- Useful for identifying peak revenue days

**Service Distribution** (Pie Chart)
- Shows percentage of bookings by service type
- Colors match calendar color coding

**Key Metrics** (Cards)
- **Total Bookings:** Count of all bookings
- **Total Revenue:** Sum of all booking prices
- **Completion Rate:** % of completed bookings
- **No-Show Rate:** % of no-show bookings

---

## 🎨 Understanding UI Components

### Status Badges
| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 Green | Confirmed | Booking is confirmed |
| 🟡 Yellow | Pending | Waiting for confirmation |
| 🔵 Blue | Completed | Service completed |
| 🔴 Red | Cancelled | Booking cancelled |

### Service Type Colors
| Color | Service |
|-------|---------|
| 🔴 Red | Plumbing |
| 🔵 Blue | Electrical |
| 🟢 Green | HVAC |

### Icons
- 📅 Calendar - Schedule/date
- 👥 Users - Customers
- ⚙️ Settings - Configuration
- 🔔 Bell - Notifications
- 🌙 Moon - Dark mode
- ☀️ Sun - Light mode
- ⭐ Star - VIP customer
- ✓ Checkmark - Confirmed
- ✕ X mark - Cancelled

---

## 🐛 Troubleshooting

### Dashboard Not Loading
1. Check if the dev server is running: `npm run dev`
2. Make sure you're at `http://localhost:3000/dashboard`
3. Check browser console for errors (F12 > Console tab)
4. Clear browser cache (Ctrl+Shift+Delete)

### Search Not Working
1. Make sure the text is being typed in the correct search box
2. Press Enter or wait a moment for results to filter
3. Try clearing and typing again

### Table Not Showing Data
1. Scroll down - table might be below the fold
2. Check if filters are applied - click "Clear all"
3. Try refreshing the page

### Dark Mode Not Applying
1. Click the theme toggle button in the header (top-right)
2. Check system preference in OS settings
3. Clear browser cache and refresh

### Keyboard Shortcuts Not Working
1. Make sure focus is on the page (not in input field for global shortcuts)
2. Check if browser shortcuts are interfering (F12, Ctrl+W, etc.)
3. Try pressing the key combination again

---

## 💾 Local Storage & Persistence

The dashboard stores some data locally:

### Saved Preferences
- **Dark mode preference:** Persists on reload
- **Dashboard layout:** Ready for customization

### Cache
- **Booking filters:** Not persisted (resets on refresh)
- **Notifications:** Not persisted (demo only)

To clear all local data:
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 🔗 API Integration Points

The dashboard is ready to connect to these APIs:

### Bookings API
```
GET /api/v1/bookings
Query params: status, serviceType, dateFrom, dateTo, search, page
```

### Calendar API
```
GET /api/v1/calendar/events?month=2025-02
PUT /api/v1/bookings/{id}/reschedule
```

### Analytics API
```
GET /api/v1/analytics/metrics?from=...&to=...
```

### Settings API
```
GET /api/v1/business/settings
POST /api/v1/business/settings
```

### Customers API
```
GET /api/v1/customers?search=...&page=1&sortBy=name
```

---

## 📚 Additional Resources

- **Accessibility Guide:** See `DASHBOARD_ACCESSIBILITY.md`
- **Technical Details:** See `PHASE_4_3_PROGRESS.md`
- **Component Documentation:** See JSDoc comments in component files
- **Design System:** See color and spacing in `tailwind.config.js`

---

## ✅ Next Steps

1. ✅ Dashboard UI is complete and fully functional
2. ⏳ Connect to Part 3 APIs (bookings, customers, analytics)
3. ⏳ Implement real-time updates with WebSocket
4. ⏳ Add user authentication
5. ⏳ Deploy to staging/production

---

## 📞 Support

For issues or questions:
1. Check this guide
2. See `DASHBOARD_ACCESSIBILITY.md` for accessibility
3. See `PHASE_4_3_PROGRESS.md` for technical details
4. Check browser console (F12) for error messages

---

**Happy Dashboard Building! 🚀**

