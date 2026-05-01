import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAxiosError } from "axios";

import { useAuth } from "@/context/AuthContext";

const schema = z.object({
  username: z.string().trim().min(1, "Informe o utilizador").max(64),
  password: z.string().min(1, "Informe a senha"),
});

type Form = z.infer<typeof schema>;

export function LoginPage() {
  const { login, token, loading } = useAuth();
  const nav = useNavigate();
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  if (!loading && token) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values.username.trim(), values.password);
      nav("/", { replace: true });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        const d = err.response.data as { detail?: unknown };
        const msg =
          typeof d?.detail === "string"
            ? d.detail
            : Array.isArray(d?.detail)
              ? (d.detail as { msg?: string }[])
                  .map((x) => x.msg)
                  .filter(Boolean)
                  .join(" · ") || "Verifique utilizador e senha."
              : "Dados inválidos (422).";
        form.setError("root", { message: String(msg) });
        return;
      }
      form.setError("root", { message: "Credenciais inválidas ou serviço indisponível." });
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>FlowCred — gestão de propostas de crédito imobiliário</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Utilizador</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="ex.: admin"
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>
            {form.formState.errors.root && (
              <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
