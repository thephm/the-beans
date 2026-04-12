# CSV Import Feature

The CSV import feature allows administrators to bulk import roasters from a CSV file.

## Access

- Available in Admin panel → Roasters → "Import CSV" button
- Requires admin role authentication

## CSV Format

### Required Columns
- **Roaster Name**: The name of the roaster (must be unique)
- **Country**: Country name (must exist in the countries list, e.g., "United States of America", "Canada", "United Kingdom")

### Optional Roaster Information
- **Description**: Full text description of the roaster
- **Web URL**: Website URL
- **Email**: Contact email
  - Also accepts `email address` / `Email Address`
- **Phone**: Contact phone number
  - Also accepts `Phone Number`
- **Founded**: Year founded (numeric, e.g., 2010)
- **Closed Year**: Year the roaster closed (numeric, e.g., 2024)
  - Also accepts `Closed`
- **Online Only**: Yes, No, or blank (defaults to No)
- **Deprecated**: Yes, No, or blank
  - If **Closed Year** is provided, the roaster is always imported as deprecated

### Address Information
- **Address**: Street address
- **City**: City name
- **Province**: State/Province name
- **Postal Code**: Postal/ZIP code

### Coffee Information
- **Source Countries**: Semicolon-separated list in double quotes (origin countries only)
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
- **Contact Email**: Contact email for the person
- **Contact Mobile**: Mobile phone number
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
- **deprecated**: Defaults to `false` unless **Deprecated** is `Yes` or **Closed Year** is provided

### Duplicate Handling
- If a matched roaster is **verified**, it will be skipped
- Exact name matches prefer a matching **Web URL** or **Instagram URL** when those values are provided
- If **Web URL** and **Instagram URL** are both missing, the importer falls back to exact **Roaster Name + Country** matching
- URL matches can also update close name variants such as `Company`, `Company Coffee`, `Company Roasters`, `Company Torréfacteur`, or `Company Brûlerie`
- Name variant matching is comparison-only and does not change the stored display name unless the row is applied as an update
- For comparison, roaster names are normalized by:
  - lowercasing
  - removing accents/diacritics (for example, `Torréfacteur` -> `torrefacteur`)
  - removing punctuation
  - collapsing repeated spaces
  - ignoring trailing generic suffixes while preserving the core brand root
- Ignored trailing suffixes currently include:
  - `coffee`
  - `co`
  - `roaster`
  - `roasters`
  - `roastery`
  - `roasting`
  - `cafe`
  - `cafes`
  - `torrefacteur`
  - `torrefacteurs`
  - `torrefaction`
  - `brulerie`
  - `bruleries`
  - `inc`
  - `llc`
  - `ltd`
- Trailing numbers are also ignored for comparison, so variants such as `Company 2` can match `Company`
- When a matched row contains different non-empty values, the roaster is updated
- **Closed Year** is imported when present and marks the roaster as deprecated
- **Deprecated** can explicitly set deprecation on import, but **Closed Year** takes precedence when both are present
- Blank CSV cells do **not** clear existing roaster values; empty import values are ignored
- Slugs are not changed when an existing roaster name is updated by import
- The import summary shows created, updated, skipped, warnings, and errors for each run

### Source Countries and Specialties
- Source countries must be marked as origin countries (location-only countries like Canada/USA are rejected)
- Countries must already exist in the database (unknown countries are rejected and reported)
- Country names are normalized for common variants (e.g., "U.S.A." -> "United States of America")
- Specialties are still created on demand if they don't exist

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
    "updated": 1,
    "skipped": 2,
    "createdItems": [
      {
        "row": 1,
        "id": "cm123",
        "name": "New Roaster"
      }
    ],
    "updatedItems": [
      {
        "row": 2,
        "id": "cm456",
        "name": "Counterpart Coffee",
        "changes": [
          {
            "field": "Web URL",
            "from": "https://old.example.com",
            "to": "https://new.example.com"
          },
          {
            "field": "City",
            "from": "Montreal",
            "to": "Toronto"
          }
        ]
      }
    ],
    "skippedItems": [
      {
        "row": 3,
        "name": "Duplicate Name",
        "reason": "Roaster exists, no changes."
      }
    ],
    "warnings": [],
    "errors": [
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
