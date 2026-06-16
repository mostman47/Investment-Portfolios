import './globals.css';

export const metadata = {
  title: 'Investment Portfolios',
  description: 'Track your investment portfolios',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
