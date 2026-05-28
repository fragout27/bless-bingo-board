# Realtime OSRS Bingo Board

A live 7x7 Old School RuneScape bingo board for clan/community events.

Participants can pick a name and color, mark tiles, add proof image links, copy proof links, and see everyone’s progress update live on the same board.

## Features

- 7x7 OSRS bingo board
- 49 tiles
- Point value shown on every tile
- Live board point counter
- Live participant list
- Participant color selection
- Participant names shown on claimed tiles
- Multiple participants can claim the same tile
- Each participant can remove their own marks
- Admin-style participant removal from the participant list
- Image/proof link input on every tile
- Copy link button for saved proof links
- CSV export of claims
- Realtime syncing through Firebase Realtime Database
- Free static hosting through GitHub Pages
- No login required

## Current Board Total

The current board is worth:

```text
445 possible points
```

The point total is calculated from the `points` values in `board.js`.

## Tech Stack

- HTML
- CSS
- JavaScript
- Firebase Realtime Database
- GitHub Pages

No build tools are required.

There is no npm install step.

## File Structure

```text
/
├── index.html
├── styles.css
├── app.js
├── board.js
├── config.js
├── firebase-rules.json
└── README.md
```

## Important Files

### `board.js`

Contains all 49 bingo tiles.

Each tile has:

```js
{
  title: "Tile Name",
  detail: "Tile description",
  points: 10
}
```

To change a tile, edit the title, detail, or points value.

Keep exactly 49 items for a clean 7x7 board.

### `config.js`

Contains the Firebase project settings.

This file must exist, but it should not be replaced after Firebase is already working.

Example format:

```js
window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### `app.js`

Handles:

- Firebase connection
- Participant saving
- Tile claims
- Point counting
- Proof links
- Copy link buttons
- CSV export
- Participant removal

### `styles.css`

Handles the visual layout, tile design, colors, buttons, and responsive behavior.

### `firebase-rules.json`

Contains the Firebase Realtime Database rules used by this project.

## Firebase Setup

1. Go to Firebase Console.
2. Create a Firebase project.
3. Add a Web App.
4. Copy the Firebase config object.
5. Paste the config values into `config.js`.
6. Go to Firebase Realtime Database.
7. Create a database.
8. Open the Rules tab.
9. Paste the contents of `firebase-rules.json`.
10. Publish the rules.

## GitHub Pages Setup

1. Create a GitHub repository.
2. Upload all project files.
3. Go to the repository settings.
4. Open Pages.
5. Set source to:

```text
Deploy from a branch
```

6. Select:

```text
Branch: main
Folder: /root
```

7. Save.
8. Wait for GitHub Pages to publish the site.

## Board Links

The board ID is controlled by the URL query parameter.

Example:

```text
https://your-github-name.github.io/your-repo-name/?board=main
```

Everyone using the same board link sees the same live board.

You can create separate boards by changing the board name:

```text
?board=main
?board=test
?board=week1
?board=finals
```

Each board ID stores separate Firebase data.

## How Participants Use It

1. Enter a display name.
2. Pick a color.
3. Click Save Player.
4. Click a tile to mark it.
5. Paste an image/proof link into a tile if needed.
6. Click Save to store the proof link.
7. Click Copy Link to copy a saved proof link.
8. Click the same tile again to remove your own mark.

## Participant Removal

The participant list includes a red remove button beside each participant.

Removing a participant:

- Deletes them from the participant list
- Removes their marks from all tiles
- Removes their proof links from all tiles
- Updates the board point total

## Proof Links

This project does not upload images directly.

Instead, participants paste a link to an image hosted somewhere else, such as:

- Discord
- Imgur
- Google Drive
- Dropbox
- RuneLite screenshot link
- Any other shareable image URL

This keeps the project free and avoids needing Firebase Storage.

## CSV Export

The Export Claims CSV button downloads a spreadsheet-friendly file containing claim data.

The CSV includes:

- Tile number
- Tile title
- Tile detail
- Tile points
- Player name
- Player color
- Image/proof link
- Claim timestamp

## No Login Warning

This project intentionally does not use user accounts.

Anyone with the board link can:

- View the board
- Add themselves as a participant
- Mark tiles
- Add proof links
- Remove participants

Only share the board link with people you trust.

## Troubleshooting

### Changes are not showing after uploading to GitHub

GitHub Pages or your browser may be caching old files.

Try:

```text
Ctrl + F5
```

If that does not work, update the version strings in `index.html`.

Example:

```html
<link rel="stylesheet" href="styles.css?v=new-version" />
<script src="board.js?v=new-version"></script>
<script type="module" src="app.js?v=new-version"></script>
```

Change `new-version` to something unique, such as:

```text
v2
v3
proof-links-v2
final-board-v1
```

### Points show as 0

Check `board.js`.

Each tile needs a valid `points` value:

```js
points: 10
```

Do not use:

```js
points: "10 pts"
```

The value must be a number.

### The board has blank or missing tiles

Check that `board.js` contains exactly 49 tile objects.

A 7x7 board requires 49 items.

### Proof links will not save

Check Firebase Realtime Database rules.

Open:

```text
Firebase Console → Realtime Database → Rules
```

Paste the contents of `firebase-rules.json`, then publish.

### The board does not sync between people

Check:

1. Everyone is using the exact same board URL.
2. The `?board=` value is the same.
3. Firebase config values in `config.js` are correct.
4. Realtime Database is enabled.
5. Firebase rules were published.

## Editing the Board

To edit tile names, descriptions, or point values, open:

```text
board.js
```

Example tile:

```js
{
  title: "Zulrah Unique",
  detail: "Tanz fang, Magic fang, Serp",
  points: 5
}
```

After editing, upload the updated `board.js` to GitHub.

If changes do not appear, update the cache version in `index.html`:

```html
<script src="board.js?v=updated-board"></script>
```

## Notes

This is a lightweight community event board.

It is not intended for sensitive data, payments, private records, or anything that requires strong user authentication.

For a private/locked-down version, authentication and stricter Firebase rules would need to be added.
