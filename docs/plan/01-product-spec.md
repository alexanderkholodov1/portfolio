# 01 — Product spec: Collective Galaxy

**Name:** *Collective Galaxy* (English, primary) / *Galaxia Colectiva* (Spanish, secondary).
**Where:** `alexanderkholodov.web.app/galaxy` — an *event* inside the operator's portfolio.

## Concept

BAD is **one of the projects** in the portfolio: a **solar system that starts empty**. Every person
who connects creates a planet, star or moon; together they grow it into a galaxy. **Every object was
made by one person, and everything is recorded as a keepsake** — the day can be replayed years later.

The operator is **not** "the sun". The galaxy belongs to the visitors.

Tone: **tender, satisfying, non-destructive.** Interactions can change other people's experience of
the galaxy (e.g. a new star lights nearby planets) but never damage someone else's object.

## Surfaces

| Route | Who | What |
|---|---|---|
| `/galaxy/screen` | Booth TV / external monitor | The live 3D galaxy, the join QR, creator counter, scenes, assistant presence |
| `/galaxy/create` | Visitors' phones (QR target) | Workshop → launch → edit → hangar → global interactions → postcard → talk to the assistant |
| `/galaxy/talk` | Operator's phone (Google sign-in) | Push-to-talk to the assistant with operator permissions |
| `/galaxy` | Anyone, any time | Live view during the fair (from the aggregated snapshot); after the fair, the frozen season + timelapse |
| `/galaxy/o/{id}` | Anyone, forever | Permanent page of one object |

All views carry the portfolio header with the operator's profile and social links (see
`02-architecture.md` §Shared packages). The QR on the screen is **one single QR** for everyone.

## Approved features

### A. Creating your object (phone)

- **Types:** planet, star, moon (moon rules: D6).
  - Planet: size; ocean ↔ desert; mountains; clouds; rings; atmosphere colour.
  - Star: colour temperature (red → blue); size; corona. **A star lights nearby planets** (the
    approved non-hostile influence on others).
  - Moon: size; craters; colour.
- 2–5 controls per type plus presets. Visuals are **procedural shaders** (noise terrain, cloud layer,
  atmosphere rim glow, rings) — no pre-made models.
- **Private workshop with live preview:** visitors can try as many designs as they want; previews
  render only on their phone and never touch the galaxy until they press Launch.
- **Name:** chosen from generated combinations (adjective + noun, available in EN and ES, e.g.
  "Quiet Aurora"). **No free text** anywhere (D5).
- **Launch by swipe:** the gesture's direction and strength become the initial velocity; the orbit is
  computed from it (see `02-architecture.md` §Orbital model). **A bad launch never destroys the
  object: if it would escape or fall into the star, it becomes a comet** on a long elliptical orbit
  that keeps coming back.

### B. One object per person, without frustration or spam

- Each visitor (anonymous identity per device) has **one active object** in the galaxy.
- The active object can be **edited at any time, non-destructively, all day** while the fair lasts;
  edits show live on the screen.
- To try something completely different, the visitor **launches a new object**:
  - the previous object **crumbles into cosmic dust / rocks** (animation) and goes to their
    **hangar** (kept, never deleted; still part of the timelapse and of their history);
  - from the hangar they can **relaunch** an old object: **the rocks reassemble** into it, and the
    current one crumbles into the hangar in turn.
- Anti-spam enforced in security rules: minimum interval between writes per user, and a maximum
  number of launches/relaunches per day (default 5). See `03-data-and-security.md`.
- What happens to crumble rocks after the animation: D5b (default: they fade in ~2 min).

### C. Sound

- **Unique sound fingerprint per object:** every adjustment moves synth parameters (size → register;
  atmosphere colour → timbre/filter; rings → shimmer/reverb; oceans → chorus; mountains → rougher
  harmonics; star temperature → brightness). The combination is mathematically unique to the object.
- All sounds quantized to one musical scale so any combination stays harmonious.
- **Subtle** by design: sound design, not a music box. On the screen, max ~8 simultaneous voices
  (visible/nearby objects only) with a global volume; mute toggle on the phone.
- **Petting:** tap your object (on the phone, or on the screen when the camera focuses it) → tender
  squash-and-stretch bounce + a small sound derived from its fingerprint.

### D. Global interactions (same for everyone, any time, with cooldowns)

- **Shake the phone** → a wave of aurora / nebula sweeps across the galaxy on the screen. The
  operator can tell the whole booth "everyone shake!" and they see it together. (iOS requires a
  motion-permission tap; devices without a motion sensor get a fallback button.)
- **Swipe to throw a comet** across the galaxy (ephemeral visual; logged as an event).
- **Shooting star with a message** — **predefined messages only** (~12 exclamations, EN/ES). Nothing
  typed by users.

### E. Ambient events

- **Meteor shower:** happens on its own at random intervals. Purely ambient.
- The assistant may announce events and remind people they can shake (see `04-assistant.md`).

### F. Screen scenes (`/galaxy/screen`)

- Default galaxy view with the join QR always visible in a corner, plus creator counter.
- Big-QR scene.
- **Spotlight:** camera flies to a newly launched object with a caption ("New planet: Quiet Aurora").
- Idle cinematic camera when nobody interacts.
- Timelapse scene.
- Assistant presence: small voice-reactive orb + subtitles of what it says.
- Scenes switchable by the assistant (closed tool set) and by `config/live`.

### G. Memory and permanence

- **Timelapse:** the birth of the galaxy replayed object by object from the event log, with scrubber,
  speed and pause. Exact, not approximate. Must remain viewable on the portfolio for years.
- **Permanent object pages** `/galaxy/o/{id}`: the object in 3D, its sound, name, date, and the
  operator's profile/social links. Anyone can visit any object forever.
- **Postcard:** at the end, the visitor gets an image of their object (1080×1920) with its name,
  "Be a Dragon 2026" and a QR/link to its permanent page; shared via the Web Share API when available,
  otherwise downloaded. Ready for Instagram stories.
- **Season freeze:** after the fair the season ("BAD 2026") is exported to static JSON on Hosting, so
  it costs no Firestore quota forever.
- Post-fair interactivity on the portfolio (e.g. a "Season 2"): D12, later.

## Rejected (do not build)

| Idea | Why |
|---|---|
| The operator as the sun / centre | BAD is one project among many; the galaxy belongs to visitors |
| Seeding life on other people's planets | Operator decided against it after reflection |
| User-typed messages or names | Public screen; predefined messages and generated names only |
| "Say it and it appears" (voice → object) | The assistant is the operator's companion, not a public object generator |
| Competitive minigame ("Orbit" ships, Agar.io-style eating) | Not fun enough as proposed; destructive to the ecosystem |
| Events: eclipse, chorus, star birth (cooperative stardust) | Rejected by operator |
| Physical QR cards | One QR on the screen for everyone |
| Camera-based visitor counting / booth narration by camera | Hard to implement well; metrics come from galaxy data instead |
| Lapel microphone | Operator doesn't have one; phones are the microphones |
| Cosmic seed from MunHub muons | Operator not convinced by the connection |
| AR "planet between your fingers" | Not a priority; maybe later (idea backlog) |
| Humming as an event | Rejected as event; humming as individual interaction is D7 (default: out for the 21st) |

## Portfolio relationship

- The portfolio is **not only space**: it will have many themes; space is the world where science /
  BAD lives. Worlds beyond the shell are post-fair (see `90-idea-backlog.md`).
- For the fair the portfolio ships a **minimal shell**: Home, Projects, About, Links (`/links`,
  replacing Linktree), Galaxy — EN/ES, light/dark — with a live banner on Home:
  "Live: Collective Galaxy · Be a Dragon 2026 · N creators".
