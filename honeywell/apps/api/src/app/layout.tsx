export const metadata = {
  title: 'lendlease API',
  description: 'lendlease API Service',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
