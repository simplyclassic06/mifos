# Mifos X – Playwright Tests

UI and API tests for the [Mifos X web app](https://demo.mifos.community), written with Playwright (JavaScript).

## Setup

```
npm ci
npx playwright install
```

## Run

| What | Command |
|---|---|
| All tests | `npx playwright test --workers=2` |
| Smoke | `npx playwright test --grep @smoke` |
| Regression | `npx playwright test --grep @regression` |
| Known app bugs (expected to fail) | `npx playwright test --grep @known-bug` |
| Report | `npx playwright show-report` |

Use `--workers=2` against the shared demo server; more parallel logins make it slow.

## Structure

| Folder | Contents |
|---|---|
| `tests/` | Spec files (`login/`, `clients/`) |
| `pages/` | Page objects |
| `api/` | API helpers for test data |
| `test-cases/` | Manual test case document |
