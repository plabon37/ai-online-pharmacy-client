import OrderDetails from "@/components/orders/OrderDetails";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: PageProps) {
  const { id } =
    await params;

  return (
    <OrderDetails orderId={id} />
  );
}