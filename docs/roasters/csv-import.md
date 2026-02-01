# CSV Import Feature

The CSV import feature allows administrators to bulk import roasters from a CSV file.

## Access

- Available in Admin panel → Roasters → "Import CSV" button
- Requires admin role authentication

## CSV Format

### Required Columns
- **Roaster Name**: The name of the roaster (must be unique)
- **Country**: Country name (e.g., "USA", "Canada", "United Kingdom")

### Optional Roaster Information
- **Description**: Full text description of the roaster
- **Web URL**: Website URL
- **Email**: Contact email
- **Phone**: Contact phone number
- **Founded**: Year founded (numeric, e.g., 2010)
- **Online Only**: Yes, No, or blank (defaults to No)

### Address Information
- **Address**: Street address
- **City**: City name
- **Province**: State/Province name
- **Postal Code**: Postal/ZIP code

### Coffee Information
- **Source Countries**: Semicolon-separated list in double quotes
  - Example: `"Ethiopia;Colombia;Brazil"`
- **Specialties**: Semicolon-separated list in double quotes
  - Example: `"Light Roast;Medium Roast;Single Origin"`

### Social Media URLs
All social media fields are optional:
- **Instagram URL**
- **TikTok URL**
- **Facebook URL**
- **LinkedIn URL**
- **YouTube URL**
- **Threads URL**
- **Pinterest URL**
- **BlueSky URL**
- **X URL**

### Contact Person Information
If provided, a person will be created and associated with the roaster:
- **First Name**: Required if adding a person
- **Last Name**: Optional
- **Title**: Job title (e.g., "Master Roaster")
- **Mobile**: Mobile phone number
- **LinkedIn URL**: Personal LinkedIn profile
- **Instagram URL**: Personal Instagram profile
- **Bio**: Personal biography
- **Role**: Semicolon-separated list in double quotes
  - Options: Owner, Employee, Roaster, Admin, Marketing, Scout, Customer
  - Example: `"Owner;Roaster"`
- **Primary**: Yes or No (indicates if this is the primary contact)

## Import Behavior

### Default Values
- **verified**: Always set to `false` (unverified) for imported roasters
- **showHours**: Set to `false` by default
- **createdAt**: Set to current timestamp
- **createdById**: Set to the admin user performing the import

### Duplicate Handling
- If a roaster with the same name already exists, it will be skipped
- The import summary will show which rows were skipped and why

### Source Countries and Specialties
- New countries and specialties are automatically created if they don't exist
- Existing countries and specialties are matched by name (case-insensitive)

### Error Handling
- Import continues even if individual rows fail
- Errors are collected and displayed in the results summary
- Person creation failures won't prevent roaster creation

## API Endpoint

```
POST /api/roasters/import/csv
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

Body: file={csv_file}
```

### Response Format
```json
{
  "message": "CSV import completed",
  "results": {
    "total": 10,
    "created": 8,
    "skipped": 2,
    "errors": [
      "Row 3: Roaster 'Duplicate Name' already exists",
      "Row 7: Missing roaster name"
    ]
  }
}
```

## Example CSV

See [sample-roasters-import.csv](../sample-roasters-import.csv) for a working example with multiple roasters.

## Implementation Details

### Backend
- Route: `server/src/routes/csvImport.ts`
- Uses `csv-parse` library for parsing
- Uses `multer` for file upload handling
- Transaction support for data integrity

### Frontend
- Component: `client/src/components/CSVImportDialog.tsx`
- Integrated in: `client/src/app/admin/roasters/page.tsx`
- Supports drag-and-drop file selection
- Shows real-time import progress

## Security

- Admin-only access enforced at API level
- File type validation (must be .csv)
- Input sanitization for all fields
- Audit log created for each import action

## Limitations

- Maximum file size: 10MB (configurable via Express settings)
- All imported roasters start as unverified
- Geographic coordinates are not imported (must be set separately)
- Images must be added after import
