# OSRS Realtime Bingo Board

This is a free static realtime bingo board for OSRS clan bingo.

## What it does

- 7x7 bingo board
- Each participant enters a display name
- Each participant picks a cross-off color
- Clicking a tile adds or removes that participant's mark
- Everyone with the same board link sees updates live
- Each claimed tile shows who claimed it
- Claims can be exported as CSV

## Important note

The supplied item list had 43 items. A 7x7 board needs 49, so six placeholder slots were added at the end of `board.js`.

## Firebase setup

1. Go to https://console.firebase.google.com/
2. Create a project.
3. Add a Web App.
4. Copy the Firebase config object.
5. Open `config.js` and replace the placeholder values.
6. In Firebase, create a Realtime Database.
7. Open the Realtime Database Rules tab.
8. Paste the contents of `firebase-rules.json`.
9. Publish the rules.

## GitHub Pages hosting

1. Create a GitHub repository.
2. Upload all files from this folder.
3. Make sure `index.html` is in the repository root.
4. Go to repository Settings > Pages.
5. Set Source to Deploy from a branch.
6. Select the `main` branch and `/root` folder.
7. Save.
8. Open the GitHub Pages URL.

## Multiple boards

Use the `board` query parameter:

- `https://yourname.github.io/repo-name/?board=main`
- `https://yourname.github.io/repo-name/?board=test-board`
- `https://yourname.github.io/repo-name/?board=week-1`

Everyone using the same board link sees the same board state.

## Editing board items

Open `board.js` and change the objects inside `window.BINGO_ITEMS`.

Keep exactly 49 items for a 7x7 board.
