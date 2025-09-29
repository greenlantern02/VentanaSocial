// app/actions/postWindows.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function postWindows(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/windows/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Error en el servidor (${res.status})`);
  }

  return res.json();
}
