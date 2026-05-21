import MobileNav from "./MobileNav";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-md mx-auto pb-24">{children}</main>
      <MobileNav />
    </div>
  );
}
