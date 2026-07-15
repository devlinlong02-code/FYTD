import MobileNav from "./MobileNav";

interface LayoutProps {
  children: React.ReactNode;
  background?: string;
}

export default function Layout({ children, background }: LayoutProps) {
  return (
    <div className={`min-h-screen ${background ?? ""}`} style={{ background: background ? undefined : "var(--page-bg)" }}>
      <main className="max-w-md mx-auto pb-24">{children}</main>
      <MobileNav />
    </div>
  );
}
