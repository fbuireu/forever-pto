import { cookies } from "next/headers";

export const runtime = "edge";

interface ForeverPtoProps {
  params: Promise<{ locale: string }>;
}

const ForeverPto = async ({ params }: ForeverPtoProps) => {
    const { locale } = await params;
    const cookieStore = await cookies();
    const locationCookie = cookieStore.get('location')?.value;

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
          hello world {locale}<br/>
          {locationCookie}
    </div>
  );
};
 
export default ForeverPto;
