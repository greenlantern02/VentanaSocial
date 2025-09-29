"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import WindowCard from "@/components/window_card";
import { UploadResult } from "@/types/general";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // or from "@/components/ui/use-toast" if using shadcn
import { postWindows } from "@/actions/postWindows";

const schema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.type.startsWith("image/"), "Debe ser una imagen"),
});

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { file: undefined },
  });

async function onSubmit(values: z.infer<typeof schema>) {
  setLoading(true);
  try {
    const data: UploadResult = await postWindows(values.file);
    setResult(data);
    toast.success("Imagen subida correctamente");
  } catch (err: any) {
    toast.error(err.message || "Error inesperado");
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="flex h-full flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6">Sube una foto de ventana</h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-md flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selecciona una imagen</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      field.onChange(e.target.files?.[0] ?? undefined)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Subiendo..." : "Subir imagen"}
          </Button>
        </form>
      </Form>

      {result && <WindowCard window={result} />}
    </main>
  );
}
