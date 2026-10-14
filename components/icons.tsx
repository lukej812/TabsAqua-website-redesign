import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 22, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Snorkel mask with a J-tube. */
export function MaskIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 9.5c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v1.8c0 1.9-1.5 3.4-3.4 3.4h-1.3c-.7 0-1.3-.5-1.6-1.1l-.2-.4a1.2 1.2 0 0 0-2.2 0l-.2.4c-.3.6-.9 1.1-1.6 1.1H6.9c-1.9 0-3.4-1.5-3.4-3.4Z" />
      <path d="M20.5 3v11.5a5 5 0 0 1-5 5H13" />
    </Icon>
  );
}

/** Scuba tank with regulator hose. */
export function TankIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="7" width="7" height="14" rx="3.5" />
      <path d="M8.5 7V4.5h2V7M10.5 4.5h3a3 3 0 0 1 3 3v3a2 2 0 0 0 2 2h1" />
      <path d="M6 12h7" />
    </Icon>
  );
}

/** A small fish, for guided tours. */
export function FishIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12c2.5-4 6-5.5 9.5-5.5 3.2 0 5.6 2 7 5.5-1.4 3.5-3.8 5.5-7 5.5C9 17.5 5.5 16 3 12Z" />
      <path d="M3 12 1.5 9M3 12l-1.5 3" />
      <circle cx="15.5" cy="10.8" r=".6" fill="currentColor" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.2 4L19 7" />
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 4h3.2l1.6 4-2 1.3a10 10 0 0 0 4.9 4.9l1.3-2 4 1.6V17a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </Icon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </Icon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
    </Icon>
  );
}

/** Marks links that leave this site for the booking calendar or maps. */
export function ExternalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 5h5v5M19 5l-8 8" />
      <path d="M17 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 18V9a1.5 1.5 0 0 1 1.5-1.5H11" />
    </Icon>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4.5 3.5v-3.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.6-.8 1.1M12 14.6v.1" />
    </Icon>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h2.2l1.5-2h5.6l1.5 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" />
      <circle cx="12" cy="13" r="3.4" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

/**
 * The diver-down flag: red with a white diagonal stripe. Florida boaters know it
 * as "divers below", which is why it marks this site.
 */
export function DiveFlag({
  className,
  title,
  size,
}: {
  className?: string;
  title?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 24"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <rect x="0.75" y="0.75" width="30.5" height="22.5" rx="2.5" fill="#d9483b" stroke="#0a2540" strokeWidth="1.5" />
      <path d="M1.5 1.5h6.2l22.8 17.6v3.4h-6.2L1.5 4.9Z" fill="#f3faf8" />
    </svg>
  );
}
