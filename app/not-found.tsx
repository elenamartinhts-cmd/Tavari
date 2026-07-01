import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-olive-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8 text-olive-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Página no encontrada</h1>
        <p className="text-gray-500 text-sm mb-6">La dirección que buscas no existe.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-olive-600 text-white text-sm font-medium rounded-lg hover:bg-olive-700 transition-colors"
        >
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
