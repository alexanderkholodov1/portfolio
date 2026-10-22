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
- ~~Exact Firebase CLI command for restoring a previous Hosting release.~~ Done 2026-10-22, see below.
- Piper TTS current upstream repository and Windows install path; faster-whisper performance on the
  booth laptop.

## Verified for P v0.3.0 (2026-10-22)

The CLI facts were checked against the installed `firebase-tools@15.34.1` (`--help` output and
`lib/hosting/api.js`), which are the CLI's own contract. The REST facts below come from the official reference pages and the discovery document.

| Fact | Source |
|---|---|
| `firebase hosting:clone <source> <targetChannel>`, formats `[projectId:]siteId:channelId` or `siteId@versionId` (source only); example `firebase hosting:clone my-site:staging my-site:live`. Used as `hosting:clone alexanderkholodov@<version ID> alexanderkholodov:live`, the immutable version ID returned by the preview deploy, because a channel source resolves to the channel's latest version at clone time | `firebase hosting:clone --help` (firebase-tools 15.34.1); docs: https://firebase.google.com/docs/hosting/manage-hosting-channels (not fetched) |
| `firebase hosting:channel:deploy [channelId] --expires <duration>` (e.g. `12h`, `30d`, max 30d, default 7d), `--json` global flag; JSON `result.<site>` carries `url` and `version` (the Hosting version ID; `lib/commands/hosting-channel-deploy.js` sets `d.version`) | `firebase hosting:channel:deploy --help`; `lib/commands/hosting-channel-deploy.js` |
| The CLI has **no** rollback command. A release is created with `POST https://firebasehosting.googleapis.com/v1beta1/projects/{p}/sites/{s}/channels/{channel}/releases?versionName={versionName}` (body: partial release, e.g. `message`) | `lib/hosting/api.js` `createRelease`; REST reference https://firebase.google.com/docs/hosting/reference/rest (not fetched) |
| Listing releases: `GET https://firebasehosting.googleapis.com/v1beta1/projects/{p}/sites/{s}/channels/{c}/releases?pageSize&pageToken` returns `{releases[], nextPageToken?}`; `Release` has `name`, `version` (a `Version` with `name`, `status`, `fileCount`), `releaseTime`, `type`. **No ordering is documented and there is no `orderBy`**, so `pickRollbackTarget` sorts by `releaseTime` and follows every page | Official REST reference https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.channels.releases/list and the Hosting discovery document https://firebasehosting.googleapis.com/$discovery/rest?version=v1beta1 (fetched 2026-10-22) |
| The authoritative current release is the channel's output-only `release` field: `GET .../v1beta1/projects/{p}/sites/{s}/channels/{c}` | https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.channels (fetched 2026-10-22) |
| `Version.status` values: `CREATED`, `FINALIZED`, `DELETED`, `ABANDONED`, `EXPIRED`, `CLONING`; only `FINALIZED` is a rollback candidate. `Release.type`: `DEPLOY`, `ROLLBACK`, `SITE_DISABLE` (never a candidate). `GET .../versions/{id}` exists and is used to revalidate the target | https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.versions and the discovery document (fetched 2026-10-22) |
| Creating a release: `POST .../channels/{c}/releases?versionName=sites/SITE_ID/versions/VERSION_ID`; the site in `versionName` must match the parent | https://firebase.google.com/docs/reference/hosting/rest/v1beta1/sites.channels.releases/create, discovery document (fetched 2026-10-22) |

Observed behaviour of a real Hosting project (release order in practice, clone semantics) is still unverified; the scripts therefore assume nothing beyond the documented fields.
