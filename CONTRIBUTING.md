# Contributing

Thank you for helping improve NatureSnap AI.

## Local setup

1. Install Node.js and npm.
2. Clone the repository and run `npm install`.
3. Copy `.env.example` to `.env` and add your `GROQ_API_KEY`.
4. Run `npm start` and open `http://localhost:3000`.

Do not commit `.env` or any API key.

## Branch naming

Use a short, descriptive branch name:

- `feat/short-description`
- `fix/short-description`
- `docs/short-description`
- `chore/short-description`

## Pull request checklist

- [ ] The change is focused and documented when needed.
- [ ] Existing behavior is preserved unless the change is intentional.
- [ ] `node --check server.js` passes.
- [ ] No secrets or generated screenshots are included.
- [ ] The pull request explains what changed and how it was checked.

## Reporting bugs

Open a bug report using the issue template. Include the steps to reproduce, expected behavior, actual behavior, environment details, and relevant logs without secrets.
