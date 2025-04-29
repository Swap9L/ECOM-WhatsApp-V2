import { Link } from "wouter";

interface CategoryItemProps {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  textColor: string;
  href: string;
}

export default function CategoryItem({ icon, label, bgColor, textColor, href }: CategoryItemProps) {
  return (
    <Link href={href}>
      <a className="flex-none w-20">
        <div className={`${bgColor} rounded-full h-20 w-20 flex items-center justify-center mb-2`}>
          <div className={textColor}>{icon}</div>
        </div>
        <p className="text-xs text-center font-medium">{label}</p>
      </a>
    </Link>
  );
}
