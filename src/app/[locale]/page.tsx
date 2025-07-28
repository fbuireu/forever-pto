import { Header } from "@ui/modules/components/core/Header";
import { StoreInitializer } from "@ui/modules/components/store/StoreInitializer";
import { cookies } from "next/headers";

export const runtime = "edge";

interface ForeverPtoProps {
  params: Promise<{ locale: string }>;
}

const ForeverPto = async ({ params }: ForeverPtoProps) => {
  const { locale } = await params;
  const cookieStore = await cookies();
  const userCountry = cookieStore.get('user-country')?.value;

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <StoreInitializer userCountry={userCountry} />
       <h1>Hello world {locale}/{userCountry}</h1>
       <Header />
    </div>
  );
};

export default ForeverPto;
