# Study Buddy Database

MongoDB Atlas hosts the `studybuddy` database. Node.js scripts in
this folder reproduce the initial database setup.

## Requirements

- Node.js 24
- A MongoDB database account with appropriate permissions
- Your current public IP allowed in Atlas

## Setup

Run these commands from the database folder:

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

If you already have a working `.env`, keep it instead of copying
over it.

Edit `.env` to include your database username and URL-encoded
password. For example, an @ inside a password becomes %40.

Never commit `.env` or actual credentials to GitHub.

Run:

```powershell
node --env-file=.env setup.js
```

## Collections

| Collection | Purpose |
|---|---|
| courses | Shared course catalog |
| users | Accounts, student profiles, course references, and weekly availability |
| contactRequests | Requests and decisions about sharing contact information |
| blocks | Records of blocked users |
| authTokens | Planned storage for authentication-related tokens |

These structures are a draft. Field validation and authentication
details still need coordination with the API developer.

## Indexes

- `unique_course_code`: unique combination of `prefix` and `number`
  in courses.
- `unique_user_email`: unique email in users.
- MongoDB automatically creates a unique `_id` index in each collection.

The setup script preserves existing documents and can be run again.

## Course Catalog Format

Each course uses these fields:

```json
{
  "prefix": "COP",
  "number": "3502C",
  "name": "Computer Science I"
}
```

Store course numbers as strings to preserve letter suffixes.
Preserve existing course `_id` values during imports because user
profiles reference them.

## Current Limitations

The scripts create collections, indexes, and starter test data.
They do not enforce field validation or implement API endpoints.

## Test Data

After running setup.js, run:

```powershell
node --env-file=.env seed.js
```

This adds two starter courses and a demo student if they are missing.
Existing records and their IDs remain unchanged.

The demo student is marked `isDemo: true`, is unverified, and has
no login credentials. Production matching must exclude demo users
and unverified accounts.