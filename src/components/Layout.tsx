import MobileNav from "./MobileNav";

interface LayoutProps {
  children: React.ReactNode;
  background?: string;
}

export default function Layout({ children, background = "bg-white" }: LayoutProps) {
  return (
    <div className={`min-h-screen ${background}`}>
      <main className="max-w-md mx-auto pb-24">{children}</main>
      <MobileNav />
    </div>
  );
}
