# Person role pills

Person roles use the same label and pastel palette everywhere, whether associated
with a roaster or a resource. Role colors do not encode permissions or selection
by themselves: labels remain visible, and role selectors also use a checkmark and
`aria-pressed`.

## Source of truth

- [Role presentation registry](../../client/src/lib/personRoles.ts): English
  fallback labels, translation keys, and light/dark color classes.
- [Role pill](../../client/src/components/PersonRolePill.tsx): read-only badges.
- [Role buttons](../../client/src/components/PersonRoleButtons.tsx): selected
  buttons use the same role colors; unselected buttons are neutral.
- Translations: `admin.people.role…` in both
  [English](../../client/public/locales/en/common.json) and
  [French](../../client/public/locales/fr/common.json).

The shared components cover public resource People cards, admin People tables
(desktop and mobile), edit/new resource People cards, and person/roaster editors
and add-person forms. Resource-type badges and account permission roles
(`admin`/`user`) are separate concepts and are not changed by this palette.
Resources listings currently have no person-role displays.

## Palette

All codes below are hex RGB. Light mode uses Tailwind's `100` background, `800`
text, and `200` border. Dark mode uses the `900` background at **40% opacity**,
`200` text, and `800` border; the translucent background blends with the page.

| Stored role | English label | French label | Palette | Light background | Light text | Light border | Dark background (40%) | Dark text | Dark border |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| owner | Owner | Propriétaire | Purple | #f3e8ff | #6b21a8 | #e9d5ff | #581c87 | #e9d5ff | #6b21a8 |
| admin | Admin | Administrateur | Blue | #dbeafe | #1e40af | #bfdbfe | #1e3a8a | #bfdbfe | #1e40af |
| roaster | Roaster | Torréfacteur | Amber | #fef3c7 | #92400e | #fde68a | #78350f | #fde68a | #92400e |
| founder | Founder | Fondateur | Green | #dcfce7 | #166534 | #bbf7d0 | #14532d | #bbf7d0 | #166534 |
| marketing | Marketing | Marketing | Pink | #fce7f3 | #9d174d | #fbcfe8 | #831843 | #fbcfe8 | #9d174d |
| scout | Scout | Découvreur | Lime | #ecfccb | #3f6212 | #d9f99d | #365314 | #d9f99d | #3f6212 |
| employee | Employee | Employé | Teal | #ccfbf1 | #115e59 | #99f6e4 | #134e4a | #99f6e4 | #115e59 |
| alumni | Alumni | Ancien membre | Slate | #f1f5f9 | #1e293b | #e2e8f0 | #0f172a | #e2e8f0 | #1e293b |
| other | Other | Autre | Gray | #f3f4f6 | #1f2937 | #e5e7eb | #111827 | #e5e7eb | #1f2937 |
| creator | Creator | Créateur | Cyan | #cffafe | #155e75 | #a5f3fc | #164e63 | #a5f3fc | #155e75 |
| author | Author | Auteur | Indigo | #e0e7ff | #3730a3 | #c7d2fe | #312e81 | #c7d2fe | #3730a3 |
| contributor | Contributor | Contributeur | Orange | #ffedd5 | #9a3412 | #fed7aa | #7c2d12 | #fed7aa | #9a3412 |
| billing | Billing | Facturation | Yellow | #fef9c3 | #854d0e | #fef08a | #713f12 | #fef08a | #854d0e |
| customer | Customer | Client | Sky | #e0f2fe | #075985 | #bae6fd | #0c4a6e | #bae6fd | #075985 |
| rando | Anonymous | Anonyme | Gray | #f3f4f6 | #1f2937 | #e5e7eb | #111827 | #e5e7eb | #1f2937 |

Billing, Customer, and Anonymous are legacy display labels, not additional role
selector options. Unknown roles keep their readable, title-cased label and use
the neutral Other palette. Display normalization handles whitespace, uppercase,
camelCase, underscores, and hyphens without changing stored values.

## Keeping this current

When adding or changing a role, update the registry, the applicable role-option
lists in [types](../../client/src/types/index.ts), both locale files, and this
table together. Reuse the shared pill/buttons rather than defining page-specific
colors or rendering raw role identifiers.

Run `npm run test:person-roles` from `client/`. Tests compare this table's labels
and exact hex codes against the registry, translations, and resolved Tailwind
configuration, and verify the generated CSS includes the shared role styles.
They also enforce WCAG AA text contrast (at least 4.5:1) for every light palette
and for dark pills composited over the gray-800 and gray-950 card backgrounds.
