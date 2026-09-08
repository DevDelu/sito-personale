import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { Skills } from "@/components/home/Skills";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Contact } from "@/components/home/Contact";
import { QuizSection } from "@/components/quiz/QuizSection";

export const metadata: Metadata = { title: "Lorenzo De Luca" };

// Il teaser del quiz (top 5 in classifica) è una query diretta a Supabase in
// un Server Component: revalidate qui, a livello di route segment, tiene la
// classifica ragionevolmente fresca senza farla ricalcolare a ogni request.
export const revalidate = 60;

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
      <QuizSection />
      <Skills />
      <FeaturedProjects />
      <Contact />
    </>
  );
}
