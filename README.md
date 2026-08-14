# Stage Clock

A fullscreen stage presentation clock with a countdown timer, Excel/CSV agenda import, and "Up Next" display. Built as a dependency-light static web app — open `index.html` directly or host it on GitHub Pages.

## Features

### Display Modes
- **Current Time Mode** — fullscreen digital clock with current time and date.
- **Countdown Timer Mode** — large countdown with "Up Next" information at the bottom.
- **Agenda View Mode** — complete agenda with current / next / completed items highlighted.

### Agenda Management
- Import agendas from Excel (`.xlsx`, `.xls`) or CSV files (powered by [SheetJS](https://sheetjs.com)).
- Automatic parsing of **Time, Title, Speaker, Duration** columns.
- Visual indication of current, next, and completed items.
- Click any agenda item to set it as current.

### "Up Next" Information
- Shows next item's title, speaker, and start time.
- Positioned at the bottom of the countdown display.
- Toggle visibility in settings.
- Updates automatically as the timer advances.

### Timer Features
- Customizable countdown duration (minutes and seconds).
- Start, pause, reset, and stop controls.
- Visual warnings: **yellow under 5 minutes**, **red under 1 minute**.
- Auto-advance to the next agenda item when the timer completes.
- Alarm sound (three beeps) when time is up.

### Presenter Tools
- Presenter overlay showing current and next items plus timer status.
- Fullscreen mode for audience display.

### Additional
- Keyboard shortcuts (see below).
- Custom text and background colors.
- All settings saved to browser local storage.
- Responsive design for different screen sizes.

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` | Start / pause the timer |
| `R` | Reset the timer |
| `F` | Toggle fullscreen |
| `S` | Toggle settings panel |
| `1` | Current Time mode |
| `2` | Countdown mode |
| `3` | Agenda View mode |
| `→` | Next agenda item |
| `←` | Previous agenda item |
| `Esc` | Close settings / presenter overlay |

## Agenda File Format

Excel or CSV files should have a header row with these columns (case-insensitive, partial matches accepted):

| Time | Title | Speaker | Duration |
| --- | --- | --- | --- |
| 09:00 | Welcome & Opening | Jane Doe | 10 |
| 09:10 | Keynote | John Smith | 45 |

- **Time** — start time (e.g. `09:00` or an Excel time value).
- **Title** — agenda item title.
- **Speaker** — presenter name.
- **Duration** — length in minutes (used to set the countdown when the item is selected).

A built-in sample agenda is available via the **Load sample agenda** button.

## Running

No build step required. Either:

1. Open `index.html` directly in a browser, **or**
2. Serve the folder, e.g.:
   ```bash
   python3 -m http.server 8000
   ```
   then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. In the repo settings, go to **Pages**.
3. Set the source branch to `main` and folder to `/ (root)`.
4. The app will be available at `https://<your-username>.github.io/Stageclock/`.

## Tech

- Vanilla HTML/CSS/JavaScript (no framework, no build step).
- [SheetJS](https://sheetjs.com) via CDN for Excel/CSV parsing.
- Web Audio API for the alarm sound.

## License

MIT — see [LICENSE](LICENSE).
