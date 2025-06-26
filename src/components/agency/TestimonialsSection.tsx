import React from "react";

const TESTIMONIALS = [
  {
    name: "Awa D.",
    text: "Une équipe très professionnelle et à l'écoute. J'ai trouvé ma maison de rêve grâce à eux !",
    avatar: "/avatars/awa.jpg"
  },
  {
    name: "Mamadou S.",
    text: "Service client impeccable, réactivité et conseils sur-mesure. Je recommande vivement !",
    avatar: "/avatars/mamadou.jpg"
  },
  {
    name: "Fatou N.",
    text: "Un accompagnement du début à la fin, avec beaucoup de sérieux. Merci à toute l'équipe !",
    avatar: "/avatars/fatou.jpg"
  }
];

export function TestimonialsSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-purple-700">Ils nous ont fait confiance</h2>
      <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
        {TESTIMONIALS.map((t, idx) => (
          <div key={idx} className="flex-1 bg-white/70 rounded-3xl shadow-xl p-8 flex flex-col items-center gap-4 backdrop-blur-md hover:scale-105 hover:shadow-2xl transition-transform duration-300">
            <img src={t.avatar} alt={t.name} className="w-20 h-20 rounded-full object-cover border-4 border-pink-200 shadow-lg" />
            <blockquote className="italic text-gray-700 text-center">“{t.text}”</blockquote>
            <div className="mt-2 text-pink-600 font-bold">{t.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
