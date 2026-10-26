# Mifos X – Test Cases

App: https://demo.mifos.community (mifos / password)

## 1. Login

| ID | Test Case | Steps | Expected | Priority | Smoke | Regression | Manual Run | Automation |
|---|---|---|---|---|---|---|---|---|
| TC-L01 | Login page loads | Open `/` logged out | URL `#/login?returnUrl=%2Fhome`, title "Login", heading "Mifos® X WebApp", Username*, Password*, Login disabled | P1 | ✅ | – | Pass | ✅ Done (`tests/login/login.spec.js`) |
| TC-L02 | Valid login | mifos / password → Login | "Signing in...", "Please wait..." popup, lands on `#/home`, "Welcome mifos to Default!", **"Warning" popup** ("This system is for authorized use only…") → Close dismisses it | P1 | ✅ | ✅ | Pass | Next |
| TC-L10 | Logout | Login → User Profile → Logout | Back on `#/login`; `#/home` redirects to login | P1 | ✅ | ✅ | Not run | Pending |
| TC-L07 | Wrong password | mifos / wrongpass123 → Login | Popup "Incorrect username or password. Please check your credentials and try again.", stays on login, both fields cleared | P1 | – | ✅ | Pass | Pending |
| TC-L04+L05 | Required fields | Leave Username / Password empty, click away | "Username is required" / "Password is required (min length 8)", Login disabled | P2 | – | ✅ | Pass | Pending |
| TC-L03 | Login disabled when empty | Open login, type nothing | Login disabled | P2 | – | – | Pass | Optional |
| TC-L08 | Unknown username | nouser123 / password123 → Login | Same error as TC-L07 | P2 | – | – | Not run | Optional |
| TC-L06 | Password < 8 chars | mifos / abc | Field invalid, Login disabled | P2 | – | – | Pass (bug: message says "is required") | After bug fix |
| TC-L09 | Show / hide password | Type password → Show password | Text visible, button becomes "Hide password" | P3 | – | – | Pass | Optional |

### Login – Manual only

| ID | Test Case | Why manual |
|---|---|---|
| M-01 | Page look / layout | Visual |
| M-02 | Dark theme | Visual |
| M-03 | Language switch translations | Human judgement |
| M-04 | Message wording / UX | Subjective |
| M-05 | Session timeout (~30 min idle) | Slow |
| M-06 | Mobile / tablet / cross-browser | Exploratory |
| M-07 | Browser save-password / autofill | Browser-dependent |
| M-08 | Keyboard-only & screen reader | Accessibility |

## 2. Create Client

| ID | Test Case | Steps | Expected | Manual Run |
|---|---|---|---|---|
| TC-01 | Form layout | Open `#/clients/create` | Steps GENERAL / FAMILY MEMBERS / ADDRESS; fields Office*, Legal Form*, First*, Last*, Submitted On* (today) etc.; Previous disabled | Pass |
| TC-02 | Office dropdown | Click Office | 24 offices (Head Office, home branch…) | Pass |
| TC-03 | Step navigation | Fill required → Next → Next | Family Members & Address steps shown | Pass |
| TC-04 | No address → no Preview | Address step, no address, Next | Stays on Address, no Preview/Submit | Pass (no message shown) |
| TC-05 | Add address dialog | Address → Add | Address Type* (Permanent/TEMPORARY), Postal Code, Line 1–3, City, State, Country; Add disabled until type chosen | Pass |
| TC-06 | Preview step | Add address → Next | PREVIEW with summary, Previous / Cancel / Submit | Fail (needs 2nd Next click) |
| TC-07 | Create client (happy path) | Head Office, QAAuto Live1012a, Permanent address → Submit | `#/clients/{id}/general`, PENDING, External Id auto UUID | Pass (id 200) |
| TC-08 | Activate client | Client actions → Actions → Activate → date → Confirm | Status ACTIVE, Activation Date shown | Pass |
| TC-09 | New client in list | Open `#/clients` | Count +1, new client on top | Pass |

## 3. Search Clients

| ID | Test Case | Steps | Expected | Manual Run |
|---|---|---|---|---|
| TC-10 | List default view | Open `#/clients` | Search box, Show Closed Accounts, count, Import/Create links, columns, pager | Pass |
| TC-11 | Full name | "Live1012a" | 1 result, "1–1 of 1", × Clear | Pass |
| TC-12 | Case-insensitive | "QAAUTO" | Found | Pass |
| TC-13 | Partial name | "Live10", "walsh", "ean" | Found | Pass |
| TC-14 | External Id | full / last part / "smpilot-e3m-10" | Found | Pass |
| TC-15 | Account no. | "Head Offic15325", "15325" | Found | Pass |
| TC-16 | Mobile | "7294036824", "72940", "+959586887989" | Found | Pass |
| TC-17 | Unicode | "Jürgen", "Đorđe" | 3 / 2 results | Pass |
| TC-18 | No results | "zzzz-nomatch-999" | "No client was found" | Pass |
| TC-19 | Special chars | `O'Brien`, `<script>` | No results, no error | Pass |
| TC-20 | `%` / `_` literal | `%`, `_` | No / literal matches | **Fail** – returns all 120 |
| TC-21 | Trim spaces | `"   sean   "` | sean walsh found | **Fail** – no results |
| TC-22 | Default page size | Open list | Selector = rows shown | **Fail** – shows 25, displays 50 |
| TC-23 | Pagination | Next / Last / 100 / 25 | Correct ranges & page counts | Pass |
| TC-24 | Show Closed filter | Unticked, search "Mercy Akinyi" | Closed client hidden | **Fail** – always shown |

## 4. View Client Details

| ID | Test Case | Steps | Expected | Manual Run |
|---|---|---|---|---|
| TC-25 | Active client | Open client 200 | Header, ACTIVE, tabs, summary sections | Pass |
| TC-26 | Pending client | `#/clients/26/general` | PENDING, no Activation Date | Pass |
| TC-27 | Closed client | `#/clients/91/general` | CLOSED | Pass |
| TC-28 | Pending actions menu | Client actions | Edit / Actions / Assign Staff / More; Actions: Close, Transfer, Activate, Withdraw, Reject, Delete | Pass |
| TC-29 | Invalid client id | `#/clients/999999/general` | Clear not-found message | **Fail** – "valuer" typo, redirects to last client |
| TC-30 | Page title | List / details | Title matches page | **Fail** – stays "Client Actions" |

## Not covered yet

Create-form validations (required, email, mobile "abc", duplicate External Id), Entity legal form, Cancel, Family members, logged-out access to client pages, details tab contents.
