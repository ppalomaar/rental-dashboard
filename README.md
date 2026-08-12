# Google Spreadsheet Version

1. Publish Google Sheet sebagai CSV.
2. Salin URL CSV.
3. Buka `js/dashboard.js`.
4. Ganti:

```js
const SHEET_CSV_URL = "PASTE_GOOGLE_SHEET_CSV_URL_DI_SINI";
```

Format URL CSV:
`https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=0`

Setelah data di spreadsheet bertambah, klik **Refresh Data** di dashboard.
