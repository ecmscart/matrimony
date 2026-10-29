import Image from "next/image";

type LogoProps = {
  className?: string;
  title?: string;
};

export default function Logo({
  className,
  title = "Maher Marriage Bureau",
}: LogoProps) {
  return (
    <Image
      src="/images/logo.png"
      alt={title}
      width={961}
      height={734}
      className={className}
      priority
    />
  );
}
