import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { Skills } from "@/components/home/Skills";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Contact } from "@/components/home/Contact";

export const metadata: Metadata = { title: "Lorenzo De Luca" };

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <About />
      <Skills />
      <FeaturedProjects />
      <Contact />
    </>
  );
}
