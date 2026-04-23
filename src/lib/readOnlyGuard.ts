import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

let installed = false;

const BLOCK_MSG = "Projeto em modo somente leitura. Acesse a RAI para fazer alterações.";

export function installReadOnlyGuard() {
  if (installed) return;
  installed = true;

  // Block writes via PostgREST builder
  const proto: any = Object.getPrototypeOf(supabase.from("hotels"));
  const blocked = ["insert", "update", "delete", "upsert"] as const;
  for (const method of blocked) {
    if (typeof proto[method] === "function") {
      proto[method] = function () {
        toast.error(BLOCK_MSG);
        const err = { message: BLOCK_MSG, code: "READ_ONLY" };
        const thenable = {
          then: (resolve: any) => resolve({ data: null, error: err }),
          select: () => thenable,
          single: () => thenable,
          maybeSingle: () => thenable,
          eq: () => thenable,
          neq: () => thenable,
          match: () => thenable,
          in: () => thenable,
          order: () => thenable,
          limit: () => thenable,
          throwOnError: () => thenable,
        };
        return thenable;
      };
    }
  }

  // Block edge function invocations that mutate data / cost credits
  const fnProto: any = supabase.functions;
  const origInvoke = fnProto.invoke.bind(fnProto);
  const ALLOW_LIST = new Set<string>([
    // read-only / status checks
    "manus-check-status",
  ]);
  fnProto.invoke = async (name: string, options?: any) => {
    if (ALLOW_LIST.has(name)) return origInvoke(name, options);
    toast.error(BLOCK_MSG);
    return { data: null, error: { message: BLOCK_MSG, name: "ReadOnlyError" } };
  };

  // Block storage uploads / removes
  const storage: any = supabase.storage;
  const origFrom = storage.from.bind(storage);
  storage.from = (bucket: string) => {
    const b = origFrom(bucket);
    for (const m of ["upload", "uploadToSignedUrl", "remove", "move", "copy", "update"]) {
      if (typeof b[m] === "function") {
        b[m] = async () => {
          toast.error(BLOCK_MSG);
          return { data: null, error: { message: BLOCK_MSG } };
        };
      }
    }
    return b;
  };
}
