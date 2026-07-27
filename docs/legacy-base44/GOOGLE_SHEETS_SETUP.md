# Google Sheets Integration Setup

## Step 1 — Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Name it: **Open Minds Studios - Inquiries**
3. In **Row 1**, add these exact column headers (one per cell, A through H):

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Timestamp | Parent Name | Email | Student Grade | Subject / Exam | Interested Program | Main Goal | Student Needs Message |

---

## Step 2 — Create the Google Apps Script

1. Inside the spreadsheet, click **Extensions > Apps Script**.
2. Delete any existing code and paste the following:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.parentName || '',
      data.email || '',
      data.studentGrade || '',
      data.subjectExam || '',
      data.interestedProgram || '',
      data.mainGoal || '',
      data.studentNeeds || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click **Save** (disk icon). Name the project anything, e.g. "OMS Form Handler".

---

## Step 3 — Deploy as Web App

1. Click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Description**: OMS Contact Form
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**.
5. Authorize the script when prompted (click "Allow").
6. **Copy the Web App URL** — it looks like:
   `https://script.google.com/macros/s/XXXXXXXXXXXX/exec`

---

## Step 4 — Add the URL to the app

Open **both** of these files in the Base44 editor:

- `pages/Contact.jsx`
- `components/landing/ContactSection.jsx`

In each file, find this line near the top:

```js
const GOOGLE_SHEETS_WEBHOOK_URL = '';
```

Replace it with your Web App URL:

```js
const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

Save both files. Form submissions will now automatically appear as new rows in your Google Sheet.

---

## Notes

- The form still saves to Base44 and sends the notification email as before.
- Google Sheets saving happens in parallel and does not block the form submission.
- If the Google Sheets URL is left empty, that step is silently skipped and everything else still works.