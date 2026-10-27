import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "FoodieHub — Good food, good mood",
  description: "Freshly made favourites delivered from our kitchen to your door."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}