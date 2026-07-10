import { redirect } from "next/navigation";
import Layout from "@/components/Layout";
import { getSession } from "@/lib/dal";
import { getConversations } from "@/app/actions/messages";
import InboxClient from "./InboxClient";

export default async function MessagesPage() {
  const user = await getSession();
  if (!user) redirect("/auth/login?next=/messages");

  const { active, requests } = await getConversations();

  return (
    <Layout>
      <InboxClient active={active} requests={requests} currentUserId={user.id} />
    </Layout>
  );
}
