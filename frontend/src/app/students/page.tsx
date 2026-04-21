import { Suspense } from "react";
import { StudentsClient } from "@/features/students/StudentsClient";
export default function StudentsPage() {
  return (
    <Suspense>
      <StudentsClient />
    </Suspense>
  );
}
