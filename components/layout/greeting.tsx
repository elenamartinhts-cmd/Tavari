"use client";

import { useEffect, useState } from "react";

export default function Greeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    const g = h < 13 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
    setGreeting(`${g}, ${firstName}`);
    setDate(now.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  }, [firstName]);

  if (!greeting) return null;

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900">{greeting}</h1>
      <p className="text-gray-500 mt-0.5">{date}</p>
    </div>
  );
}
