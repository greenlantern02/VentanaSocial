"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://localhost:8000/api/windows/", {
          method: "GET",
        });

        if (!res.ok) {
          throw new Error(`Error en el servidor (${res.status})`);
        }

        const data = await res.json();
        setResults(data);
      } catch (err: any) {
        setError(err.message || "Error inesperado.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <p className="text-center mt-8">Cargando...</p>;
  if (error) return <p className="text-red-500 text-center mt-8">{error}</p>;

  return (
    <main className="flex flex-col items-center justify-center p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
        {results.map((item) => {
          let aiData;
          try {
            aiData = JSON.parse(item.ai.replace(/```/g, "").replace(/^"+|"+$/g, ""));
          } catch {
            aiData = { description: "No disponible", structured_data: {} };
          }

          return (
            <div key={item.id} className="border rounded-lg p-4 shadow">
              <img
                src={item.imageUrl}
                alt={aiData.description || "Ventana"}
                className="w-full h-auto rounded mb-4"
              />
              <p>
                <span className="font-medium">Descripción:</span>{" "}
                {aiData.description}
              </p>
              <p>
                <span className="font-medium">Structured Data:</span>{" "}
                <pre>{JSON.stringify(aiData.structured_data, null, 2)}</pre>
              </p>
              <p>
                <span className="font-medium">Hash:</span> {item.hash}
              </p>
              <p>
                <span className="font-medium">Duplicado:</span>{" "}
                {item.isDuplicate ? "Sí" : "No"}
              </p>
              <p>
                <span className="font-medium">Fecha:</span>{" "}
                {new Date(item.createdAt * 1000).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
