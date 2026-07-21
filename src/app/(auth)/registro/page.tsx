"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerOrganization, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(
    registerOrganization,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Crea tu cuenta Intalva
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Da de alta tu negocio para empezar.
        </p>
      </div>

      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="organizationName" className="text-sm font-medium text-slate-700">
          Nombre del negocio
        </label>
        <input
          id="organizationName"
          name="organizationName"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Tu nombre
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-emerald-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
