# Code in motion

A staged Codex-style coding workspace for filming with a physical camera. No AI endpoint, terminal execution, filesystem editing or code evaluation occurs. All generated/pasted source is escaped display text.

Open `index.html`. Set text size (12–34px), generation speed (15–200 nominal characters/sec), source length (48–160 lines), palette or custom accent/text/editor colors. Four palettes: Midnight mint, Soft violet, Warm amber, Paper light. Optional custom filename, task prompt and source (up to24,000 characters). Custom source supersedes the example length slider. Settings persist locally; Reset settings restores defaults.

Preview starts after the chosen0/2/3/5-second lead-in. Record fullscreen requests native fullscreen and removes recording controls. R restarts with lead-in, Space pauses/resumes, F requests fullscreen, Escape restores controls and pauses. A blocked fullscreen request leaves controls available with a short explanation. Loops hold completed code for3 seconds, then restart; no extra timer stacks. Hidden tabs pause the clock and scroll without skipping code when returning.

Rendering reveals characters with restrained cadence variation and syntax highlighting. Only the current/new lines are updated. The editor follows new lines using a damped scroll, without jumping each line. Reduced motion disables blinking/pulsing and scroll interpolation. Source text, Unicode pairs, cancellation and complete TSX preset generation have focused tests in scripts/test-code-studio.mjs.

Assets: bundled Inter regular/semibold copied from the existing Teams scene (FONT-LICENSE.txt); monospace uses platform Consolas/SF Mono/Liberation Mono. icons.js contains unchanged Lucide icon SVGs generated from the repository's installed lucide-react package (ICONS-LICENSE.txt). Preview artwork is an original vector composition. This is a filming interpretation, not an exact replica or live instance of Codex.

Build with node build.mjs. Publish selectively with node publish.mjs --code-studio-only.
