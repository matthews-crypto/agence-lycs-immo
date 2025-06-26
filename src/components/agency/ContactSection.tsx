import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin } from "lucide-react";

export function ContactSection({ agency, onSubmit, isSubmitting, name, setName, email, setEmail, phone, setPhone, message, setMessage }: any) {
  return (
    <section className="container mx-auto px-4 py-16" id="contact">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-purple-700">Contactez-nous</h2>
      <div className="flex flex-col md:flex-row gap-10 items-start">
        <form onSubmit={onSubmit} className="flex-1 bg-white/80 rounded-3xl shadow-xl p-8 backdrop-blur-md space-y-6">
          <div className="space-y-2">
            <Input placeholder="Votre nom" value={name} onChange={e => setName(e.target.value)} required />
            <Input type="email" placeholder="Votre email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input type="tel" placeholder="Votre téléphone" value={phone} onChange={e => setPhone(e.target.value)} required />
            <Textarea placeholder="Votre message" value={message} onChange={e => setMessage(e.target.value)} required className="min-h-[100px]" />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-pink-400 to-purple-600 text-white rounded-full" disabled={isSubmitting}>
            {isSubmitting ? "Envoi en cours..." : "Envoyer"}
          </Button>
        </form>
        <div className="flex-1 flex flex-col gap-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl shadow-xl p-8">
          <div className="flex items-center gap-3 text-purple-700"><Phone className="w-6 h-6" /> {agency?.contact_phone}</div>
          <div className="flex items-center gap-3 text-purple-700"><Mail className="w-6 h-6" /> {agency?.contact_email}</div>
          <div className="flex items-center gap-3 text-purple-700"><MapPin className="w-6 h-6" /> {agency?.address}, {agency?.city} {agency?.postal_code}</div>
        </div>
      </div>
    </section>
  );
}
