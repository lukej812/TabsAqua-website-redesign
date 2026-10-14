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

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Icon>
  );
}

/** Points down and right, like the reference's card buttons: "jump to it". */
export function ArrowDownRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 7l10 10M17 9v8H9" />
    </Icon>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </Icon>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5.5v13l10.5-6.5Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/** A map pin with a route, for directions. */
export function DirectionsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </Icon>
  );
}

export function MapIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5Z" />
      <path d="M9 4.5v13M15 6.5v13" />
    </Icon>
  );
}

/** A Groupon-style ticket with a perforation. */
export function TicketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 8a2 2 0 0 0 0 4v4.5a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1V12a2 2 0 0 1 0-4V5.5a1 1 0 0 0-1-1h-15a1 1 0 0 0-1 1Z" />
      <path d="M14.5 5v2M14.5 10.5v2M14.5 16v1.5" />
    </Icon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M15.6 14.2c2.4-.3 4.4 1.2 5 4.3" />
    </Icon>
  );
}

/** A laptop, for online learning. */
export function LaptopIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="5.5" width="15" height="10" rx="1.5" />
      <path d="M2.5 18.5h19" />
    </Icon>
  );
}

/** Calm, contained water, for confined-water practice. */
export function PoolIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 9.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
      <path d="M3 14c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
      <path d="M4 18.5h16" />
    </Icon>
  );
}

/** Open water with a horizon and a wave. */
export function WavesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 8.5h19" />
      <path d="M2.5 13c2 0 2-1.5 4-1.5S8.5 13 10.5 13s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 3-1.5" />
      <path d="M2.5 17.5c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 3-1.5" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12 20 4l-6 16-2.5-6.5Z" />
      <path d="m11.5 13.5 4-4" />
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
      <rect x="0.75" y="0.75" width="30.5" height="22.5" rx="2.5" fill="#e2363f" stroke="#0b1a2a" strokeWidth="1.5" />
      <path d="M1.5 1.5h6.2l22.8 17.6v3.4h-6.2L1.5 4.9Z" fill="#f3faf8" />
    </svg>
  );
}
