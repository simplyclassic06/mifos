# Mifos X Client Management Test Plan

## Application Overview

Test plan for Create Client, Search Clients and View Client Details on the Mifos X WebApp demo (https://demo.mifos.community, user mifos / password). Seed: tests/seed.spec.ts logs in. Observed UI: Clients list (#/clients) has a search box "Search by client name, external Id, mobile", a "Show Closed Accounts" checkbox, "Import Client" and "Create Client" links, a count header (e.g. "119 clients"), a table (NAME, STATUS, ACCOUNT NO., EXTERNAL ID, OFFICE NAME) and a paginator (Rows 25/50/100, "Showing 1-50 of 119", Page 1 of 3, first/prev/next/last). Create Client (#/clients/create) is a 3-step stepper: GENERAL, FAMILY MEMBERS, ADDRESS. Client details (#/clients/{id}/general) show header info, a "Client actions" menu and tabs. Assumptions: shared demo data, so data can change and the session times out after inactivity (re-run the seed to log in again). Use unique names (e.g. prefix "QA-<timestamp>") for created data. Known data used: client "sean walsh" (id 199, ACTIVE, office "home branch", account no. "home branc10660", external id ending 16af26a6ba8e); many PENDING clients such as "QA Client001". NOTE: during exploration no Submit/Finish button was found on the final ADDRESS step (only Previous and Next), and clicking Next there did not create the client, so scenarios that need a successful submit carry an "Open question" note.

## Test Scenarios

### 1. Create Client

**Seed:** `tests/seed.spec.ts`

#### 1.1. Create form displays expected fields and steps for Person legal form

**File:** `tests/create-client/form-layout-person.spec.ts`

**Steps:**
  1. Starting from a logged-in session, open #/clients and click 'Create Client'.
    - expect: URL is #/clients/create, title 'Create Client', breadcrumb 'Clients > Create Client'.
    - expect: Steps GENERAL, FAMILY MEMBERS, ADDRESS are shown; GENERAL is active.
  2. Inspect the GENERAL step.
    - expect: Fields: Office*, Legal Form* (default Person), External Id, First Name*, Middle Name, Last Name*, Date of Birth (calendar button), Gender, Staff, 'Is staff' checkbox, Mobile No, Email Address, Client Type, Client Classification, Submitted On* (prefilled with today's date, e.g. 12 October 2026), 'Active?' checkbox, 'Open Savings Account?' checkbox.
    - expect: 'Previous' is disabled and 'Next' is enabled.

#### 1.2. Create Person client with only required fields (happy path)

**File:** `tests/create-client/create-person-required-only.spec.ts`

**Steps:**
  1. Open #/clients/create. Select Office 'Head Office'. Enter First Name 'QA-Auto' and Last Name 'Person<timestamp>'. Leave Submitted On at default.
    - expect: No validation errors are shown.
  2. Click Next twice (GENERAL -> FAMILY MEMBERS -> ADDRESS) and then complete the wizard.
    - expect: Client is created and the app navigates to the client's details page (#/clients/{id}/general) showing the full name, status PENDING (Active? not ticked), Office Head Office and an Account No.
    - expect: Searching the new name in the clients list returns the client.
    - expect: Open question: no Submit/Finish control was found on the ADDRESS step in exploration; confirm how the wizard is submitted and record any defect.

#### 1.3. Create client with all general fields, Active checked

**File:** `tests/create-client/create-person-all-fields.spec.ts`

**Steps:**
  1. Fill Office, External Id (unique), First/Middle/Last Name, Date of Birth (pick via calendar), Gender, Staff, Mobile No, Email 'qa@example.com', Client Type, Client Classification, Submitted On = today, tick 'Active?'.
    - expect: All selects offer options and values are retained when moving between steps and back.
  2. Add a family member on FAMILY MEMBERS ('Add') and an address on ADDRESS ('Add' opens dialog 'Add Client Address' with Address Type, Postal Code, Address Line 1-3, City, State / Province, Country, Cancel/Add), then submit.
    - expect: Client is created with status ACTIVE and Activation Date equal to the date submitted.
    - expect: Details page Address and Family Members tabs show the entered data.

#### 1.4. Required-field validation on GENERAL step

**File:** `tests/create-client/required-validation.spec.ts`

**Steps:**
  1. Open the create form, touch Office (open and close dropdown with Escape) and leave First Name and Last Name empty; click into and out of each.
    - expect: 'Office is required' appears; First Name and Last Name show required errors; fields marked with * (Office, Legal Form, First Name, Last Name, Submitted On).
  2. Click 'Next' with required fields empty.
    - expect: Wizard does not complete; user cannot finish creation. Record whether Next advances (observed: Next remained enabled on GENERAL) and whether the later submit is blocked.
  3. Clear Submitted On.
    - expect: A required error appears for Submitted On.

#### 1.5. Invalid input: email format

**File:** `tests/create-client/invalid-email.spec.ts`

**Steps:**
  1. Enter 'not-an-email' in Email Address and blur the field.
    - expect: Error 'Email not valid' is displayed.
  2. Replace with 'qa@example.com'.
    - expect: Error disappears.

#### 1.6. Invalid input: non-numeric Mobile No, long names, special characters

**File:** `tests/create-client/invalid-inputs-misc.spec.ts`

**Steps:**
  1. Enter 'abc' in Mobile No.
    - expect: Observed: no inline error shown. Record behaviour on submit (accept/reject) and flag as defect if accepted.
  2. Enter names with 100+ characters, accents (Jürgen), non-Latin (中文), leading/trailing spaces, and symbols (@, _, 1) in First/Last Name.
    - expect: Valid unicode names are accepted or rejected consistently with a clear message; no crash. Existing demo data contains such names so they are expected to be creatable.
  3. Enter a future Date of Birth and a typed invalid date string such as '99/99/9999'.
    - expect: Future/invalid date is rejected or shows validation message.

#### 1.7. Date fields: Submitted On and Date of Birth calendar behaviour

**File:** `tests/create-client/date-fields.spec.ts`

**Steps:**
  1. Open the 'Open calendar' picker for Submitted On and Date of Birth and choose dates.
    - expect: Selected date appears in 'DD Month YYYY' format (e.g. 12 October 2026).
  2. Set Submitted On to a future date and attempt to complete creation.
    - expect: Future submitted date is rejected by the app or server with an error message.
  3. Tick 'Active?'.
    - expect: Activation date is taken from submitted date (verify on details page); note any additional field that appears.

#### 1.8. Office and Staff dropdowns

**File:** `tests/create-client/office-dropdown.spec.ts`

**Steps:**
  1. Open the Office dropdown.
    - expect: Offices listed include Head Office, Direction Centre, home branch, Gayaza, Abids Branch, etc. (24 options observed).
  2. Select 'home branch' then open Staff.
    - expect: Staff options (if any) correspond to the selected office; verify list refreshes when office changes.

#### 1.9. Legal Form switch to Entity changes fields

**File:** `tests/create-client/legal-form-entity.spec.ts`

**Steps:**
  1. Open Legal Form dropdown.
    - expect: Options: Person, Entity.
  2. Select Entity.
    - expect: First/Middle/Last Name, Date of Birth, Gender replaced by Entity Name*, Incorporation Date, Constitution*, Main Business Line, Incorporation Validity Till Date, Incorporation Number, Remarks; Office, External Id, Staff, Mobile No, Email Address, Client Type, Client Classification, Submitted On remain.
  3. Leave Entity Name empty and blur.
    - expect: 'Client name is required' is shown.
  4. Fill Office, Entity Name 'QA Entity <ts>', Constitution and submit.
    - expect: Entity client created and shown in list with Entity type (same 'Open question' on submit control applies).
  5. Switch back to Person.
    - expect: Person fields reappear; previously typed values behavior is noted.

#### 1.10. Duplicate External Id is rejected

**File:** `tests/create-client/duplicate-external-id.spec.ts`

**Steps:**
  1. Create/fill a client using External Id '16af26a6ba8e' (existing) or the full UUID of sean walsh and submit.
    - expect: Server error about duplicate external id is shown, client not created and wizard data is retained.

#### 1.11. Stepper navigation: Previous/Next, tabs and data retention

**File:** `tests/create-client/stepper-navigation.spec.ts`

**Steps:**
  1. Fill GENERAL, click Next, then Previous, then click the ADDRESS and FAMILY MEMBERS step headers directly.
    - expect: Entered values persist; steps GENERAL/FAMILY MEMBERS show a green check once valid; Previous is disabled on step 1.
  2. On FAMILY MEMBERS click 'Add'; on ADDRESS click 'Add' then 'Cancel' in the 'Add Client Address' dialog.
    - expect: Cancel closes dialog without adding an entry.

#### 1.12. Cancel/back behaviour: leave the form without saving

**File:** `tests/create-client/cancel-back.spec.ts`

**Steps:**
  1. Fill First and Last Name, then click the 'Clients' breadcrumb.
    - expect: Navigates to #/clients with no client created (search for the typed name returns 'No client was found').
  2. Use browser Back from the create page, then press Forward.
    - expect: Navigation works; document whether form content is cleared. Observed: after leaving and returning, Legal Form retained a previous 'Entity' choice in one session (state not reset) - verify and report.

#### 1.13. Session timeout during creation

**File:** `tests/create-client/session-timeout.spec.ts`

**Steps:**
  1. Leave the create form idle until the session expires, then press Next/submit.
    - expect: Dialog 'Session Timeout - Session timed out after a period of inactivity.' with Close button appears; user is redirected to #/login; entered data not saved.

### 2. Search Clients

**Seed:** `tests/seed.spec.ts`

#### 2.1. Clients list default view

**File:** `tests/search-clients/list-default.spec.ts`

**Steps:**
  1. Open #/clients.
    - expect: Header shows total count (e.g. '119 clients'), search box, 'Show Closed Accounts' checkbox, Import Client and Create Client links.
    - expect: Table columns NAME, STATUS, ACCOUNT NO., EXTERNAL ID, OFFICE NAME; each row shows initials avatar, name, legal form (Person) and 'Activated <date>' if activated, status chip (ACTIVE/PENDING), account no., external id and office.
    - expect: Paginator shows 'Showing 1-50 of 119', Rows 25/50/100, 'Page 1 of 3'.

#### 2.2. Search by full client name

**File:** `tests/search-clients/by-name.spec.ts`

**Steps:**
  1. Type 'sean' in the search box and press Enter.
    - expect: Count shows 1 client; row 'sean walsh', ACTIVE, home branch; 'Showing 1-1 of 1', Page 1 of 1.
  2. Search 'sean walsh' and 'SEAN' (different case).
    - expect: Same result; search is case-insensitive.

#### 2.3. Search by external ID

**File:** `tests/search-clients/by-external-id.spec.ts`

**Steps:**
  1. Search '16af26a6ba8e' (list shows the trailing portion of the external id).
    - expect: sean walsh is returned.
  2. Search the full external id '3111ea21-6824-408c-90b4-16af26a6ba8e' shown on details page.
    - expect: sean walsh is returned.

#### 2.4. Search by account number

**File:** `tests/search-clients/by-account-number.spec.ts`

**Steps:**
  1. Search '10660' then the full account no. 'home branc10660'.
    - expect: Observed: sean walsh returned for '10660'. Confirm the full string behaviour.

#### 2.5. Search by mobile number

**File:** `tests/search-clients/by-mobile.spec.ts`

**Steps:**
  1. Use a client that has a mobile number (precondition: create or find one, e.g. via create flow) and search its mobile number.
    - expect: Client is returned (placeholder says search supports mobile). Not verified during exploration due to no known test data.

#### 2.6. Partial match search

**File:** `tests/search-clients/partial-match.spec.ts`

**Steps:**
  1. Search 'sea', then 'ean', then 'walsh'.
    - expect: Document whether prefix and mid-string matches return sean walsh (observed 'ean' returned sean walsh, but the result may have been the previous cached result - re-verify by clearing between searches).
  2. Search 'Client004'.
    - expect: Multiple PENDING 'Client004' clients returned with correct count and pagination.

#### 2.7. No results message

**File:** `tests/search-clients/no-results.spec.ts`

**Steps:**
  1. Search 'zzzzqqq' and press Enter.
    - expect: Text 'No client was found' replaces the table; table, count and paginator are hidden.
  2. Clear the search box and press Enter.
    - expect: Full list (119 clients) returns.

#### 2.8. Special characters and unicode in search

**File:** `tests/search-clients/special-characters.spec.ts`

**Steps:**
  1. Search '%'.
    - expect: Observed: returns all 119 clients (acts as wildcard) - flag as possible defect/unexpected behaviour.
  2. Search '_', '@', '中文', 'Đorđe', "O'Brien", '<script>alert(1)</script>', and a 300 character string.
    - expect: No JS error or injection; results or 'No client was found' are returned; names such as '@a Client004', '中文 Client004', 'Đorđe Brønstad' are findable.
  3. Search a whitespace-only string.
    - expect: Behaves like empty search or shows no error.

#### 2.9. Show Closed Accounts toggle

**File:** `tests/search-clients/show-closed.spec.ts`

**Steps:**
  1. Tick 'Show Closed Accounts' on the list.
    - expect: List is re-queried; closed/rejected clients (if any) appear with a corresponding status; count changes accordingly. Untick restores.
  2. Combine the toggle with a name search.
    - expect: Both filters apply.

#### 2.10. Pagination and page size

**File:** `tests/search-clients/pagination.spec.ts`

**Steps:**
  1. On the unfiltered list, change Rows to 25, 100.
    - expect: Row count matches the selected size; 'Showing x-y of 119' and 'Page n of m' update (25 -> 5 pages, 100 -> 2 pages).
  2. Use next, last, previous and first buttons.
    - expect: Correct ranges shown; first/prev disabled on page 1 and next/last disabled on last page.
  3. Go to page 2, then search 'sean'.
    - expect: Results reset to page 1 of the filtered set.

#### 2.11. Open client from search results

**File:** `tests/search-clients/open-from-results.spec.ts`

**Steps:**
  1. Search 'sean' and click the 'sean walsh' row.
    - expect: Navigates to #/clients/199/general for that client.

#### 2.12. Import Client and Create Client links

**File:** `tests/search-clients/header-links.spec.ts`

**Steps:**
  1. Click 'Import Client' then go back; click 'Create Client'.
    - expect: Import goes to #/organization/bulk-import/Clients; Create goes to #/clients/create.

### 3. View Client Details

**Seed:** `tests/seed.spec.ts`

#### 3.1. View ACTIVE client details from list

**File:** `tests/view-client/active-client.spec.ts`

**Steps:**
  1. Search 'sean' and click 'sean walsh'.
    - expect: URL #/clients/199/general; breadcrumb 'Clients > sean walsh > General'.
    - expect: Header shows Client Name 'sean walsh' with ACTIVE chip, Office 'home branch', Account No. 'home branc10660', External Id '3111ea21-6824-408c-90b4-16af26a6ba8e', Activation Date '12 October 2026', Staff 'Unassigned', and a 'View Signature' link.
  2. Review body panels.
    - expect: PERFORMANCE HISTORY (No. of loan cycles, active loans, last loan amount, available savings 1,000,000.00), UPCOMING CHARGES ('No Upcoming Charges Found', 'Charges Overview'), ACCOUNTS with filters All/Loan/Saving/Fixed Deposit/Recurring Deposit/Shares and 'Show Closed Accounts', a savings account card (20620, ACTIVE, Regular Saving product, balances), and COLLATERAL DATA ('No Collateral Data Found'). Data may vary on the shared demo.

#### 3.2. Client detail tabs

**File:** `tests/view-client/tabs.spec.ts`

**Steps:**
  1. On the details page click each tab: General, Personal Data, Address, Family Members, Identities, Documents, Notes, Enrollment Status, and the datatable tabs (Contacttest, Ppp, Qa Client Check, Test Table, Testfoo, Testfoo22).
    - expect: Each tab loads without error and URL updates; empty tabs show empty-state, no console/page errors.

#### 3.3. Client actions menu

**File:** `tests/view-client/actions-menu.spec.ts`

**Steps:**
  1. Click 'Client actions' on an ACTIVE client.
    - expect: Menu contains Edit, Applications, Actions, Assign Staff, More. Submenus are not verified in exploration.
  2. Repeat for a PENDING client (e.g. 'QA Client001').
    - expect: Menu items differ appropriately by status (e.g. Activate/Reject/Withdraw expected for pending) - verify and record.

#### 3.4. View PENDING client details

**File:** `tests/view-client/pending-client.spec.ts`

**Steps:**
  1. From the list click a PENDING client such as 'QA Client001'.
    - expect: Status chip PENDING; Activation Date absent or blank; accounts section empty. Note: some PENDING rows in the list show 'Activated 12 September 2026' - verify whether this is a data inconsistency.

#### 3.5. View closed client details

**File:** `tests/view-client/closed-client.spec.ts`

**Steps:**
  1. Tick 'Show Closed Accounts' on the list, open a closed/withdrawn/rejected client if one exists (precondition: such data may not exist).
    - expect: Status chip shows the closed status and actions menu offers appropriate options (e.g. Reactivate).

#### 3.6. Direct URL to client and invalid client ID

**File:** `tests/view-client/direct-url.spec.ts`

**Steps:**
  1. Navigate to #/clients/199/general while logged in.
    - expect: Details page loads.
  2. Navigate to #/clients/999999/general.
    - expect: Observed: an error toast 'Client not found with valuer 999999.' (typo 'valuer') with Close button, and the app stays on/returns to the previously viewed client rather than a proper not-found page - report.
  3. Navigate to #/clients/abc/general.
    - expect: Handles gracefully with an error message, no blank screen.

#### 3.7. Unauthenticated access to client details

**File:** `tests/view-client/unauthenticated.spec.ts`

**Steps:**
  1. In a fresh browser context (no session) open https://demo.mifos.community/#/clients/199/general.
    - expect: Redirected to #/login with returnUrl; after login returns to the requested page.

#### 3.8. Navigate back to list from details

**File:** `tests/view-client/back-to-list.spec.ts`

**Steps:**
  1. On details click the 'Clients' breadcrumb and browser Back.
    - expect: List is shown; Back returns to details; search term/pagination state behaviour is recorded.
