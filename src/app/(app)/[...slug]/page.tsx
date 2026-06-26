import { notFound } from "next/navigation";
import { ComingSoonPage } from "@/components/shell/coming-soon";
import { findNavItemByHref } from "@/lib/navigation";

export default async function CatchAllAppPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const pathname = `/${slug.join("/")}`;

  if (!findNavItemByHref(pathname)) {
    notFound();
  }

  return <ComingSoonPage pathname={pathname} />;
}
