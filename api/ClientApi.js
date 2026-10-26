const { expect } = require('@playwright/test');

const API = '/fineract-provider/api/v1';
const HEADERS = {
  'Fineract-Platform-TenantId': 'default',
  Authorization: 'Basic ' + Buffer.from('mifos:password').toString('base64'),
};
const PERMANENT_ADDRESS_TYPE_ID = 46; // from GET /clients/template → address.addressTypeIdOptions

// Mifos date format, e.g. "26 October 2026"
function today() {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Creates a client through the API (fast test-data setup) and returns its details.
async function createClient(request, { firstname, lastname, externalId, mobileNo, active = false }) {
  const data = {
    officeId: 1, // Head Office
    legalFormId: 1, // Person
    firstname,
    lastname,
    externalId,
    mobileNo,
    active,
    submittedOnDate: today(),
    dateFormat: 'dd MMMM yyyy',
    locale: 'en',
    address: [{ addressTypeId: PERMANENT_ADDRESS_TYPE_ID, isActive: true, addressLine1: '1 Test St', city: 'Testville' }],
  };
  if (active) data.activationDate = today();

  const res = await request.post(`${API}/clients`, { headers: HEADERS, data });
  expect(res.status(), await res.text()).toBe(200);
  const { clientId } = await res.json();

  const client = await (await request.get(`${API}/clients/${clientId}`, { headers: HEADERS })).json();
  return {
    id: clientId,
    firstname,
    lastname,
    displayName: client.displayName,
    accountNo: client.accountNo,
    externalId: client.externalId,
    mobileNo: client.mobileNo,
  };
}

module.exports = { createClient, today };
