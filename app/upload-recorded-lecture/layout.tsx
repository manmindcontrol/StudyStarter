import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload záznamu prednášky",
  description:
    "Nahrajte záznam prednášky a AI automaticky vytvorí prepis, poznámky a testové otázky.",
  robots: { index: false, follow: false },
};

export default function UploadRecordedLectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
