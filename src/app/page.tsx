"use client";

import { useScenarioEngine } from "@/hooks/useScenarioEngine";
import { Header } from "@/components/Header";
import { Controls } from "@/components/Controls";
import { Act1Overview } from "@/components/Act1Overview";
import { IncrementalityLab } from "@/components/IncrementalityLab";
import { ResponseCurves } from "@/components/ResponseCurves";
import { ValiuzLogo } from "@/components/ValiuzLogo";
import { Pill } from "@/components/ui";

const ACTS = [
  { n: "ACTE 1", t: "Combien j'ai vendu" },
  { n: "ACTE 2", t: "Combien EN PLUS grâce à la pub" },
  { n: "ACTE 3", t: "Comment réagissent mes leviers" },
];

export default function Home() {
  const engine = useScenarioEngine();

  return (
    <div className="min-h-full">
      <Header
        scenarioKey={engine.scenarioKey}
        onSelect={engine.selectScenario}
      />

      <div className="mx-auto max-w-[1500px] px-5 py-5">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
          {/* Left — controls */}
          <aside className="h-max xl:sticky xl:top-[76px] xl:max-h-[calc(100vh-92px)] xl:overflow-y-auto xl:pr-1">
            <Controls
              scenario={engine.scenario}
              params={engine.params}
              updateParams={engine.updateParams}
              setLeverShare={engine.setLeverShare}
              reset={engine.reset}
            />
          </aside>

          {/* Center — narrative */}
          <main className="min-w-0 space-y-5">
            <section className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    {engine.scenario.enseigne}{" "}
                    <span className="text-muted">· {engine.scenario.brand}</span>
                  </h1>
                  <p className="mt-1 text-sm text-muted">{engine.scenario.category}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ACTS.map((a) => (
                    <Pill key={a.n} color="muted">
                      <span className="font-mono font-semibold text-brand">{a.n}</span> {a.t}
                    </Pill>
                  ))}
                </div>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
                Une même campagne, trois leviers (on-site, off-site / extension d&apos;audience,
                in-store / DOOH), mesurée de bout en bout : attribution closed-loop déterministe,
                incrémentalité exposés-vs-contrôle et courbes de réponse par levier —
                la chaîne de valeur de Valiuz Connect, sur données simulées et seedées.
              </p>
            </section>

            <Act1Overview bundle={engine.bundle} />
            <IncrementalityLab bundle={engine.bundle} />
            <ResponseCurves bundle={engine.bundle} />

            <footer className="border-t border-border pt-4 text-xs leading-relaxed text-muted">
              <div className="mb-3 flex items-center gap-2.5">
                <ValiuzLogo size="sm" />
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  Connect <span className="font-normal text-muted">· Studio de Mesure</span>
                </span>
              </div>
              POC de démonstration — données 100 % simulées et seedées (reproductibles), recalculées
              en direct côté navigateur. La vérité-terrain causale est injectée puis ré-estimée à
              l&apos;aveugle pour valider la méthode. Indicateurs alignés sur la grille CESP « eRetail
              Data Trust » ; conformité opt-in / RGPD reflétée dans le plafond d&apos;activation
              off-site.
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
