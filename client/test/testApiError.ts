import assert from 'node:assert/strict';
import { getApiErrorMessage } from '../src/lib/apiError';

const bioMessage = 'Bio must be 1000 characters or less. Shorten the biography or leave the existing biography unchanged.';
assert.equal(getApiErrorMessage({
  errors: [{ type: 'field', path: 'bio', msg: bioMessage, value: 'a'.repeat(1001), location: 'body' }],
}, 'HTTP 400'), bioMessage);
assert.equal(getApiErrorMessage({ error: 'Duplicate email' }, 'fallback'), 'Duplicate email');
assert.equal(getApiErrorMessage({ message: 'Save failed' }, 'fallback'), 'Save failed');
assert.equal(getApiErrorMessage({
  errors: [{ msg: 'Invalid role' }, { msg: 'Invalid role' }, { msg: 'Invalid email' }],
}, 'fallback'), 'Invalid role Invalid email');
assert.equal(getApiErrorMessage({
  error: 'Save failed', errors: [{ msg: 'Invalid role' }],
}, 'fallback'), 'Save failed');
for (const data of [null, 'invalid', {}, { errors: [null, 42, { msg: false }] }]) {
  assert.equal(getApiErrorMessage(data, 'fallback'), 'fallback');
}
console.log('testApiError: OK');
