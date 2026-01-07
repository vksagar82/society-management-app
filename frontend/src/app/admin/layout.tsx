import { AdminLayout } from "./AdminLayout";

export const metadata = {
  title: "Admin - Society Management App",
  description: "Administrator dashboard and controls",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
