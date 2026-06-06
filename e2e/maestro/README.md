# Maestro Mobile E2E

This folder contains mobile end-to-end flows for release validation.

## Prerequisites
- Install Maestro CLI: https://maestro.mobile.dev/getting-started/installing-maestro
- Android emulator/device or iOS simulator/device running the app

## Run

```bash
maestro test e2e/maestro
```

## Notes
- `release-smoke.yaml` is a baseline smoke flow for guest access + seed/calendar/supplier entry points.
- Expand with scenario-specific flows:
  - auth-guest-free-premium.yaml
  - add-edit-seed-required-fields.yaml
  - image-inputs-camera-gallery.yaml
  - supplier-crud.yaml
  - calendar-double-tap-and-edit.yaml
  - weather-premium-gating.yaml
