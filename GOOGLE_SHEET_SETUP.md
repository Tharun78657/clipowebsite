# How to Send Form Data to Google Sheets (Excel)

To make your contact form send data directly to a Google Sheet (which you can then download as Excel), follow these steps:

## 1. Create a Google Sheet
1.  Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2.  Give it a name (e.g., "Clipo Media Leads").
3.  In the first row, add these headers in columns A through E:
    *   **A1**: `Timestamp`
    *   **B1**: `Name`
    *   **C1**: `Email`
    *   **D1**: `Phone`
    *   **E1**: `Message`

## 2. Add the Google Apps Script
1.  In your Google Sheet, go to **Extensions** > **Apps Script**.
2.  Delete any existing code in the editor and paste the following:

```javascript
// Google Apps Script to save form data to a Google Sheet
const SHEET_NAME = 'Sheet1'; // Make sure this matches your sheet tab name

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  
  // Extract data from the POST request
  const timestamp = new Date();
  const name = e.parameter.name || 'N/A';
  const email = e.parameter.email || 'N/A';
  const phone = e.parameter.phone || 'N/A';
  const message = e.parameter.message || 'N/A';
  
  try {
    // Append the data to the next available row
    sheet.appendRow([timestamp, name, email, phone, message]);
    
    // Return a success response
    return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // Return an error response
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 3. Deploy the Script
1.  Click **Deploy** > **New deployment**.
2.  Select **Type**: "Web app".
3.  **Description**: "Clipo Form Handler".
4.  **Execute as**: "Me".
5.  **Who has access**: "Anyone" (**Crucial for the form to work**).
6.  Click **Deploy**.
7.  Copy the **Web App URL** (it should look like `https://script.google.com/macros/s/.../exec`).

## 4. Update the Website Code
1.  Open `js/script.js`.
2.  Find the `scriptURL` variable (around line 503).
3.  Replace the old URL with your new **Web App URL**.

```javascript
const scriptURL = 'YOUR_NEW_COPIED_URL_HERE';
```

## 5. Test the Form
1.  Open your website in a browser.
2.  Fill out the contact form and submit.
3.  Check your Google Sheet; the data should appear automatically!

---
*Note: If you want to download this as an Excel file, just go to **File** > **Download** > **Microsoft Excel (.xlsx)** in your Google Sheet.*
