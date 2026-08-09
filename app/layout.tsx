import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://bookhomephysio.com"),
  title: {
    default: "BookHomePhysio — Expert Physiotherapy at Your Home",
    template: "%s | BookHomePhysio",
  },
  description:
    "Book verified home physiotherapists in Chandigarh, Mohali & Panchkula for post-surgery recovery, sports injuries and pain management. Verified professionals, at your doorstep.",
  openGraph: {
    siteName: "BookHomePhysio",
    title: "BookHomePhysio — Expert Physiotherapy at Your Home",
    description: "Verified physiotherapists, at your doorstep.",
    images: [{ url: "/logo.png" }],
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: "BookHomePhysio",
  url: "https://bookhomephysio.com",
  logo: "https://bookhomephysio.com/logo.png",
  areaServed: ["Chandigarh", "Mohali", "Panchkula"],
  slogan: "Expert Care, At Your Doorstep",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <Navbar />
        {children}
      </body>
    </html>
  );
}