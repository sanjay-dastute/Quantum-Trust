import type { Metadata } from 'next';
import ThemeRegistry from '@/components/ThemeRegistry';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AppContextProvider } from '@/context/AppContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuantumTrust',
  description: 'Enterprise Data Security Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <AppContextProvider>
          <ThemeRegistry>
            <DashboardLayout>
              {children}
            </DashboardLayout>
            <ToastContainer position="top-right" autoClose={5000} theme="colored" />
          </ThemeRegistry>
        </AppContextProvider>
      </body>
    </html>
  );
}
