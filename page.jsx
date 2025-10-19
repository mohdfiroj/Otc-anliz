"use client";
import { useState } from "react";

export default function Home() {
  return (
    <main style={{padding:24,fontFamily:"system-ui, sans-serif"}}>
      <h1>OTC Direction Analyzer</h1>
      <p>Open <a href="/analyzer">/analyzer</a> to analyze chart screenshots.</p>
    </main>
  );
}
