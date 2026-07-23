"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginWithCredentials, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(
    loginWithCredentials,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bienvenido de nuevo
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Accede a tu panel de gestión
        </p>
      </div>

      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary hover:bg-[#00A3A8] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60 cursor-pointer"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-center text-sm text-slate-500">
        ¿No tienes cuenta?{" "}
        <Link
          href="/registro"
          className="font-medium text-indigo-600 hover:underline"
        >
          Crea una
        </Link>
      </p>
    </form>
  );
}
