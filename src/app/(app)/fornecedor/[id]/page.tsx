import { SupplierDetailView } from "@/components/compras/supplier-detail-view";
import { FORNECEDORES } from "@/lib/catalog";
import { notFound } from "next/navigation";

export default async function FornecedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(id in FORNECEDORES)) {
    notFound();
  }
  return <SupplierDetailView fornKey={id} />;
}
