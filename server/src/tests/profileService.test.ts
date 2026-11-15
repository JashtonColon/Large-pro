import assert from 'node:assert/strict';
import test from 'node:test';
import User from '../models/User.js';
import { parseProfileInput, saveProfile, ProfileError } from '../services/profileService.js';

const profile = {
    major: 'Computer Science', courses: ['COP4331'],
    availability: [{ dayOfWeek: 1, startMinute: 600, endMinute: 720 }],
};

test('account can be created before adding an academic profile', async () => {
    const user = new User({ firstName: 'Test', lastName: 'Student', email: 'test@example.com', password: 'hash' });
    await user.validate();
    assert.equal(user.profile, undefined);
});

test('setup requires major, courses and availability, but not gender', () => {
    assert.deepEqual(parseProfileInput(profile, true), profile);
    for (const input of [null, [], {}, { ...profile, major: '' }, { ...profile, courses: [] }, { ...profile, availability: [] }]) {
        assert.throws(() => parseProfileInput(input, true), ProfileError);
    }
});

test('course codes are normalized and deduplicated for matching', () => {
    assert.deepEqual(parseProfileInput({ courses: [' cop 4331 ', 'COP4331', 'cop3503'] }, false),
        { courses: ['COP4331', 'COP3503'] });
});

test('all edit fields may be omitted, or cleared where supported', () => {
    assert.deepEqual(parseProfileInput({}, false), {});
    assert.deepEqual(parseProfileInput({ gender: '', courses: [], availability: [] }, false),
        { gender: '', courses: [], availability: [] });
    assert.deepEqual(parseProfileInput({ gender: ' Female ', emailVerified: true }, false), { gender: 'Female' });
});

test('malformed edits and invalid availability are rejected', () => {
    for (const input of [
        { major: null }, { major: ' ' }, { courses: [' '] }, { courses: [3] }, { gender: 2 },
        { availability: null }, { availability: [null] },
        ...[
            { dayOfWeek: 7, startMinute: 600, endMinute: 720 },
            { dayOfWeek: 1, startMinute: -1, endMinute: 720 },
            { dayOfWeek: 1, startMinute: 600.5, endMinute: 720 },
            { dayOfWeek: 1, startMinute: 600, endMinute: 1441 },
            { dayOfWeek: 1, startMinute: 600, endMinute: 600 },
        ].map(slot => ({ availability: [slot] })),
    ]) assert.throws(() => parseProfileInput(input, false), ProfileError);
});

test('edit updates only supplied fields and only the authenticated account', async t => {
    const update = t.mock.method(User, 'findOneAndUpdate', async (...args: unknown[]) => {
        assert.deepEqual(args[0], { _id: 'current-user', 'profile.major': { $exists: true } });
        assert.deepEqual(args[1], { $set: { 'profile.gender': 'Female' } });
        return { profile: { ...profile, gender: 'Female' } };
    });
    const result = await saveProfile('current-user', { gender: 'Female' }, false);
    assert.deepEqual(result, { ...profile, gender: 'Female' });
    assert.equal(update.mock.callCount(), 1);
});

test('setup checks profile absence atomically and rejects duplicate setup', async t => {
    t.mock.method(User, 'findOneAndUpdate', async (...args: unknown[]) => {
        assert.deepEqual(args[0], { _id: 'current-user', 'profile.major': { $exists: false } });
        return null;
    });
    await assert.rejects(saveProfile('current-user', profile, true),
        (error: unknown) => error instanceof ProfileError && error.statusCode === 409);
});
