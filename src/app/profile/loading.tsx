import Layout from "@/components/Layout";
import ProfileSkeleton from "@/components/ProfileSkeleton";

export default function ProfileLoading() {
  return (
    <Layout>
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{ background: "#FAFAFA", borderBottom: "0.5px solid rgba(10,10,10,0.06)" }}
      >
        <div className="skeleton rounded w-24 h-5" />
        <div className="skeleton rounded-full w-8 h-8" />
      </div>
      <ProfileSkeleton />
    </Layout>
  );
}
