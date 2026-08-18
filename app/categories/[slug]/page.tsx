import CategoryDetails from "@/components/categories/CategoryDetails";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CategoryDetailsPage({
  params,
}: PageProps) {
  const { slug } = await params;

  return (
    <CategoryDetails slug={slug} />
  );
}