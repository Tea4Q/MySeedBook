# Barcode Scanner Future Issue Draft

## Title
Move barcode scanning to future release and prioritize premium voice-first entry

## Summary
Barcode scanning is being removed from the active user journey for now. In practice it does not provide a reliable enough inventory entry/update experience compared with the product direction of premium voice-assisted create and edit flows.

## Why defer it
- Seed packet data quality is inconsistent across suppliers and barcodes.
- Current scan flow still requires too much manual correction after capture.
- Voice-first entry is a better fit for seeds, suppliers, and calendar events.
- Product effort should focus on premium features that reduce friction during full-form entry.

## Keep in repository
- Keep [components/BarcodeScannerModal/index.tsx](components/BarcodeScannerModal/index.tsx) for future reactivation.
- Keep barcode memory/lookup utilities until product direction is revisited.

## Active UX change
- Hide barcode entry points from [app/add-seed.tsx](app/add-seed.tsx).
- Hide barcode entry points from [app/(tabs)/index.tsx](app/(tabs)/index.tsx).

## Future reactivation checklist
1. Re-evaluate barcode coverage across supported seed suppliers.
2. Improve scan-to-field confidence and supplier matching.
3. Add post-scan correction UX before record creation.
4. Reintroduce scan buttons only after measured accuracy is acceptable.
5. Decide whether barcode remains premium-gated or becomes a separate experimental feature.

## Related roadmap
- Premium-gated voice input for seed, supplier, and calendar forms.
- Voice command parsing for indoor sow dates, transplant dates, and save entry actions.