# OttoFill

OttoFill is a Chrome extension that automatically fills web forms using URL parameters and integrates with Gmail to display email content alongside the form.

## Features

- **Automatic Form Filling**: Fills input fields, textareas, and select dropdowns based on URL parameters
- **Gmail Integration**: Authenticates with Gmail and displays email content in a side drawer
- **Smart Matching**: Uses fuzzy matching (Levenshtein distance) to find the closest match for select options
- **Side Drawer Interface**: Non-intrusive sliding drawer that displays email content and controls
- **URL-Triggered Autofill**: Can be triggered automatically via URL parameters

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files
5. The OttoFill extension should now appear in your extensions list

## Usage

### Method 1: Manual Trigger

1. Click the OttoFill extension icon in your browser toolbar
2. The side drawer will open
3. Click "Authenticate Gmail" to connect your Gmail account (first time only)
4. Click "Ottofill this page!" to autofill the current page based on URL parameters

### Method 2: URL Parameter Trigger

Add URL parameters to automatically trigger the extension:

```
https://example.com/form?triggerottofillextension=true&name=John&email=john@example.com&messageId=abc123
```

Parameters:
- `triggerottofillextension=true` - Required to trigger autofill
- `messageId` - (Optional) Gmail message ID to display email content
- Any other parameters will be matched to form fields by name or ID

### Form Field Matching

OttoFill matches URL parameters to form fields using:
1. Exact match on input `name` attribute
2. Exact match on input `id` attribute
3. Case-insensitive matching
4. Fuzzy matching for select dropdowns (finds closest match)

### Supported Input Types

- Text inputs
- Textareas
- Select dropdowns (with fuzzy matching)
- Checkboxes (accepts: true, on, 1)
- Radio buttons

## File Structure

```
ottofill2/
├── manifest.json       # Extension configuration
├── background.js       # Service worker for Gmail API calls
├── content.js          # Content script for page interaction
├── popup.html          # Extension popup (minimal)
├── popup.js            # Popup script
├── ottofill.html       # UI template
└── ottofill.js         # UI logic
```

## Permissions

The extension requires the following permissions:
- `activeTab` - To interact with the current page
- `identity` - For Gmail OAuth authentication
- `storage` - To store authentication tokens
- `https://www.googleapis.com/` - To access Gmail API

## Gmail API Setup

The extension uses Google OAuth2 for Gmail authentication. The OAuth configuration is in `manifest.json`:
- Client ID is pre-configured
- Scope: `https://www.googleapis.com/auth/gmail.readonly` (read-only access)

## Technical Details

### Token Management
- Access tokens are stored locally with a 1-hour expiration
- Tokens are automatically refreshed when expired
- Tokens are removed on authentication errors

### Email Display
- Emails are displayed in a sandboxed iframe for security
- Supports both HTML and plain text emails
- Includes proper encoding for international characters
- Applies responsive styling and zoom for readability

### Fuzzy Matching Algorithm
Uses Levenshtein distance to find the closest matching option in select dropdowns when exact matches aren't found.

## Development

To modify the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the OttoFill extension card
4. Test your changes

## Recent Updates

- Added email display in drawer
- Implemented automatic form filling without popup
- Added Gmail authentication and token management
- Improved form field matching with fuzzy logic

