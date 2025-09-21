import './globals.css';
export const metadata = { title: 'Lucid', description: 'Legal documents, simplified' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <main className="main">
            <div className="container">
              <div className="header">
                <div className="muted">Upload your document to get started</div>
              </div>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
