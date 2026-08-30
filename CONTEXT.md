# PTO Planning

Forever PTO turns a fixed budget of paid days off into the longest possible stretches away from work, by placing them next to the days that are already free. This glossary is the ubiquitous language for that problem: one canonical name per concept, and the competing names we have deliberately retired.

## Planning inputs

**PTO Day**:
One day from the user's annual budget of paid days off. It is a unit of budget, not a date on the calendar; a PTO Day only becomes a specific date once a Suggestion places it.
_Avoid_: vacation day, day off, holiday

**Country**:
The territory whose Holiday calendar drives the plan. It is detected on first visit and can be overridden; it is never inferred from the user's language.
_Avoid_: locale

**Region**:
An administrative subdivision of a Country with its own calendar: it may add Holidays the Country does not have, and it may drop national ones it does not observe. Optional: a plan without a Region uses the national calendar whole.
_Avoid_: state

**Carry-over Months**:
How many months past the end of the planning year the user is still allowed to spend this year's PTO Days in.

**Planning Window**:
The full span the planner considers: the chosen year plus its Carry-over Months. Holidays outside it are still shown for context but cannot anchor a Bridge.
_Avoid_: selected range, date range

**Strategy**:
The rule that decides which Bridges make it into a Suggestion when the PTO budget cannot cover them all. Three exist: Grouped, Optimized and Balanced.
_Avoid_: filter, algorithm

## The calendar

**Holiday**:
A public non-working day that the user does not have to spend a PTO Day on. In this product "holiday" never means time off taken voluntarily; that is a PTO Day. English user-facing copy may say "public holiday", and only there: the bare word means vacation in British English, which is the one thing a Holiday is not, so the qualifier is what keeps the sentence unambiguous. Every other language has a single word for it and needs no qualifier. In code, in identifiers and in these documents the term is Holiday.
_Avoid_: bank holiday, vacation, day off

**Holiday Variant**:
Where a Holiday comes from: National, Regional or Custom. It drives how the Holiday is displayed and whether the user may edit it.
_Avoid_: type, kind, category

The word "type" is reserved: the upstream holiday data uses it for a classification of its own, so it must never be reused for the Variant.

**Custom Holiday**:
A non-working day the user added or overrode themselves, for company closures, local festivities, or corrections to the published calendar. It outranks a National or Regional Holiday falling on the same date.
_Avoid_: manual holiday

**Workday**:
A date inside the Planning Window that is neither a weekend nor a Holiday, and is therefore a candidate for spending a PTO Day on.
_Avoid_: working day, business day, weekday

**Worked Day**:
A Workday the plan leaves standing: one the user will actually spend working, once Holidays and the PTO Days the plan placed are taken out. Reported as a monthly average, so fewer Worked Days per month is what the budget bought.
_Avoid_: actual working day, business day

**Free Day**:
Any date the user is already off (a weekend or a Holiday) without spending any budget. Free Days are what make Bridges worth building.
_Avoid_: rest day

## The plan

**Bridge**:
A short run of consecutive Workdays that, once spent, joins the Free Days on either side into one continuous stretch off. A Bridge is the unit the planner reasons about; a Suggestion is a set of them.
_Avoid_: bridge day, span

**Suggestion**:
The plan the product recommends: a set of dates on which to spend the PTO budget, under the chosen Strategy. There is exactly one Suggestion at a time.
_Avoid_: plan

**Alternative**:
A different, genuinely distinct Suggestion built from the same budget and calendar, offered so the user can compare trade-offs. Applying an Alternative makes it the Suggestion.
_Avoid_: option, variant

**Suggested Day**:
A date the planner chose. Contrast with a Manual Day, which the user chose.
_Avoid_: auto-assigned day

**Manual Day**:
A date the user assigned by hand, spending budget the planner had not already allocated. Manual Days survive recalculation; Suggested Days do not.
_Avoid_: selected day, custom day

**Removed Day**:
A Suggested Day the user has taken back, returning its budget without rejecting the rest of the Suggestion.
_Avoid_: excluded day

**Remaining Budget**:
The PTO Days the user still has to spend: their budget less every Suggested Day the plan still holds and every Manual Day they added, with Removed Days handed back. It never reads below zero: a plan that overspends reports nothing left rather than a negative allowance, because the user cannot owe days.
_Avoid_: remaining days, available days, unused days

## Measuring a plan

**Effective Day**:
One day of the continuous stretch off that a plan actually produces, counting the Free Days its Bridges absorb. This is the number the product exists to grow.
_Avoid_: actual day off, total off, day off

**Bonus Day**:
An Effective Day that cost no budget: the difference between the stretch the user gets and the PTO Days they spent. Zero Bonus Days means the plan achieved nothing a naive placement would not have.
_Avoid_: extra day, gained day, free day

**Efficiency**:
Effective Days divided by the PTO Days spent to get them. It is the single quality score for a Bridge, a Suggestion or an Alternative, and it is always a ratio, never a percentage. It answers "what did each PTO Day return?"
_Avoid_: multiplier, ratio, performance

**Gain**:
The Effective Days a plan produces beyond the user's whole PTO budget, divided by that budget and shown as a percentage. It answers "how much more did optimising get me than spending my allowance naively?", where Efficiency answers "what did each PTO Day I actually placed return?". The two are measured against different denominators (the budget, against the days actually placed), so they coincide only when the plan spends the budget in full, and part company by whatever it leaves unspent.
_Avoid_: improvement, multiplier, performance

**Long Weekend**:
A stretch of three or more consecutive Free Days that includes both a weekend and at least one weekday off. It is a shape of rest, not a measure of Efficiency.

**Rest Block**:
One separated period of time off within the year, however long. Counting them tells the user whether their rest is concentrated or scattered.
_Avoid_: vacation period, period, break

**Quarter**:
Three consecutive months of the Planning Window, counted from its start rather than from January. A Planning Window is the year plus its Carry-over Months, so it holds five Quarters at the default of one Carry-over Month and up to eight at the maximum of twelve. A Quarter is therefore not a calendar quarter and the fifth one is not an error.
_Avoid_: trimester

**Long Block**:
A Rest Block of three or more consecutive days: the shape most people mean by "a proper holiday". Reported per Quarter to expose imbalance across the Planning Window.

**Longest Vacation**:
The single longest unbroken stretch of Free Days the plan produces. The headline number when a user wants one real trip rather than many small breaks.
_Avoid_: max streak

**Max Work Streak**:
The longest run of consecutive Workdays left standing after the plan is applied. The one metric where lower is better.
_Avoid_: max working period

## Access

**Donation**:
The voluntary payment that unlocks Premium. It is framed as supporting the project, not as buying a licence, and the amount is chosen by the user.
_Avoid_: purchase, subscription

**Premium**:
The tier of the product unlocked by a Donation, covering the advanced metrics and manual editing of a Suggestion. Access is tied to the email address used for the Donation.
_Avoid_: upgrade, subscription
