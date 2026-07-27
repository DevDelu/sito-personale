import { UploadForm } from "./upload-form";

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Carica CSV spese</h1>
      <UploadForm />
    </div>
  );
}
