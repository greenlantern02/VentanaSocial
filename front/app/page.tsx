// app/page.tsx
"use client";
import { useState } from "react";

interface StructuredData {
  daytime?: string;
  location?: string;
  type?: string;
  material?: string;
  panes?: string;
  covering?: string;
  openState?: string;
}

interface UploadResult {
  id: string;
  hash: string;
  isDuplicate: boolean;
  createdAt: number;
  imageUrl: string;
  description?: string;
  structured_data: StructuredData;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Por favor selecciona una imagen.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/api/windows", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Error en el servidor (${res.status})`);
      }

      const data: UploadResult = await res.json();
      console.log("result", data);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6">Sube una ventana 🪟</h1>
      
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md flex flex-col gap-4"
      >
        <label
          htmlFor="file"
          className="block text-sm font-medium text-gray-700"
        >
          Selecciona una imagen
        </label>
        <input
          id="file"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? "Subiendo..." : "Subir imagen"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 text-red-600 font-medium"
        >
          {error}
        </p>
      )}

      {result && (
        <div className="mt-8 w-full max-w-lg border rounded-lg p-4 shadow">
          <h2 className="text-xl font-semibold mb-2">Resultado</h2>
          
          <img
            src={result.imageUrl}
            alt={result.description || "Ventana subida"}
            className="w-full h-auto rounded mb-4"
          />

          <div className="space-y-2">
            <p>
              <span className="font-medium">Descripción:</span>{" "}
              {result.description || "No disponible"}
            </p>

            <div>
              <span className="font-medium">Datos Estructurados:</span>
              <div className="mt-2 bg-gray-50 p-3 rounded text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Momento:</strong> {result.structured_data.daytime || "N/A"}</div>
                  <div><strong>Ubicación:</strong> {result.structured_data.location || "N/A"}</div>
                  <div><strong>Tipo:</strong> {result.structured_data.type || "N/A"}</div>
                  <div><strong>Material:</strong> {result.structured_data.material || "N/A"}</div>
                  <div><strong>Paneles:</strong> {result.structured_data.panes || "N/A"}</div>
                  <div><strong>Cobertura:</strong> {result.structured_data.covering || "N/A"}</div>
                  <div className="col-span-2"><strong>Estado:</strong> {result.structured_data.openState || "N/A"}</div>
                </div>
              </div>
            </div>

            <p>
              <span className="font-medium">Hash:</span>{" "}
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                {result.hash}
              </span>
            </p>

            <p>
              <span className="font-medium">Duplicado:</span>{" "}
              <span className={`px-2 py-1 rounded text-xs ${
                result.isDuplicate 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {result.isDuplicate ? "Sí" : "No"}
              </span>
            </p>

            <p>
              <span className="font-medium">Fecha:</span>{" "}
              {new Date(result.createdAt * 1000).toLocaleString()}
            </p>

            <p>
              <span className="font-medium">ID:</span>{" "}
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                {result.id}
              </span>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}