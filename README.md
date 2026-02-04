# Checklist Calendar

A calendar-style checklist app you can open anywhere (home, school, or on the go) for free. It runs entirely in the browser and stores your data locally, so there’s nothing to install and no account required.

## Features

- **Calendar layout** with month navigation and a today shortcut.
- **Class categories** with color tags so you can group tasks by subject.
- **Per-day task lists** with completion toggles and notes.
- **Quick add** panel to drop tasks onto any day.
- **Filters** to focus on a single class or hide completed items.
- **Cloud sync (free)** using Google Sheets + Apps Script so Chrome on a Chromebook can always stay updated.

## Getting started

### Option 1: Open locally
1. Download or clone this repository.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari).

### Option 2: Host it for free (recommended for home + school)
You can publish this app on GitHub Pages so you can open it from anywhere.

1. Create a GitHub repository and push this project.
2. Go to **Settings → Pages**.
3. Set the source to the `main` branch and `/root` folder.
4. Save and wait for the URL to appear.
5. Open that URL on any device.

### Cloud sync setup (Google Sheets + Apps Script)
This keeps your data in a Google Sheet and syncs automatically from any Chrome browser.

1. Create a new Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Replace the script with the following:

```javascript
const SHEET_NAME = "Data";

function doGet() {
  const sheet = getSheet_();
  const raw = sheet.getRange("A1").getValue();
  if (!raw) {
    return ContentService.createTextOutput(JSON.stringify({ classes: [], tasks: [], updatedAt: 0 }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(raw).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = getSheet_();
  const payload = e.postData.contents;
  sheet.getRange("A1").setValue(payload);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  return sheet;
}
```

4. Click **Deploy → New deployment**.
5. Choose **Web app**.
6. Set **Execute as** = Me.
7. Set **Who has access** = Anyone with the link.
8. Copy the web app URL.
9. Paste the URL into the app’s **Cloud Sync** panel and click **Connect**.

> Your data is stored in the sheet cell A1 as JSON. The app auto-syncs every 30 seconds and after edits.

## File overview

- `index.html` – main layout and UI.
- `styles.css` – styling and layout.
- `app.js` – data model, calendar rendering, and interactions.

## Ideas to make it even better

- Add reminders with browser notifications.
- Add a weekly agenda list view.
- Connect to Google Calendar for automatic sync.
- Add a “study streak” tracker for motivation.

---

Enjoy organizing your classes!
