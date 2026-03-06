# E2E Testing Checklist for Copybar MVP

## Manual Testing (after starting dev server)

### Landing Pages
- [ ] Home page loads with hero text "Talk to 10 Digital Clones"
- [ ] About page loads with company mission
- [ ] Docs page loads with getting started guide
- [ ] All page links work and navigation flows smoothly

### Authentication & Waitlist
- [ ] Waitlist page shows Google Sign-In button
- [ ] Clicking "Join Waitlist" on home redirects to waitlist
- [ ] Accessing /chat without auth redirects to /waitlist
- [ ] Navigation bar shows "Join Waitlist" for unauthenticated users

### Chat Functionality (requires backend running + DB setup)
- [ ] Chat page initializes without errors when approved
- [ ] God Mode displays "💡 God Mode" indicator
- [ ] User can type and send message in God Mode
- [ ] Capybara AI response appears in conversation
- [ ] Error messages display properly if backend is down
- [ ] Chat Input disabled while message is sending
- [ ] Conversation Mode button available after clones are loaded
- [ ] Mode switching between God Mode and Conversation Mode works
- [ ] @mention parsing works in input (shows in console)

### Error Handling
- [ ] Empty message validation prevents sending blank message
- [ ] Network errors display user-friendly error messages
- [ ] Loading states appear during message sending
- [ ] Error messages auto-clear on retry

### Responsive Design
- [ ] Pages render correctly on desktop (1200px+)
- [ ] Layout responsive on tablet (768px)
- [ ] Chat fits well on different screen sizes
- [ ] Navigation adapts on smaller screens

## Automated Tests (Playwright)

Run: `npm run test:e2e`

- [ ] Landing pages load (home, about, docs)
- [ ] Navigation between pages works
- [ ] Waitlist page displays correctly
- [ ] Chat page redirects unauthenticated users
- [ ] Auth flow protects routes

## Integration Testing (requires full stack)

- [ ] Google OAuth flow completes (requires GOOGLE_CLIENT_ID)
- [ ] User created in Supabase after signup
- [ ] Session tokens saved to localStorage
- [ ] Capybara AI responds to messages (requires backend + DeepSeek)
- [ ] Digital clones participate in conversation
- [ ] Message history persists in session
- [ ] Mode switching maintains state

## Notes

- Backend must be running on port 3001 for full E2E tests
- Supabase project must be configured with proper tables
- Google Client ID required for OAuth flow testing
- DeepSeek API key required for LLM responses
- All data in localStorage can be cleared via DevTools for testing
