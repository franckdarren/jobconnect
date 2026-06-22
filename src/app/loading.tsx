"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function SplashLoading() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`fixed inset-0 bg-[#0D1B2A] flex flex-col items-center justify-between p-8 transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}
    >
      <div className="flex-1" />

      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center overflow-hidden animate-[pulse_2s_ease-in-out_infinite]">
            <Image
              src="/images/logo.jpg"
              alt="241Job"
              width={96}
              height={96}
              priority
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#2E8B57] flex items-center justify-center">
            <span className="text-white text-xs font-bold">J</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-white tracking-wide">
            241Job
          </span>
          <span className="w-12 h-0.5 bg-[#2E8B57] rounded-full" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-end gap-4 pb-12">
        <p className="text-white/60 text-sm font-medium">
          L&apos;emploi direct au Gabon
        </p>
        <LoadingDots />
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#2E8B57] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
