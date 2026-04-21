import { Suspense } from "react";
import { EnquiryClient } from "@/features/enquiry/EnquiryClient";
export default function EnquiryPage() {
  return (
    <Suspense>
      <EnquiryClient />
    </Suspense>
  );
}
