"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store/gameStore";

const SLIDES = [
  {
    title: "НОВОГРАД",
    text: "Город, который не спит. Центр под светом цитадели, окраины — по своим правилам.",
  },
  {
    title: "ЗАКОН И ТЕНЬ",
    text: "Полиция запоминает лицо, одежду, маску. Смени облик — и тебя уже ищут не так уверенно.",
  },
  {
    title: "ТЫ ЗДЕСЬ",
    text: "Деньги, машина, телефон. Выбор за тобой. Добро пожаловать в RUMLE.",
  },
];

export default function Prologue({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const setPrologueDone = useGameStore((s) => s.setPrologueDone);
  const slide = SLIDES[i];

  function next() {
    if (i < SLIDES.length - 1) setI(i + 1);
    else {
      setPrologueDone(true);
      onDone();
    }
  }

  function skip() {
    setPrologueDone(true);
    onDone();
  }

  return (
    <div className="prologue">
      <div className="prologue-card">
        <p className="prologue-kicker">ПРОЛОГ</p>
        <h1>{slide.title}</h1>
        <p className="prologue-text">{slide.text}</p>
        <div className="prologue-dots">
          {SLIDES.map((_, idx) => (
            <span key={idx} className={idx === i ? "on" : ""} />
          ))}
        </div>
        <div className="prologue-actions">
          <button className="secondary" onClick={skip}>
            Пропустить
          </button>
          <button onClick={next}>{i < SLIDES.length - 1 ? "Далее" : "Войти в город"}</button>
        </div>
      </div>
    </div>
  );
}
