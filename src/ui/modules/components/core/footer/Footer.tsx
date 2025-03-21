export const Footer = () => {
  return <footer className="mt-8 text-center text-sm text-muted-foreground">
    <div className="mb-2 flex flex-wrap justify-center gap-4">
      <div className="flex items-center">
        <div className="mr-2 h-4 w-4 rounded-sm bg-accent/30" />
        <span>Fines de semana</span>
      </div>
      <div className="flex items-center">
        <div className="mr-2 h-4 w-4 rounded-sm border border-yellow-300 bg-yellow-100" />
        <span>Festivos</span>
      </div>
      <div className="flex items-center">
        <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm bg-primary text-primary-foreground">
          <span className="text-xs">P</span>
        </div>
        <span>Días PTO seleccionados</span>
      </div>
      <div className="flex items-center">
        <div className="mr-2 h-4 w-4 rounded-sm bg-green-100 dark:bg-green-900/30" />
        <span>Días sugeridos</span>
      </div>
      <div className="flex items-center">
        <div className="mr-2 h-4 w-4 rounded-sm bg-purple-100 dark:bg-purple-900/30" />
        <span>Alternativas similares</span>
      </div>
    </div>
    <p>
      Los fines de semana y festivos ya están preseleccionados. Haz clic en cualquier día laborable para
      añadirlo como día PTO.
    </p>
    <p>
      Limitations: las sugerencias se basan en los bloques de dias (si se hace hover sobre un grupo de 3 dias
      sugeridos se buscaran alternativas que, con 3 dias de PTO, generen los mismos dias festivos)
    </p>
  </footer>
}