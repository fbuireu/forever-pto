import { Card, CardContent, CardHeader, CardTitle } from '@const/components/ui/card';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export const LegalLayout = ({ title, lastUpdated, children }: LegalLayoutProps) => {
  return (
    <div className='container mx-auto px-4 py-8 max-w-4xl'>
      <Card>
        <CardHeader>
          <CardTitle className='text-3xl font-bold'>{title}</CardTitle>
          <p className='text-sm text-muted-foreground'>Última actualización: {lastUpdated}</p>
        </CardHeader>
        <CardContent className='prose prose-sm dark:prose-invert max-w-none'>{children}</CardContent>
      </Card>
    </div>
  );
};
