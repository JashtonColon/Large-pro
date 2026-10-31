# UCF Study Buddy Finder — Project Requirements

**Course:** COP4331C — Large Project  
**Prepared:** October 31, 2026  
**Audience:** API, database, web, and mobile developers  
**Status:** Requirements handoff based on team planning. Proposed technical details are explicitly labeled; this is not a description of endpoints already implemented.

## 1. Project purpose

Build a web and mobile application that helps UCF students find compatible study partners for in-person, on-campus meetings. Students provide their courses, academic information, and weekly availability. The system finds eligible students, ranks their compatibility, and lets them request a connection. Email addresses are disclosed only after mutual consent so students can arrange a meeting outside the application.

## 2. Course and platform requirements

The requirements recorded in our planning are:

- Use the MERN stack: MongoDB, Express, React, and Node.js.
- Provide a web application and a mobile application targeting Android/iOS; confirm exact platform submission requirements against the assignment rubric.
- Implement registration, login, email verification, and password reset.
- Provide an initial login/registration interface.
- Perform partial-match searching on the server.
- Use a remotely accessible backend and database shared by the clients.

MongoDB Atlas is the selected database service. The planned backend host is the team's existing DigitalOcean droplet. Web and mobile should use the same backend business rules.

## 3. Minimum viable product

| Area | Required behavior |
| --- | --- |
| Accounts | Register, verify email, log in, and reset a forgotten password. |
| Profile | Save and update academic information and matching preferences. |
| Courses | Select courses from the stored catalog using partial search. |
| Availability | Save weekly availability with separate intervals for each day. |
| Discovery | Find students sharing at least one course and at least 30 continuous minutes of availability. |
| Ranking | Favor more shared courses, academic similarity, and more schedule overlap. |
| Requests | Send, view, accept, and deny study partner requests. |
| Contact sharing | Reveal email only after both students consent. |
| Results | Show suggested partners, relevant profile details, shared courses, and common availability. |
| Connections | Show accepted connections and their permitted contact information. |

In-app messaging is outside the planned scope. The app does not need to book rooms or schedule a formal meeting.

## 4. Accounts and profiles

### Registration and authentication

- Collect first name, last name, UCF email, and password.
- Require email verification. The exact point at which unverified accounts are restricted must be agreed by the team; proposed behavior is to require verification before discovery and connection actions.
- Support password reset through an email-based verification flow.
- Ensure email uniqueness and store password hashes rather than plaintext passwords.
- Authenticate protected API operations and enforce ownership on profile and availability updates.
- Keep database credentials, email credentials, and authentication secrets in backend environment configuration.

The accepted UCF email domain list still needs confirmation; do not hard-code a guessed domain list.

### Profile fields

| Field | Requirement / behavior |
| --- | --- |
| First name and last name | Required account information. |
| UCF email | Required and verified; private until mutual consent. |
| Major | Required. |
| Minor | Optional. |
| Courses | References to selected catalog courses; at least one is necessary to receive eligible matches. |
| Weekly availability | User-level schedule, independent of individual courses. |
| Gender | Choices discussed: Male, Female, Prefer not to say, Other. Whether answering is mandatory remains to be decided. |
| Gender preference | Default: no preference. Optional Male/Female filter. |

A student may have an incomplete profile while setting up their account; the precise profile-completion rules should be agreed before implementation. A student without a selected course or qualifying availability cannot produce an eligible match.

## 5. Course catalog and partial search

- Store courses in a Courses collection with a stable identifier, prefix, number, and name.
- Let students select a prefix such as COP, MAC, or PHY and type a course number or name to narrow the results.
- Support autocomplete/partial matching through a backend query rather than downloading the complete catalog for client-only filtering.
- Save selected course references on the student profile. Matching should compare stable course identifiers rather than free-text course names.
- Avoid duplicate course selections for a student.

Case-insensitive matching, result limits, and the exact course-search query parameters are proposed implementation details to agree with the clients.

## 6. Weekly availability

### Agreed behavior

- Each student has one weekly availability schedule.
- Keep Monday through Sunday distinct.
- Allow multiple intervals on the same day, such as Monday 10:00–11:00 and 15:00–16:00.
- Availability belongs to the student, not to a particular course.
- Apply the planned minimum interval duration of 30 minutes.
- Compare intervals on the same weekday. A qualifying match needs at least one continuous overlap of 30 minutes.

### Proposed API representation

Use integer minutes after midnight to make comparisons straightforward. This is a proposed data contract, not a confirmed existing schema.

```json
{
  "timezone": "America/New_York",
  "days": [
    {
      "day": "Monday",
      "intervals": [{ "start": 900, "end": 960 }]
    },
    {
      "day": "Friday",
      "intervals": [{ "start": 780, "end": 960 }]
    }
  ]
}
```

This example means Monday 3:00–4:00 PM and Friday 1:00–4:00 PM. An absent day or empty interval list means no availability on that day; use one consistent convention across clients.

Proposed validation: require integer values, `0 <= start < end <= 1440`, and `end - start >= 30`. Sort intervals and merge overlapping/adjacent intervals, or reject conflicting input consistently, to avoid double-counting availability. Represent an overnight interval as separate intervals on consecutive days if overnight availability is supported.

For two intervals on the same day:

```text
overlapStart = max(startA, startB)
overlapEnd   = min(endA, endB)
overlapMinutes = max(0, overlapEnd - overlapStart)
```

Example: Monday 3:00–4:00 PM and Monday 3:30–5:00 PM overlap from 3:30–4:00 PM, so the pair satisfies the 30-minute requirement. Separate 15-minute overlaps do not satisfy a 30-minute continuous minimum.

Return common day/time intervals so clients can explain a match. Compute total overlap from normalized intervals without counting the same minutes more than once.

### Refresh policy still open

A per-user one-week availability timer was discussed but not finalized. Confirm whether this means expiration, a reminder, or a required reconfirmation, and whether updating availability restarts the timer. Do not automatically erase schedules based on this draft. Treat the schedule as recurring weekly availability until the team agrees otherwise.

## 7. Matching and ranking

### Eligibility rules

A candidate must:

1. Be another student, excluding the requesting student.
2. Share at least one selected course.
3. Share at least one continuous availability interval of 30 minutes or longer on the same day.
4. Pass the applicable gender preference rule.

With no gender preference, do not exclude candidates by gender. A Male preference shows only candidates identifying as Male; a Female preference shows only candidates identifying as Female. Prefer not to say and Other do not satisfy either specific filter.

The team must confirm whether a saved gender preference is enforced in both directions or only for the student performing the search. Do not assume these behaviors are equivalent.

### Ranking eligible candidates

The intended ranking favors more shared courses, a shared major/minor, and more overlapping availability. Shared courses and major should receive priority; schedule contribution should increase with common available time.

A possible implementation is:

```text
score = courseWeight * sharedCourseCount
      + majorWeight * majorMatch
      + minorWeight * minorMatch
      + overlapWeight * totalOverlapMinutes
```

Exact weights, normalization, ties, and the meaning of a minor match are not finalized. Tune the minute contribution so long schedules do not unintentionally overwhelm course/major priorities. Eligibility is checked before scoring; a high score cannot compensate for no shared course or insufficient overlap.

An interval-comparison algorithm is needed to find common availability. Selecting an optimal set of study sessions is a separate problem and is not required for the MVP.

## 8. Requests, connections, and email privacy

- An eligible student can send a study partner request.
- The recipient can view incoming requests and accept or deny them.
- Students can view outgoing request status and accepted connections.
- A denial does not permanently prevent a later request.
- Email remains hidden in search, public profile details, request listings, and other API responses until mutual consent is established.
- Email disclosure must be enforced on the server, including direct profile/detail requests.

Proposed request states are `pending`, `accepted`, and `denied`. Prevent duplicate pending requests and self-requests. Agree how to handle a request sent in the opposite direction while one is already pending.

**Consent decision still required:** The team may define sending a request as the sender's consent and accepting as the recipient's consent, or implement separate consent actions after acceptance. Either design must make the action clear to users and reveal email only after both parties consent. Acceptance alone must not silently imply a policy the interface never communicated.

## 9. Proposed backend responsibilities

These are capability groups, not final route names or a claim about existing implementation.

| Capability | API responsibility |
| --- | --- |
| Authentication | Register, verify email, log in, initiate reset, and complete reset. |
| Own profile | Retrieve and update the authenticated student's profile and selected courses. |
| Course search | Return partial matches for prefix, number, and/or course name. |
| Availability | Retrieve, validate, and save the authenticated student's weekly schedule. |
| Discovery | Apply eligibility filters, compute overlap and ranking, and return safe candidate details. |
| Requests | Create a request, list incoming/outgoing requests, and accept or deny authorized requests. |
| Connections | Return accepted partners and disclose email only when consent permits it. |

Proposed persistence groups are Users, Courses, and connection/request records. Availability may be embedded in Users. Exact collection names, field names, route paths, authentication format, pagination, and response/error shapes should be agreed with the API developer and both clients.

Recommended backend baseline: validate all inputs, reject unauthorized changes, never expose password hashes or verification/reset tokens, expire and invalidate verification/reset tokens appropriately, and use HTTPS for deployed traffic. These are implementation recommendations supporting the account and privacy requirements.

## 10. Optional features

The following are nice-to-have features, not MVP commitments:

- Hobbies and hobby-based ranking.
- Blocking students.
- Revoking contact-sharing consent.
- Notifications beyond required account verification/reset emails.
- Administrative tools and extended matching preferences.

If revocation is added, it can stop future API disclosure but cannot retract an email address already seen by another student.

## 11. Acceptance checklist

- A student can register, verify their email, log in, and reset their password.
- Profile edits persist and are visible when the same account uses web or mobile.
- Partial course input produces results from a server query; selected courses persist.
- A student can store different intervals for Monday and Friday and multiple intervals on one day.
- Invalid availability is rejected with a useful error.
- Students with no shared course are excluded regardless of academic similarity.
- A continuous overlap of exactly 30 minutes qualifies; a 29-minute overlap does not.
- The student's own account never appears as a candidate.
- Gender filtering follows the selected rule, including no preference.
- Candidates are ordered using the agreed ranking settings and include shared courses/common times.
- A request can be sent, viewed, accepted, or denied; a denied pair can request again.
- A user cannot accept or deny a request addressed to another user.
- Email is absent from unauthorized responses and is available only after mutual consent.
- Password hashes and account tokens never appear in ordinary API responses.

## 12. Decisions to settle before locking the API contract

1. Accepted UCF email domains and verification restrictions.
2. Final field names, routes, authentication mechanism, and response/error formats.
3. Whether gender is required and whether preferences apply in one or both directions.
4. Final matching weights and tie-breaking.
5. Availability refresh/expiration behavior and timezone convention.
6. Whether requesting/accepting grants email consent or separate consent actions are needed.
7. Handling duplicate/reverse requests and existing connections in discovery.
8. Exact mobile platform and submission requirements from the course rubric.

**Scope note:** This document captures the project requirements discussed so far. Items marked proposed or open are implementation choices for team agreement, not additional confirmed course requirements. Validate course-specific deliverables against the official rubric.
