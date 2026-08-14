import { useState } from "react";
import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  className?: string;
}

const getInitials = (name: string) => {
  const initials = (name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return initials || "?";
};

const Avatar: React.FC<AvatarProps> = ({ name, imageUrl, className }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-semibold text-brand-800",
        className,
      )}
    >
      {showImage ? (
        <img
          src={imageUrl as string}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

export default Avatar;
