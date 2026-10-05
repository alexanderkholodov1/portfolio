# 09 — Verified external facts (checked 2026-10-04/05)

Re-verify before relying on a number if months have passed.

| Fact | Source |
|---|---|
| Realtime Database simultaneous connections: **100 on Spark**, 200,000 on Blaze | https://firebase.google.com/docs/database/usage/limits |
| Cloud Firestore no-cost quota: **50,000 reads, 20,000 writes, 20,000 deletes per day; 1 GiB stored; 10 GiB/month outbound**; one free database per project | https://firebase.google.com/docs/firestore/quotas |
| Firestore max document size 1 MiB | https://firebase.google.com/docs/firestore/quotas |
| Cloud Functions require the Blaze plan | https://firebase.google.com/docs/projects/billing/firebase-pricing-plans |
| Hosting on Spark: **10 GB storage; 10 GB/month transfer**; exceeding transfer → after a brief grace period sites are **disabled for the rest of the month**; quota is project-level | https://firebase.google.com/docs/hosting/usage-quotas-pricing |
| Hosting rewrites: first matching rule wins; brace globs like `/foo{,/**}`; headers per glob; no documented rewrite to another Hosting site | https://firebase.google.com/docs/hosting/full-config |
| Be a Dragon is USFQ's open house | https://www.usfq.edu.ec/en/events/be-dragon |

Project state checked 2026-10-05 with the admin key (read-only): project `alexanderkholodov` ACTIVE,
default Hosting site `alexanderkholodov` (`https://alexanderkholodov.web.app`), Firestore API not
enabled, Authentication not initialized, no web apps.

## Verify at implementation time (not checked in planning)
- iOS motion permission API (`DeviceMotionEvent.requestPermission`) behaviour on current iOS.
- Web Share API with files support on target browsers.
- Preview channel domain pattern and whether anonymous auth needs authorized domains.
- Exact Firebase CLI command for restoring a previous Hosting release.
- Piper TTS current upstream repository and Windows install path; faster-whisper performance on the
  booth laptop.
