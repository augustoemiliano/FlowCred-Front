import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/api";

const schema = z.object({
  username: z.string().trim().min(1, "Informe o usuário").max(64),
  password: z.string().min(1, "Informe a senha"),
});

type Form = z.infer<typeof schema>;

const SHOW_DEMO_HINT = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_LOGIN === "true";
// Credenciais exibidas na dica (devem bater com INITIAL_ADMIN_* do backend).
const DEMO_USERNAME = import.meta.env.VITE_DEMO_USERNAME || "admin";
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || "admin";

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
      await login(values.username, values.password);
      nav("/", { replace: true });
    } catch (err) {
      const message =
        isAxiosError(err) && err.response?.status === 401
          ? "Usuário ou senha incorretos."
          : apiErrorMessage(err, "Não foi possível entrar. Tente novamente.");
      form.setError("root", { message });
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
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input id="username" type="text" autoComplete="username" placeholder="ex.: admin" {...form.register("username")} />
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
              <p role="alert" className="text-sm text-red-600">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Entrando…" : "Entrar"}
            </Button>
            {SHOW_DEMO_HINT && (
              <p className="text-center text-xs text-muted-foreground">
                Ambiente de demonstração: usuário <code>{DEMO_USERNAME}</code> / senha <code>{DEMO_PASSWORD}</code>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
