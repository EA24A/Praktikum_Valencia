/** Employees who appear on the timesheet and clock-in roster (not owners/admins). */
export function getTimesheetEligibleEmployeeWhere() {
  const terminalEmail = process.env.TERMINAL_USER_EMAIL?.toLowerCase();
  return {
    role: "EMPLOYEE" as const,
    isActive: true,
    isOwner: false,
    ...(terminalEmail ? { email: { not: terminalEmail } } : {}),
  };
}
