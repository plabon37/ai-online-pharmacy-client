import MedicineDetails from "@/components/medicines/MedicineDetails";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function MedicineDetailsPage({
  params,
}: PageProps) {
  const { slug } = await params;

  return (
    <MedicineDetails slug={slug} />
  );
}