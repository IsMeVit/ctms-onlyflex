"use client";

import { Film, Volume2, Tv, Armchair, MapPin, Clock, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: Volume2,
    title: "Premium Sound",
    description: "Dolby Atmos surround sound system delivering immersive audio that puts you in the middle of the action.",
  },
  {
    icon: Tv,
    title: "Crystal-Clear Visuals",
    description: "4K laser projection with HDR technology for stunning picture quality and vibrant colors.",
  },
  {
    icon: Film,
    title: "Latest Blockbusters",
    description: "From Hollywood hits to indie gems, we bring you the newest releases before anywhere else.",
  },
  {
    icon: Armchair,
    title: "Ultimate Comfort",
    description: "Luxurious recliner seats with extra legroom and gourmet snacks for the perfect movie experience.",
  },
];

const stats = [
  { value: "5", label: "Screens" },
  { value: "500+", label: "Seats" },
  { value: "100+", label: "Movies" },
  { value: "4.8", label: "Rating" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-black pt-32 pb-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full mb-8">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-400">Your Premier Cinema Experience</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              About
            </span>
            <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent"> OnlyFlex</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Bringing you the latest blockbusters, indie gems, and family favorites in a state-of-the-art environment.
          </p>
        </div>
      </section>

      <section className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all hover:border-red-500/50 hover:bg-zinc-900 hover:shadow-xl hover:shadow-red-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-black via-zinc-950 to-black">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Our Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-zinc-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-black">
        <div className="max-w-3xl mx-auto px-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl text-zinc-300 leading-relaxed mb-6">
              &ldquo;To create unforgettable movie experiences for everyone. Whether you&apos;re here for a date night, family outing, or solo adventure, OnlyFlex is your destination for entertainment.&rdquo;
            </p>
            <p className="text-zinc-500">
              Thank you for choosing OnlyFlex. Sit back, relax, and enjoy the show!
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Get In Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center hover:border-red-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold mb-2">Location</h3>
              <p className="text-zinc-400 text-sm">123 Cinema Street<br />Movie District, MD 12345</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center hover:border-red-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold mb-2">Hours</h3>
              <p className="text-zinc-400 text-sm">Mon - Sun<br />10:00 AM - 11:00 PM</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center hover:border-red-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold mb-2">Contact</h3>
              <p className="text-zinc-400 text-sm">info@onlyflex.com<br />+1 (555) 123-4567</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}