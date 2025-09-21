import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter'
});

export const metadata = { 
  title: 'Lucid AI', 
  description: 'Demystify your legal documents with AI-powered analysis' 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="shell">
          <main className="main">
            <div className="container">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
