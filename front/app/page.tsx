// app/page.tsx
"use client";
import WindowCard from "@/components/window_card";
import { useState } from "react";

import { UploadResult } from "@/types/general";

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
        <WindowCard window={result}/>
      )}
    </main>
  );
}