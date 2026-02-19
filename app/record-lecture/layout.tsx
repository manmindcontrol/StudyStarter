import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nahrávanie prednášky",
  description:
    "Nahrávajte prednášku v reálnom čase. AI automaticky vytvorí prepis, poznámky a testové otázky z vašej prednášky.",
  robots: { index: false, follow: false },
};

export default function RecordLectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
