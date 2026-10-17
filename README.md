# Upbeat

A self-contained study app for VCE Music Units 1 and 2. Static site, no server, no login. Progress is stored on the phone.

## Publishing on GitHub Pages

1. Put the contents of this folder at the root of the repository (or in the folder GitHub Pages serves). Keep the empty `.nojekyll` file: without it GitHub Pages runs the site through Jekyll, which hides files and folders whose names start with an underscore (such as `content/questions/_util.js`) and breaks the lessons. Files whose names start with a dot are hidden in Finder, so check it is there with `ls -a`.
2. In the repository settings, turn on GitHub Pages for the branch.
3. Open `https://<username>.github.io/<repository>/` on the phone, then use Share → Add to Home Screen in Safari.

Every path in the app is relative, so it works from a project address such as `username.github.io/repository-name/`.

## Trying it on a computer before publishing

Opening `index.html` straight from a folder shows only the shell, because browsers do not load JavaScript modules or fetch lesson files from a `file://` address. Serve the folder instead:

    cd upbeat
    python3 -m http.server 8000

then open `http://localhost:8000/` in a browser. Press Ctrl+C in the terminal to stop the server.

## Updating

After changing any file, run

    node tools/build.mjs

and commit everything, including the regenerated `sw.js` and `version.json`. The service worker caches every listed file for offline use, and a new version shows an "Update available" message in the app. Saved progress is never cleared by an update.

If `node` is not available, the app still works online without rebuilding, but the offline cache list will be stale until `sw.js` is regenerated.

## Checks

    node tools/test-theory.mjs

checks the music rules (scales, key signatures, intervals, triads, groupings, tunes) and every generated question bank: bank size, three distinct wrong answers, and no Unit 2 material in Unit 1 banks.

## Folder guide

- `index.html`, `css/app.css` — shell and styles
- `js/` — code. `theory.js` holds the music rules every lesson, example and quiz answer is derived from
- `content/lessons/*.md` — lesson text, one file per lesson, editable without touching code
- `content/questions/*.js` — question generators per lesson; answer keys are computed, not typed. Boss tests draw 20 questions across a strand's banks
- `js/practice.js` — tuner, drone, metronome, play-back exercise, journal, recordings (kept in IndexedDB on the phone) and piece planner
- `js/game.js` — the merge game: one life per 90-second game, personal best, records, collection and jar designs
- `audio/clips/` and `audio/clips.json` — the bundled recordings (96 kbps) and, for each, its title, performer, licence, credit, source, excerpt times and listening task. Add a recording by dropping the file in and adding one entry; a missing file shows "Recording coming soon"
- `fonts/` — Bravura, Fraunces and Source Sans 3 (SIL Open Font License; see `fonts/LICENCES.txt`)
- `tools/` — the build script and the single-file preview bundler

## Lesson file format

All 34 lessons are built (L1 to L13, A1 to A8, C1 to C7, P1 to P6). Frontmatter with `code`, `title`, `unit` and `summary`, then paragraphs, `## headings` and these blocks:

    :::def Term :: definition
    :::aside Title :: text
    :::example <type> key=G keysig caption="..."
    :::tool <tool-name> [params]
    :::clip <clip-id> :: <title> :: <listening task>
    :::unit2 Title ... :::endunit2
    :::quiz

## Lives, streaks and unlocks

Lives come only from work: boss test passed 5, quiz 70% or more 2, quiz under 70% 1, aural set of 10 questions 1, listening template completed 1, practice journal entry (once a day) 1. A quiz earns again only on a better score or once a day. The cap is 10, or 15 with streak bonuses. A day counts toward the streak when a quiz, aural set or boss test is completed; bonus lives follow the plan's table (0, 1, 1, 2, 3, 3, 5, then 3 a day and 5 every seventh day); every seventh day earns a streak saver. Jar designs unlock at streak 7, 14 and 21 and on passing a boss test.
