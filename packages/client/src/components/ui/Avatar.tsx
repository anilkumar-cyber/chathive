import clsx from "clsx";
import { UserStatus } from "@nexuschat/shared";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: UserStatus;
  className?: string;
}

const sizeMap: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-24 w-24 text-2xl",
};

const statusColor: Record<UserStatus, string> = {
  [UserStatus.ONLINE]: "bg-emerald-500",
  [UserStatus.AWAY]: "bg-amber-500",
  [UserStatus.BUSY]: "bg-red-500",
  [UserStatus.INVISIBLE]: "bg-gray-400",
  [UserStatus.OFFLINE]: "bg-gray-400",
};

function initials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ src, name, size = "md", status, className }: AvatarProps) {
  return (
    <div className={clsx("relative shrink-0", sizeMap[size], className)}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-500 font-semibold text-white">
          {initials(name)}
        </div>
      )}
      {status && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-surface-dark",
            statusColor[status],
            size === "xl" ? "h-5 w-5" : size === "lg" ? "h-4 w-4" : "h-2.5 w-2.5"
          )}
        />
      )}
    </div>
  );
}
