import PrescriptionUpload from "@/components/prescription/PrescriptionUpload";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1200px]">
        <PrescriptionUpload />
      </div>
    </main>
  );
}