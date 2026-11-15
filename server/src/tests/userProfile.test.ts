import assert from 'node:assert/strict';
import test from 'node:test';
import User from '../models/User.js';

const account = {
    firstName: 'Test', lastName: 'Student',
    email: 'profile@example.com', password: 'hashed-password',
};

const profile = {
    major: 'Computer Science',
    courses: ['COP4331'],
    availability: [{ dayOfWeek: 1, startMinute: 600, endMinute: 720 }],
};

test('major is required but courses, availability, and gender may be omitted', async () => {
    for (const major of [undefined, '   ']) {
        await assert.rejects(new User({ ...account, profile: { major } }).validate());
    }
    const user = new User({ ...account, profile: { major: 'Computer Science' } });
    await user.validate();
    assert.ok(user.profile);
    assert.deepEqual(Array.from(user.profile.courses), []);
    assert.equal(user.profile.availability.length, 0);
    assert.equal(user.profile.gender, undefined);
});

test('profile normalizes course codes and accepts weekly availability without gender', async () => {
    const user = new User({ ...account, profile: {
        major: ' Computer Science ',
        courses: [' cop4331 ', 'cop3503'],
        availability: [{ dayOfWeek: 1, startMinute: 600, endMinute: 720 }],
    } });
    await user.validate();
    assert.ok(user.profile);
    assert.equal(user.profile.major, 'Computer Science');
    assert.equal(user.profile.gender, undefined);
    assert.deepEqual(Array.from(user.profile.courses), ['COP4331', 'COP3503']);
});

test('availability rejects invalid days, fractions, bounds, and reversed intervals', async () => {
    for (const slot of [
        { dayOfWeek: 7, startMinute: 600, endMinute: 720 },
        { dayOfWeek: 1.5, startMinute: 600, endMinute: 720 },
        { dayOfWeek: 1, startMinute: -1, endMinute: 720 },
        { dayOfWeek: 1, startMinute: 600.5, endMinute: 720 },
        { dayOfWeek: 1, startMinute: 600, endMinute: 1441 },
        { dayOfWeek: 1, startMinute: 720, endMinute: 600 },
        { dayOfWeek: 1, startMinute: 600, endMinute: 600 },
    ]) {
        await assert.rejects(new User({ ...account, profile: {
            ...profile,
            availability: [slot],
        } }).validate());
    }
});

test('courses cannot be blank', async () => {
    await assert.rejects(new User({
        ...account, profile: { ...profile, courses: ['   '] },
    }).validate());
});
