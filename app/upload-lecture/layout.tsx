import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nahrať prednášku",
  description:
    "Nahrajte prednášku v reálnom čase alebo uploadnite existujúci záznam. AI automaticky vytvorí prepis a študijné materiály.",
  robots: { index: false, follow: false },
};

export default function UploadLectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
