import React, { useState, useEffect } from 'react';
// Rimosse dipendenze da @/components/ui/card e badge
import { Calendar, FileText, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

interface FamilyDashboardData {
  athleteName: string;
  nextMatch: string;
  medicalCertExpiry: string;
  unpaidInstallments: number;
}

const FamilyPortal: React.FC = () => {
  const [data, setData] = useState<FamilyDashboardData | null>(null);

  useEffect(() => {
    // Simulate fetching data for the Family Portal
    const fetchData = async () => {
      // In a real app, you would fetch from the Tenant/Family API
      setTimeout(() => {
        setData({
          athleteName: "Mario Rossi Junior",
          nextMatch: "Sabato 15 Aprile - 15:30 vs Virtus",
          medicalCertExpiry: "2026-05-10",
          unpaidInstallments: 1
        });
      }, 500);
    };
    fetchData();
  }, []);

  if (!data) return <div className="p-8 text-center text-gray-500">Caricamento portale famiglie...</div>;

  const isCertExpiringSoon = new Date(data.medicalCertExpiry).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#E6007E] to-[#0099FF]">
                Area Famiglie
              </span>
            </h1>
            <p className="mt-2 text-gray-600">
              Benvenuto nel portale dedicato al genitore di {data.athleteName}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Scadenze Mediche */}
          <div className="hover:shadow-md transition-shadow border-t-4 border-t-[#E6007E] rounded-xl border bg-white text-gray-950 shadow">
            <div className="flex flex-row items-center justify-between p-6 pb-2">
              <h3 className="text-sm font-medium text-gray-600">Certificato Medico</h3>
              <FileText className="h-4 w-4 text-[#E6007E]" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{data.medicalCertExpiry}</div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                {isCertExpiringSoon ? (
                  <><AlertCircle className="h-3 w-3 text-red-500" /> <span className="text-red-500 font-semibold">In scadenza</span></>
                ) : (
                  <><CheckCircle className="h-3 w-3 text-green-500" /> <span className="text-green-500">Regolare</span></>
                )}
              </p>
            </div>
          </div>

          {/* Card Pagamenti */}
          <div className="hover:shadow-md transition-shadow border-t-4 border-t-[#0099FF] rounded-xl border bg-white text-gray-950 shadow">
            <div className="flex flex-row items-center justify-between p-6 pb-2">
              <h3 className="text-sm font-medium text-gray-600">Situazione Quote</h3>
              <CreditCard className="h-4 w-4 text-[#0099FF]" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold text-gray-900">
                {data.unpaidInstallments > 0 ? `${data.unpaidInstallments} rate da saldare` : 'Tutto saldato'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.unpaidInstallments > 0 ? (
                  <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-red-500 text-white shadow">Azione Richiesta</span>
                ) : (
                  <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-green-500 text-white shadow">Regolare</span>
                )}
              </p>
            </div>
          </div>

          {/* Card Prossimo Impegno */}
          <div className="md:col-span-2 hover:shadow-md transition-shadow rounded-xl border bg-white text-gray-950 shadow">
            <div className="flex flex-row items-center justify-between p-6 pb-2">
              <h3 className="text-sm font-medium text-gray-600">Prossimo Impegno Sportivo</h3>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-lg font-medium text-gray-900">{data.nextMatch}</div>
              <p className="text-xs text-gray-500 mt-1">Sincronizzato col calendario ufficiale della squadra.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyPortal;
