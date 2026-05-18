import './globals.css';

export const metadata = {
  title: 'Comercio Admin',
  description: 'Panel de administracion comercial',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
