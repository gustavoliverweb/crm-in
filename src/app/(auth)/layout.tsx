import { Check } from "lucide-react";
import logo from "../../../public/logo.png";
import Image from "next/image";

const highlights = [
  "Clientes, agenda y presupuestos conectados",
  "Facturación conforme a Verifactu",
  "Informes y cobros en tiempo real",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 text-lg font-extrabold tracking-tight text-indigo-600">
            <Image src={logo} alt="Logo" width={80} height={80} />
          </div>
          {children}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-indigo-950 px-16 py-12 lg:flex lg:w-1/2 lg:flex-col lg:justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-0 h-full w-3/4 opacity-70 [mask-image:radial-gradient(circle_at_75%_30%,black,transparent_65%)] [background-image:radial-gradient(circle,rgba(129,140,248,0.35)_1.5px,transparent_1.5px)] [background-size:22px_22px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full border border-indigo-400/30 shadow-[0_0_0_34px_rgba(129,140,248,0.06),0_0_0_68px_rgba(129,140,248,0.045)]"
        />

        <div className="relative max-w-sm">
          <p className="text-xs font-semibold tracking-widest text-indigo-300 uppercase">
            Gestión para autónomos y asesorías
          </p>
          <h2 className="mt-4 text-3xl leading-tight font-bold text-white">
            Todo tu negocio, en un solo lugar.
          </h2>
          <ul className="mt-8 space-y-3">
            {highlights.map((highlight) => (
              <li
                key={highlight}
                className="flex items-center gap-3 text-sm text-indigo-100"
              >
                <span className="flex size-5 flex-none items-center justify-center rounded-md bg-indigo-400/20">
                  <Check className="size-3.5 text-indigo-200" />
                </span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
