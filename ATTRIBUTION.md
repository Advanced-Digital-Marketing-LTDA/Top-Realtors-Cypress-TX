# Attribution and provenance

The website preserves the source facts and visual direction from the user's Cypress Realtor Guide export. The original design was adapted from supplied Kimi-generated HTML. The Astro replacement starts from target main `deb667c483a953df80afdc2ba7e18921d350f2c9`, which includes the PR1 triage fixes.

## Photograph

- Original: the full-size file at the Wikimedia Commons source below. The 4102px copy from the export was removed from the web root on October 30, 2026 (CRG-20); no page referenced it.
- Work: “May Morning” by Michael Martin (pinemikey), May2014.
- Source: https://commons.wikimedia.org/wiki/File:May_Morning_-_Flickr_-_pinemikey.jpg
- License: CC BY-SA2.0, https://creativecommons.org/licenses/by-sa/2.0/
- Responsive660/1320/2640px JPEG derivatives in public/assets are preserved byte for byte. AVIF and WebP copies at the same widths were encoded from the original on October 30, 2026. All retain attribution/license; the layout crops them for display.

Preserve attribution and applicable share-alike requirements for adaptations. This image license is not a license for the entire codebase.

## Foundation and content

Site-Bootstrap-ADM `916df29d7410b4a9a5048ed69819b5da448a2ecf` supplies original setup guidance/templates and the reused property-options helper. The referenced Lippincott example's project code, identity and providers were not copied into the foundation.

Professional facts/public business contacts remain in src/content/realtors.json and linked source citations. Four individually scoped HAR survey snapshots retain their separate check dates. Sources are public profiles/self-published websites, not independently audited performance records. Company/professional names belong to their owners; paid placement is visibly labeled.

Instrument Serif and DM Sans (SIL Open Font License 1.1, license texts in public/fonts) are self-hosted from public/fonts, so pages make no font-service requests. The latin subsets come from the Fontsource packages @fontsource/instrument-serif 5.3.0 and @fontsource-variable/dm-sans 5.3.0. Dependencies retain their package licenses. The code and design are licensed under the PolyForm Shield License 1.0.0 (LICENSE); the photos above keep their own licenses.
