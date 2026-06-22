# WBR Local — Mobile App + SPA Rewrite (Design)

**Status:** Draft for review
**Date:** 2026-06-22
**Owner:** Gina

## Goal

Turn WBR Local into a full-blown mobile app (iOS + Android) whose headline value is **push notifications** for local hazards and closures (NWS weather/flood/heat, burn bans, school closures, AMBER/boil-water). Do it without maintaining two codebases, and in the same move fix the current site's biggest liability: ~58 articles hand-duplicated into 111 HTML files.

## Non-goals

- Native-only UI frameworks (React Native / Flutter) — rejected: second codebase, no reuse of existing web/Clojure skills.
- Migrating hosting off AWS — rejected: the site, DNS, and credentials already live on AWS S3 + CloudFront; AWS covers every backend need.
- Re-building the marketing/content as a CMS. Articles stay file-based, just as data instead of duplicated HTML.

## Background

- Current site: hand-authored **static HTML + vanilla JS + CSS**, no build step. 111 HTML files, of which `site/content/articles/` (53) is a near-exact duplicate of `site/articles/` (53) — ~48 byte-identical. Real page count ≈ 58.
- Hosted on **AWS S3 + CloudFront** (`wbr.maniginam.dev`, distribution `E1GYG7LWHML23S`, bucket `wbr.maniginam.dev`, us-east-1).
- A parallel Cloudflare Pages copy (`wbr-local`) and a few Cloudflare Pages Functions (markdown negotiation, `/api/subscribe`, Link header) exist but are **not** used by the live site. They become legacy; `subscribe` is re-ported to AWS Lambda.

## Locked decisions

1. **One codebase**: a ClojureScript + Reagent/re-frame SPA becomes BOTH the website (as a PWA) and the app (via Capacitor).
2. **Capacitor** wraps the compiled web bundle into native iOS + Android apps.
3. **Stay on AWS.** Web on S3 + CloudFront; backend on Lambda + DynamoDB + EventBridge.
4. **Articles become data** (markdown + EDN frontmatter) rendered by one component — duplication eliminated.

## Architecture

### Frontend (SPA)
- **Tooling:** shadow-cljs, Reagent, re-frame, reitit (routing).
- **PWA:** web manifest + service worker (offline cache of shell + recent articles).
- **Content model:** each article is a markdown file + EDN frontmatter (title, slug, category, updated, summary). A build task compiles them to an EDN/JSON index + per-article payloads the SPA fetches. No hand-written per-page HTML.
- **Views:** home (hero dashboards), article list by category, article reader, alerts, settings (push opt-in, subscribe).
- **Live data (client):** weather (open-meteo), river (existing source), traffic cams (DOTD streams + the geographic map already built), NWS alerts, burn ban, school rolling-week (from `school-schedule.json`-style data).

### Mobile (Capacitor)
- Loads the same compiled SPA bundle in a native shell.
- Plugins: Push Notifications (APNs/FCM), Geolocation (optional “near me”), Share, App (deep links).
- Targets: iOS + Android. One config, two store builds.

### Backend (AWS)
- **API:** Lambda + Function URL (or API Gateway) for `POST /subscribe`, `POST /push/register` (store device token), `POST /push/preferences`.
- **Data:** DynamoDB
  - `subscribers` (email, source, created_at)
  - `push_tokens` (token, platform web|ios|android, topics[], created_at)
  - `alerts_seen` (alert id/hash → for dedupe across poll cycles, TTL)
  - `announcements` (manual closures/notices: id, message, attribution, severity, starts, expires)
- **Alert poller:** EventBridge schedule (e.g. every 5 min) → Lambda that polls NWS (`api.weather.gov/alerts/active?point=…`), burn-ban source, and school/closure data; dedupes against `alerts_seen`; on a new qualifying event, sends push to subscribed tokens by topic.
- **Push senders:** web-push (VAPID) for PWA subscriptions; APNs + FCM for native tokens. One Lambda, three transports.

### Push flow
1. User opts in (web: Notification + PushManager/VAPID; native: Capacitor Push → APNs/FCM token).
2. Client `POST /push/register` with token + chosen topics (weather, flood, burn-ban, school-closures, amber).
3. Poller detects a new event → looks up tokens subscribed to that topic → sends via the right transport.
4. Tap opens the relevant in-app screen (deep link).

## Features

**v1 (MVP)**
- Data-driven article browse + reader (replaces duplicated HTML)
- Hero live dashboards: weather, river, traffic-cam map, NWS alerts, burn ban, school rolling-week
- Push opt-in + delivery for NWS alerts, burn ban, school closures
- Email subscribe → DynamoDB

**Later**
- Power-outage map, local-economy section, Beacon Connect bus monitoring, AMBER/boil-water sources, announcements admin UI, “near me” geolocation.

## Build phases (each is its own implementation plan)

- **Phase 1 — SPA (web):** scaffold shadow-cljs/Reagent app; migrate articles to data + build pipeline; port hero dashboards + map; ship as PWA on existing S3/CloudFront. *No app, no backend yet.*
- **Phase 2 — AWS backend:** `subscribe` Lambda + DynamoDB; then the EventBridge alert poller and push-send Lambda (web-push first).
- **Phase 3 — App + native push:** Capacitor wrap; APNs/FCM; store assets + submission to App Store and Play.

## Prerequisites (owner action)

- Apple Developer Program ($99/yr) + Google Play Developer ($25 once).
- APNs key/cert (iOS) and FCM project (Android).
- VAPID keypair for web push.

## Risks / open questions

- **Article migration fidelity:** 58 articles must convert to markdown without losing structure (tables, internal links). Mitigate: scripted HTML→markdown + spot review.
- **SEO during cutover:** an SPA must keep crawlable content + the existing URLs/sitemaps. Mitigate: prerender/SSG the article routes at build time (static HTML shells) so URLs and SEO survive.
- **iOS web-push vs native:** native APNs via Capacitor is the reliable path on iOS; treat PWA web-push as best-effort.
- **Burn-ban / closures data:** still no clean API (deferred). Manual `announcements` feed covers them until a source exists.

## Out of scope (this spec)

- Outage map data sourcing, Beacon Connect integration, local-economy data — tracked as later features, specced separately when picked up.
