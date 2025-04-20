import React, { useEffect, useState } from "react";

interface CounterStatProps {
  value: number;
  label: string;
  link: string;
  showPlus?: boolean; // Add + sign conditionally
}

const CounterStat: React.FC<CounterStatProps> = ({ value, label, link, showPlus = false }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1500;
    const increment = end / (duration / 20);

    const counter = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(counter);
        setCount(end);
      } else {
        setCount(Math.ceil(start));
      }
    }, 20);

    return () => clearInterval(counter);
  }, [value]);

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white">
        {count.toLocaleString()}
        {showPlus && "+"}
      </h2>
      <a href={link} className="text-red-500 uppercase text-sm hover:underline">
        {label}
      </a>
    </div>
  );
};

const CounterStats: React.FC = () => {
  return (
    <section className="bg-black py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <CounterStat value={491000} label="STUDENTS REACHED" link="#" showPlus />
          <CounterStat value={5488} label="TEACHERS REACHED" link="#" showPlus />
          <CounterStat value={178} label="CERTIFIED MASTER TEACHERS" link="#" />
          <CounterStat value={29} label="LEAP-QUESTS CONDUCTED" link="#" />
        </div>
      </div>
    </section>
  );
};

export default CounterStats;
