# MySeedBook - Product Roadmap

## Current Version: v1.3.1 ✅ LIVE IN PRODUCTION
*Voice & AI features released. Both subscription tiers (Essential and Voice & AI) fully operational.*

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

> Build on the existing calendar and inventory infrastructure. All features use a feature flag in `config/` while in development; no long-lived branch needed.

### Free tier
- [ ] 🆓 **Push notifications — planting reminders** — alert when a seed's planting season is approaching based on calendar entries
- [ ] 🆓 **Low stock alerts** — notify when seed quantity drops below a user-set threshold
- [ ] 🆓 **Search & filter improvements** — filter inventory by season, supplier, category, or quantity range

### Essential tier
- [ ] 🌱 **Harvest yield tracking** — record actual yield weight/quantity against expected; stored per season on the seed entry
- [ ] 🌱 **Spending tracker** — log cost per packet; running total per supplier and per season
- [ ] 🌱 **Reorder point alerts** — flag seeds that are below reorder threshold and suggest a supplier to reorder from

### Voice & AI tier
- [ ] 🤖 **Weather-based planting suggestions** — cross-reference the 5-day forecast with upcoming planting calendar entries and surface a warning ("Frost expected this week — hold off on these 3 seeds")
- [ ] 🤖 **Plant disease photo detection** — user photographs a sick leaf; OpenAI Vision identifies likely disease and suggests treatment (builds on existing image + AI infrastructure)

---

## 🌱 v1.5.0 — Garden Planning & Reporting (Q4 2026)

### Free tier
- [ ] 🆓 **Seasonal planting calendar view** — monthly view showing all seeds with planting/harvest windows colour-coded by season
- [ ] 🆓 **Dark mode** — respect system dark mode preference

### Essential tier
- [ ] 🌱 **Annual garden report** — end-of-season PDF/share export: what you planted, harvested, and spent
- [ ] 🌱 **Supplier performance summary** — germination rate and cost-per-seed comparison across suppliers
- [ ] 🌱 **CSV export** — export full seed inventory to CSV for spreadsheet use

### Voice & AI tier
- [ ] 🤖 **AI companion planting suggestions** — AI recommends which seeds to plant together based on your current inventory
- [ ] 🤖 **Automated planting schedule** — AI generates a week-by-week planting plan from your inventory and location

---

## 🔮 v1.6.0+ — Community & Social (2027, evaluate demand first)

- [ ] 🆓 **Public seed wishlist / shareable profile** — read-only public page showing what you grow (organic word-of-mouth growth)
- [ ] 🌱 **Garden plot planner** — simple grid layout where you assign seeds to raised beds or rows; rotation tracking year-over-year
- [ ] 🤖 **Seed trading / swaps** — list seeds you have surplus of and request seeds from others (requires moderation strategy before committing)

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

*Last Updated: May 3, 2026*


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
