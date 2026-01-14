import { format } from "date-fns";

export const parseTextDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(" ");
  if (parts.length < 2) return null;
  const datePart = parts[0];
  const timePart = parts[1];
  const ampm = parts[2];
  const dateParts = datePart.split("-").map(Number);
  if (dateParts.length < 3) return null;
  const [year, month, day] = dateParts;
  const timeParts = timePart.split(":").map(Number);
  let hour = timeParts[0] || 0;
  const minute = timeParts[1] || 0;
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return new Date(year, month - 1, day, hour, minute);
};

export const formatTextDate = (
  dateStr: string,
  formatType: "date" | "time" | "month" | "day" | "full" = "full"
): string => {
  const parsed = parseTextDate(dateStr);
  if (!parsed) return dateStr;
  if (formatType === "date") return format(parsed, "EEEE, MMM d, yyyy");
  if (formatType === "month") return format(parsed, "MMM");
  if (formatType === "day") return format(parsed, "d");
  if (formatType === "time") {
    const parts = dateStr.split(" ");
    return parts.length >= 3 ? `${parts[1]} ${parts[2]}` : "";
  }
  return format(parsed, "MMM d, h:mm a");
};
