export const EXPENSE_CATEGORIES = [
  "Housing",
  "Utilities",
  "Groceries",
  "Dining",
  "Transportation",
  "Shopping",
  "Health",
  "Education",
  "Entertainment",
  "Subscriptions",
  "Business",
  "Travel",
  "Personal",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Business",
  "Freelance",
  "Refund",
  "Gift",
  "Investment",
  "Other",
] as const;

export const ALL_CATEGORIES = Array.from(
  new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]),
);

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];

export const TIME_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export const CATEGORY_COLORS = [
  "#2855d9",
  "#15a47a",
  "#f08a55",
  "#7a5af8",
  "#e2556f",
  "#31a8b8",
  "#d19b20",
  "#65758b",
];
