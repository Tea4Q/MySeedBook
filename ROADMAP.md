# MySeedBook - Product Roadmap

## Current Version: v1.3.1 ✅ LIVE IN PRODUCTION
*Voice & AI features released. Both subscription tiers (Essential and Voice & AI) fully operational.*

**Active development branch:** `feature/v1.4.0-v1.4.1-phase1` (based on `release/v1.3.1-with-ai`)

**Tier key used below:**
- 🆓 Free — available to all users including guests
- 🌱 Essential — $7.99/month tier
- 🤖 Voice & AI — $9.99/month tier

---

## ✅ Completed

| Version | Highlights |
|---|---|
| v1.0.0 | Core seed inventory, supplier management, calendar, Supabase cloud sync |
| v1.1.x | Clean UI overhaul, native headers, login navigation fix, CI/CD |
| v1.2.x | Weather integration, Essential subscription, barcode scanner, guest mode |
| v1.3.0 | Web image ingestion (picker/paste/drag-drop), unsaved changes guard, paywall redesign |
| v1.3.1 | AI Garden Assistant, Voice Notes, Smart Shopping, Voice & AI subscription tier live |

---

## 🚀 v1.4.0 — Notifications & Inventory Intelligence (Q3 2026)

> **Phase 1 foundation complete (May 15, 2026):** Database schema, TypeScript types, feature flags, `useNotifications` hook, and `expo-notifications` integration all done on `feature/v1.4.0-v1.4.1-phase1`. UI screens to follow.

> Build on the existing calendar and inventory infrastructure. All features use a feature flag in `config/` while in development; no long-lived branch needed.

### Free tier
- [x] 🆓 **Push notifications infrastructure** — `expo-notifications` installed, `useNotifications` hook, `notification_preferences` table, `app.json` permissions
- [ ] 🆓 **Push notifications — planting reminders UI** — alert when a seed’s planting season is approaching based on calendar entries
- [ ] 🆓 **Low stock alerts UI** — notify when seed quantity drops below a user-set threshold
- [ ] 🆓 **Search & filter improvements** — filter inventory by season, supplier, category, or quantity range

### Essential tier
- [x] 🌱 **Harvest yield tracking schema** — `harvest_yields` table with weight/quantity/season, RLS, `HarvestYield` TypeScript type
- [ ] 🌱 **Harvest yield tracking UI** — record actual yield weight/quantity against expected; stored per season on the seed entry
- [ ] 🌱 **Spending tracker** — log cost per packet; running total per supplier and per season
- [ ] 🌱 **Reorder point alerts UI** — flag seeds that are below reorder threshold and suggest a supplier to reorder from

### Voice & AI tier
- [ ] 🤖 **Weather-based planting suggestions** — cross-reference the 5-day forecast with upcoming planting calendar entries and surface a warning (“Frost expected this week — hold off on these 3 seeds”)
- [ ] 🤖 **Plant disease photo detection** — user photographs a sick leaf; OpenAI Vision identifies likely disease and suggests treatment (builds on existing image + AI infrastructure)

---

## 🚀 v1.4.1 — BYOAI / MCP Server (Q3 2026)

> Lets Voice & AI tier users connect Claude Desktop, Claude.ai, and ChatGPT directly to their seed inventory via the Model Context Protocol (MCP).

### Phase 1 — Database & app foundation ✅ Complete (May 15, 2026)
- [x] 🤖 `mcp_tokens` table — SHA-256 hashed Bearer tokens, per-token scopes, soft-revoke, `create_mcp_token` / `revoke_mcp_token` RPCs
- [x] 🤖 `McpToken` TypeScript type + `mcp_integration` feature flag (Voice & AI tier)
- [x] 🤖 `ENV.mcp.endpoint` constant in `config/env.ts`

### Phase 2 — MCP Server (requires Vercel subscription)
- [ ] 🤖 Vercel Serverless Function implementing Streamable HTTP MCP transport
- [ ] 🤖 MCP tools: `list_seeds`, `get_seed`, `add_seed`, `update_seed`, `delete_seed`, `list_harvest_yields`, `log_harvest_yield`, `log_watering`, `log_fertilizer`, `get_garden_summary`
- [ ] 🤖 MCP resources: `myseedbook://inventory`, `myseedbook://low-stock`, `myseedbook://calendar`

### Phase 3 — In-app token management UI
- [ ] 🤖 Token generation screen in `AISettingsPanel` (name, scope, optional expiry)
- [ ] 🤖 One-tap copy of server URL + token
- [ ] 🤖 Revoke tokens, show last-used timestamp

### Phase 4 — Deploy & verify
- [ ] 🤖 `eas secret:create` for Supabase service role key
- [ ] 🤖 `vercel deploy` and smoke-test with MCP Inspector
- [ ] 🤖 `EXPO_PUBLIC_MCP_ENDPOINT` pointed at live URL

---

## 🌱 v1.5.0 — Garden Planning & Reporting (Q4 2026)

> Garden layout schema is already migrated on `feature/v1.4.0-v1.4.1-phase1` (tables: `gardens`, `garden_plots`, `seed_locations`, care logs). This version builds the UI on top.

### Free tier
- [ ] 🆓 **Seasonal planting calendar view** — monthly view showing all seeds with planting/harvest windows colour-coded by season
- [ ] 🆓 **Dark mode** — respect system dark mode preference

### Essential tier
- [ ] 🌱 **Garden layout UI** — named gardens (“Back Garden”, “Allotment”) with named beds/raised beds; drag-and-drop grid editor to assign seeds to grid squares
- [ ] 🌱 **Care tracking UI** — watering/fertilizer history per seed with charts; planting photo log
- [ ] 🌱 **Annual garden report** — end-of-season PDF/share export: what you planted, harvested, and spent
- [ ] 🌱 **Supplier performance summary** — germination rate and cost-per-seed comparison across suppliers
- [ ] 🌱 **CSV export** — export full seed inventory to CSV for spreadsheet use

### Voice & AI tier
- [ ] 🤖 **Garden layout MCP tools** — `place_seed`, `get_garden_layout` added to MCP server (v1.4.1 stubs activated)
- [ ] 🤖 **AI companion planting suggestions** — AI recommends which seeds to plant together based on your current inventory
- [ ] 🤖 **Automated planting schedule** — AI generates a week-by-week planting plan from your inventory and location

---

## 🔮 v1.6.0+ — Community & Social (2027, evaluate demand first)

- [ ] 🆓 **Public seed wishlist / shareable profile** — read-only public page showing what you grow (organic word-of-mouth growth)
- [ ] 🌱 **Seed trading / swaps** — list seeds you have surplus of and request seeds from others (requires moderation strategy before committing)

### Deprioritised / On Hold
- ❌ **IoT sensor integration** — hardware dependency, very small addressable audience
- ❌ **Direct supplier ordering / e-commerce** — major scope; better as a future partnership deal
- ❌ **Multi-language support** — worthwhile eventually but not until core feature set is stable

---

## 🏗️ Branching Strategy

| Scenario | Approach |
|---|---|
| New feature in development | Build on `main` behind a feature flag in `config/` |
| Feature ready for a specific tier | Replace flag with `usePremiumFeature` paywall check |
| Full version release | Cut `release/v1.x.x` branch from `main` at submission time only |
| Hotfix to production | OTA update via `eas update --channel production` when possible; new build only if native code changed |

---

## 🐛 Known Technical Debt

### Low Priority
- Pre-existing Supabase TypeScript typing errors (runtime-safe, deprioritised)
- Bundle size optimisation
- Accessibility improvements (screen reader labels)
- Broader unit test coverage

---

*Last Updated: May 15, 2026*


### Features
- [ ] **Enhanced Calendar Integration**
  - [ ] Purchase date reminders (7 days before running out)
  - [ ] Planting season notifications
  - [ ] Harvest time alerts
  - [ ] Custom reminder settings

- [ ] **Smart Notifications**
  - [ ] Push notifications for planting times
  - [ ] Low inventory alerts
  - [ ] Supplier reorder suggestions

- [ ] **Calendar Views**
  - [ ] Monthly calendar view with events
  - [ ] Weekly agenda view
  - [ ] Seasonal planting calendar

### Technical Improvements
- [ ] Offline mode support
- [ ] Performance optimizations
- [ ] Better image compression

---

## 🌱 v1.2.0 - Analytics & Insights
**Target: Q4 2025**

### Features
- [ ] **Garden Analytics**
  - [ ] Spending tracking and budgets
  - [ ] Success rate by seed type
  - [ ] Seasonal planting patterns
  - [ ] Supplier performance metrics

- [ ] **Smart Recommendations**
  - [ ] Suggest planting times based on location
  - [ ] Recommend companion plants
  - [ ] Budget optimization suggestions

- [ ] **Reporting**
  - [ ] Annual garden summary
  - [ ] Cost per harvest analysis
  - [ ] Supplier comparison reports

---

## 🏡 v1.3.0 - Garden Management
**Target: Q1 2026**

### Features
- [ ] **Plot Management**
  - [ ] Garden layout designer
  - [ ] Plot rotation planning
  - [ ] Space optimization tools

- [ ] **Inventory Tracking**
  - [ ] Real-time seed inventory
  - [ ] Automatic deduction on planting
  - [ ] Reorder point alerts

- [ ] **Harvest Tracking**
  - [ ] Yield recording
  - [ ] Quality ratings
  - [ ] Cost-per-pound calculations

---

## 🔮 Future Ideas (v2.0+)
**Target: 2026+**

### Advanced Features
- [ ] **Community Features**
  - [ ] Seed trading marketplace
  - [ ] Local gardener connections
  - [ ] Share garden progress

- [ ] **AI Integration**
  - [ ] Plant disease detection
  - [ ] Weather-based recommendations
  - [ ] Automated planting schedules

- [ ] **IoT Integration**
  - [ ] Smart sensor integration
  - [ ] Automated watering systems
  - [ ] Weather station data

- [ ] **E-commerce**
  - [ ] Direct supplier ordering
  - [ ] Price comparison tools
  - [ ] Bulk purchasing coordination

---

## 🐛 Known Issues & Technical Debt

### High Priority
- [ ] Fix CSS linting warnings in date picker
- [ ] Improve image upload error handling
- [ ] Add proper loading states

### Medium Priority
- [ ] Standardize component architecture
- [ ] Add comprehensive test coverage
- [ ] Improve TypeScript strict mode compliance

### Low Priority
- Pre-existing Supabase TypeScript typing errors (runtime-safe, deprioritized)
- Bundle size optimisation
- Accessibility improvements (screen reader labels)
- Broader unit test coverage


---

## 📊 Success Metrics

### User Engagement
- [ ] Daily active users
- [ ] Seeds added per user
- [ ] Calendar events created
- [ ] Feature adoption rates

### Technical
- [ ] App load time < 3 seconds
- [ ] 99%+ uptime
- [ ] < 1% error rate
- [ ] High user satisfaction scores

---

## 💡 Ideas Backlog

### User Requests
- [ ] Dark mode theme
- [ ] Export data to CSV
- [ ] Barcode scanning for seeds
- [ ] Weather integration
- [ ] Multi-language support

### Innovation Ideas
- [ ] AR plant identification
- [ ] Time-lapse garden photos
- [ ] Social sharing features
- [ ] Garden journaling
- [ ] Companion planting suggestions

---

*Last Updated: July 18, 2025*
*Next Review: August 1, 2025*
