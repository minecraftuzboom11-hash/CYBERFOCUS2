import './globals.css';

export const metadata = {
  title: 'Quest Dashboard',
  description: 'Dopamine-optimized productivity system'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
