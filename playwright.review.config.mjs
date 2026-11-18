// Advisory design review (tests/review): run by CI after the blocking checks, never blocks a release.
import base from './playwright.config.mjs';

export default { ...base, testDir: 'tests/review' };
